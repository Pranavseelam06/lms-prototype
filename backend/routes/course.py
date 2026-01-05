from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.course import Course
from models.user import User
from controllers.course import CourseCreate
from models.enrollment import Enrollment

router = APIRouter(prefix="/courses", tags=["courses"])

@router.post("/", status_code=201)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    course_exists = db.query(Course).filter(
        Course.name == course.name,
        Course.teacher_id == course.teacher_id
    ).first()

    if course_exists:
        raise HTTPException(status_code=400, detail="Course already exists")

    db_course = Course(
        name=course.name,
        teacher_id=course.teacher_id
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)

    return {"message": "Course created successfully", "course": db_course}


@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/teacher/{teacher_id}")
def get_courses_for_teacher(teacher_id: int, db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.teacher_id == teacher_id).all()
    return courses

@router.post("/enroll/{student_id}", status_code=201)
def enroll_student(course_name: str, student_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.name == course_name).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = Enrollment(
        student_id=student_id,
        course_id=course.id
    )

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment

@router.get("/student/{student_id}/courses")
def get_student_courses(student_id: int, db: Session = Depends(get_db)):
    courses = (
        db.query(Course)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .filter(Enrollment.student_id == student_id)
        .all()
    )
    return courses
