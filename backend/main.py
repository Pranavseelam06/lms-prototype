from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from models import user, course, assignment, submission
from models import enrollment
from routes import auth, user, course, assignment, submission


app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import user, course, assignment, submission

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
