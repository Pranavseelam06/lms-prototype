# LMS Prototype

## Overview
This project is a **Learning Management System (LMS) prototype** built using **FastAPI**, **SQLite**, and **plain HTML/CSS/JavaScript**.

It supports **teachers** and **students**, allowing teachers to create courses and assignments, students to enroll and submit work, and an **AI-powered grading system** to automatically score submissions and provide feedback.

This is a **prototype**.

---

## Tech Stack

### Backend
- **FastAPI**
- **SQLAlchemy**
- **SQLite**
- **Python**

### Frontend
- **HTML**
- **CSS**
- **Vanilla JavaScript**
- Used **AI-assisted scaffolding** to create the frontend

### AI
- **Google Gemini API**
- AI-based grading and feedback generation
- Creates Follow Up questions to help you learn and understand concepts better

---

## Core Features

### Authentication (Prototype)
- Login using **User ID + Role**
- Users are **auto-created** if they do not exist
- No passwords (intentional for prototype simplicity)
---

### Teacher Features
- Create courses
- View owned courses
- Create assignments for a course
- Assignments include:
  - Title
  - Task description
  - Due date
- AI automatically grades student submissions

---

### Student Features
- Join courses using **course name**
- View assignments from enrolled courses
- Submit assignments
- View:
  - Submission content
  - AI-generated score
  - AI-generated feedback

---

## AI Grading System

Each submission is graded using **Google Gemini**.

### How It Works
1. Assignment task + student answer are sent to Gemini
2. Gemini returns:
   - A score out of 100
   - Short constructive feedback
3. Response is enforced to be **strict JSON**
4. Score and feedback are stored in the database

### AI Prompt Design
- Model is instructed to behave like a teacher and provide individual feedback. 
---

## Application Flow

1. User logs in with ID and role
2. Backend creates user if not found
3. Teacher:
   - Creates courses
   - Adds assignments
4. Student:
   - Joins courses
   - Views assignments
   - Submits work
5. AI grades submission
6. Student can view score and feedback
---

## Running the Project
#### Running the backend
uvicorn main:app --reload
#### Running the frontend
Open the lms-frontend.html to access the grader
### Install dependencies
```bash
pip install fastapi uvicorn sqlalchemy google-generativeai
