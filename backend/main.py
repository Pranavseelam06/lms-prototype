from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from models import user, course, assignment, submission

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import users, courses, assignments, submissions

app.include_router(users.router)
app.include_router(courses.router)
app.include_router(assignments.router)
app.include_router(submissions.router)
