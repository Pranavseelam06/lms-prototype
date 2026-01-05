from pydantic import BaseModel
from datetime import date
class AssignmentCreate(BaseModel):
    title: str
    due_date: date
    course_id: int
class AssignmentOut(BaseModel):
    id: int
    title: str
    due_date: date
    course_id: int

    class Config:
        from_attributes = True

