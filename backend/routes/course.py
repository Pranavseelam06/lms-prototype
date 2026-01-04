from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.course import Course
from models.course import User
from schemas.course import CourseCreate

router = APIRouter(prefix="/courses", tags=["courses"])

@router.post("/", status_code=201)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    db_course = Course(
        name=course.name,
        teacher_id=course.teacher_id,
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/{teacher_id}")
def get_course_teacher(teacher_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == teacher_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
