from pydantic import BaseModel
from typing import Optional

class CourseCreate(BaseModel):
    name: str
    teacher_id: int


class CourseOut(BaseModel):
    id: int
    name: str
    teacher_id: int

    class Config:
        from_attributes = True
