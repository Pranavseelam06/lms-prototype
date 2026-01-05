from pydantic import BaseModel
from typing import Optional
class SubmissionCreate(BaseModel):
    content: str
    assignment_id: int
    student_id: int
class SubmissionOut(BaseModel):
    id: int
    content: str
    assignment_id: int
    student_id: int
    score: Optional[int] = None
    ai_feedback: Optional[str] = None

    class Config:
        from_attributes = True
