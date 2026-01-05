from pydantic import BaseModel
from typing import Optional
class UserCreate(BaseModel):
    name: str
    role: str
    grade_level: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    role: str
    grade_level: Optional[str] = None

    class Config:
        orm_mode = True
