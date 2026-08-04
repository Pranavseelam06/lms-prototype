from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from models import user, course, assignment, submission
from models import enrollment
from models.user import User
from routes import auth, user, course, assignment, submission
from security import hash_password, is_password_hash


app = FastAPI()

Base.metadata.create_all(bind=engine)


def migrate_legacy_passwords():
    """Hash plaintext passwords created before password hashing was introduced."""
    db = SessionLocal()
    try:
        legacy_users = db.query(User).filter(User.password.isnot(None)).all()
        changed = False

        for legacy_user in legacy_users:
            if not is_password_hash(legacy_user.password):
                legacy_user.password = hash_password(legacy_user.password)
                changed = True

        if changed:
            db.commit()
    finally:
        db.close()


migrate_legacy_passwords()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(auth.router)
app.include_router(course.router)
app.include_router(assignment.router)
app.include_router(submission.router)

@app.get("/health")
def health():
    return {"status": "ok"}
@app.get("/")
def root():
    return {"status": "alive", "message": "LMS API is running"}
