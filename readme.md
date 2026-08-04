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
- Login using **User ID + Role + Password**
- Users are **auto-created** if they do not exist
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
  - Follow up question if neccessary

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
5. Follow Up assignment created if score lower than 80. 

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

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd lms
```
### Create a virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate
```
### Install dependencies
```bash
pip install fastapi uvicorn sqlalchemy google-generativeai
```
This project uses Google Gemini for AI grading.
### Set Up Gemini API Key
Create an API key from Google AI Studio, then set it as an environment variable.
```bash
export GEMINI_API_KEY="your_api_key_here"
```
Restart your terminal after setting the key.
### Running the backend
```bash
uvicorn main:app --reload
```
### Running the frontend
The frontend is a static site with no build step. From the repository root, either open `index.html` or serve the directory with any static file server.

### Deploying the frontend to GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages** for the repository.
3. Choose **Deploy from a branch** and select the branch and repository root.
4. Save the Pages configuration.

`index.html` uses relative paths for all frontend assets and communicates with the existing Render API over HTTPS. It does not require Node, server-side rendering, serverless functions, or a runtime application server.
