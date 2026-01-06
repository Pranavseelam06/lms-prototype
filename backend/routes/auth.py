from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User

router = APIRouter(tags=["auth"])

@router.post("/login")
def login(user_id: int, name: str, role: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        # Create new user
        user = User(id=user_id, name=name, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # User exists, check name matches
        if user.name != name:
            raise HTTPException(status_code=400, detail="User name does not match ID")
        if user.role != role:
            raise HTTPException(status_code=400, detail="User role does not match ID")

    return user
