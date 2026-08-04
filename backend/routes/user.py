from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from controllers.user import UserCreate
from models.enrollment import Enrollment
from security import hash_password, password_needs_rehash, public_user, verify_password

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        name=user.name,
        password=hash_password(user.password),
        role=user.role,
        grade_level=user.grade_level
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return public_user(db_user)


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return public_user(user)

@router.post("/login")
def login(user_id: int, name: str, password: str, role: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        # Create new user
        user = User(id=user_id, name=name, password=hash_password(password), role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # User exists, check credentials match
        if not verify_password(password, user.password):
            raise HTTPException(status_code=400, detail="Password is incorrect")
        if user.name != name:
            raise HTTPException(status_code=400, detail="User name does not match ID")
        if user.role != role:
            raise HTTPException(status_code=400, detail="User role does not match ID")

        if password_needs_rehash(user.password):
            user.password = hash_password(password)
            db.commit()

    return public_user(user)

@router.post("/courses/{course_id}/join")
def join_course(course_id: int, student_id: int, db: Session = Depends(get_db)):
    enrollment = Enrollment(
        student_id=student_id,
        course_id=course_id
    )
    db.add(enrollment)
    db.commit()
    return {"message": "Joined course successfully"}
