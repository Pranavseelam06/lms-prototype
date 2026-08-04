from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from security import hash_password, password_needs_rehash, public_user, verify_password

router = APIRouter(tags=["auth"])

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
