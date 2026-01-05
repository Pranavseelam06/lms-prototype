# LMS Prototype (Day 4)

## Overview
This is a simple **Learning Management System (LMS) prototype** built with **FastAPI**, **SQLite**, and **plain HTML/JS**.  
It supports **teachers** and **students**, course creation, enrollment, assignments, and submissions. I created the backend using **FastAPI**, **SQLite** used AI scaffolding for the frontend using **plain HTML/JS**.  

---

## Tech Stack
- **Backend:** FastAPI, SQLAlchemy, SQLite
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **API Style:** REST
- **Database:** SQLite (`lms.db`)

---

## Features

### Authentication (Simple / Prototype)
- Fake login using **User ID + Role**
- If the user does not exist, it is auto-created
- No passwords (prototype only)

---

### Teacher Features
- Create courses
- View their courses
- Create assignments for a course
- Assignments include:
  - title
  - task description
  - due date

---

### Student Features
- Join a course using **course name**
- View all assignments from enrolled courses
- Submit assignments
- View past submissions, scores, and feedback (future AI)

---


## How It Works (Flow)

1. User logs in with ID and role
2. Backend creates user if not found
3. Teacher:
   - creates courses
   - adds assignments
4. Student:
   - joins courses
   - sees assignments
   - submits work
5. Submissions are stored and retrievable

---

## Running the Project

```bash
pip install fastapi uvicorn sqlalchemy
uvicorn main:app --reload
```
### open frontend/lms-frontend.html in browser to run the project