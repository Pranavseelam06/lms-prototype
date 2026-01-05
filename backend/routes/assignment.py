from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.assignment import Assignment
from models.course import Course
from controllers.assignment import AssignmentCreate
from models.submission import Submission
from models.enrollment import Enrollment

router = APIRouter(prefix="/courses", tags=["assignments"])


@router.post("/{course_id}/assignments", status_code=201)
def create_assignment(
    course_id: int,
    assignment: AssignmentCreate,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db_assignment = Assignment(
        title=assignment.title,
        due_date=assignment.due_date,
        course_id=course_id
    )

    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)

    return db_assignment

@router.post("/create/assignments", status_code=201)
def create_assignment(
    course_name: str,
    assignment: AssignmentCreate,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.name == course_name).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db_assignment = Assignment(
        title=assignment.title,
        due_date=assignment.due_date,
        course_id=course.id
    )

    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)

    return {"message": "Assignment created", "assignment": db_assignment}

@router.get("/assignments/{assignment_id}")
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.delete("/assignments/{assignment_id}", status_code=200)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()

    return {"Deleted": f"Assignment with id: {assignment_id}"}

@router.get("/{course_id}/assignments/pending/{student_id}")
def get_pending_assignments(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db)
):
    # All assignments in course
    assignments = db.query(Assignment).filter(
        Assignment.course_id == course_id
    ).all()

    # Assignment IDs already submitted
    submitted_ids = db.query(Submission.assignment_id).filter(
        Submission.student_id == student_id
    ).all()

    submitted_ids = {a[0] for a in submitted_ids}

    # Filter
    pending = [
        a for a in assignments if a.id not in submitted_ids
    ]

    return pending

@router.get("/students/{student_id}/assignments")
def get_student_assignments(student_id: int, db: Session = Depends(get_db)):
    assignments = (
        db.query(Assignment)
        .join(Enrollment, Enrollment.course_id == Assignment.course_id)
        .filter(Enrollment.student_id == student_id)
        .all()
    )
    return assignments

