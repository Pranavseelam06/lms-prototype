import os
import json
from google import genai


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
2. Short constructive feedback

Return ONLY valid JSON in this exact format:
{{"Score": number, "Feedback": "text"}}
"""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )

    text = response.text

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "score": None,
            "feedback": "Model did not return valid JSON.",
            "raw_response": text
        }
