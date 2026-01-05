from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User

router = APIRouter(tags=["auth"])

@router.post("/login")
def login(user_id: int, role: str, db: Session = Depends(get_db)):
    # validate role
    if role not in ["student", "teacher"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # check if user exists
    user = db.query(User).filter(User.id == user_id).first()

    # if not, create user
    if not user:
        user = User(
            id=user_id,
            name=f"User {user_id}",
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
