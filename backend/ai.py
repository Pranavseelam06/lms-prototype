import os
import json
from google import genai
from google.genai import types

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def grade_submission(task: str, student_answer: str):
    prompt = f"""
You are a teacher grading an assignment.

Assignment instructions:
{task}

Student submission:
{student_answer}

Give:
1. A score out of 100
2. Short constructive feedback and ways to improve
3. If Score is below 80 give a follow up question for the student to improve and if not just say none

Return ONLY valid JSON in this exact format:
{{"Score": number, "Feedback": "text", "Follow Up": "text"}}
"""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    text = response.text

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "Score": 0,
            "Feedback": "Model did not return valid JSON.",
            "Follow Up": "none",
            "raw_response": text
        }