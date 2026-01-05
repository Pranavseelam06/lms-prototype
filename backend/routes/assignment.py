from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.assignment import Assignment
from controllers.assignment import AssignmentCreate
from models.course import Course

router = APIRouter(prefix="/courses", tags=["assignments"])

@router.post("/{course_id}/assignments", status_code=201)
def create_assignment(course_id: int, assignment: AssignmentCreate, db: Session = Depends(get_db)):
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

@router.get("/{assignment_id}")
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment
@router.delete("/{assignment_id}", status_code=200)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(assignment_id.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    dict_returned = {
    }
    dict_returned["Deleted"] = f"Assignment with id: {assignment_id}"
    return dict_returned




