from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from controllers.user import UserCreate

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        name=user.name,
        role=user.role,
        grade_level=user.grade_level
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
