from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.course import Course
from models.user import User
from models.submission import Submission
from models.assignment import Assignment
from controllers.submission import SubmissionCreate


router = APIRouter(prefix="/assignments", tags=["submissions"])


@router.post("/{assignment_id}/submissions", status_code=201)
def create_submission( assignment_id: int, submission: SubmissionCreate, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    user = db.query(User).filter(User.id == submission.student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_submission = Submission(
        content=submission.content,
        score=None,
        ai_feedback=None,
        assignment_id = assignment_id,
        student_id = submission.student_id,
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission
@router.get("/submissions/{submission_id}")
def get_submission(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission

@router.get("/user/{user_id}/submissions")
def get_submission_user(user_id: int, db: Session = Depends(get_db)):
    submissions = db.query(Submission).filter(Submission.student_id == user_id).all()
    return submissions

@router.get("/{assignment_id}/submissions")
def get_submissions_for_assignment(assignment_id: int, db: Session = Depends(get_db)):
    submissions = db.query(Submission).filter(Submission.assignment_id == assignment_id).all()
    return submissions

@router.put("/{submission_id}")
def update_submission(submission_id: int, updated_data: SubmissionCreate, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    submission.content = updated_data.content
    submission.student_id = updated_data.student_id
    submission.score = updated_data.score
    db.commit()
    db.refresh(submission)
    return submission
@router.delete("/{submission_id}", status_code=200)
def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    db.delete(submission)
    db.commit()
    dict_returned = {
    }
    dict_returned["Deleted"] = f"Submission with id: {submission_id}"
    return dict_returned

