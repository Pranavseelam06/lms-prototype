import os
import google.generativeai as genai
import json

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-pro")

def grade_submission(task: str, student_answer: str):
    prompt = f"""
You are a teacher grading an assignment.

Assignment instructions:
{task}

Student submission:
{student_answer}

Give:
1. A score out of 100
2. Short constructive feedback

Return ONLY valid JSON in this exact format:
{{"score": number, "feedback": "text"}}
"""

    response = model.generate_content(prompt)

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {
            "score": None,
            "feedback": "Model did not return valid JSON.",
            "raw_response": response.text
        }
