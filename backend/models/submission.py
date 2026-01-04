from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from database import Base
from .user import User
from .course import Course
from .assignment import Assignment

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True)
    content = Column(String, nullable=False)
    score = Column(Integer, nullable = True)
    ai_feedback = Column(String, nullable=True)

    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("users.id"))

    student = relationship("User", back_populates="submissions")
    assignment = relationship("Assignment", back_populates="submissions")