from pydantic import BaseModel
from datetime import date
from typing import Optional

class AssignmentCreate(BaseModel):
    title: str
    task: str
    due_date: date
    course_id: int
    student_id: Optional[int] = None

class AssignmentOut(BaseModel):
    id: int
    title: str
    task: str
    due_date: date
    course_id: int
    student_id: Optional[int] = None

    class Config:
        from_attributes = True