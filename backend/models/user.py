from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    grade_level = Column(String, nullable=True)

    # Relationships
    courses = relationship("Course", back_populates="teacher")
    submissions = relationship("Submission", back_populates="student")
