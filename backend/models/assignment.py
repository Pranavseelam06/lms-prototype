from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from database import Base
from .user import User
from .course import Course

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    task = Column(String, nullable = False)
    due_date = Column(Date, nullable = False)
    course_id = Column(Integer, ForeignKey("courses.id"))

    course = relationship("Course", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment")