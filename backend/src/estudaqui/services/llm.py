import httpx
import re

DEEPSEEK_ENDPOINT = "http://100.88.78.35:1234/v1/completions"  # Change if needed

def chunk_text(text, max_length=1500):
    chunks = []
    paragraphs = re.split(r"\n\s*\n", text)
    chunk = ""
    for p in paragraphs:
        if len(chunk) + len(p) < max_length:
            chunk += p + "\n\n"
        else:
            chunks.append(chunk.strip())
            chunk = p
    if chunk:
        chunks.append(chunk.strip())
    return chunks

def extract_questions_from_text(text):
    questions = []

    prompt = f"""
You are an AI tutor. Extract structured questions from the following text.
Respond in JSON and only in JSON format. The JSON should contain a list of questions, each with the following fields:
- type: The type of question (e.g., MCQ, True/False, etc.)
- question: The question text.
- options: A list of answer options (if applicable).
- answer: The correct answer.
- explanation: A brief explanation of the answer.                                                 
[
{{
"type": "MCQ",
"question": "...",
"options": ["A", "B", "C", "D"],
"answer": "B",
"explanation": "..."
}}
]

Text:
\"\"\"
{text}
\"\"\"
"""

    response = httpx.post(
        DEEPSEEK_ENDPOINT,
        json={
            "model": "deepseek-r1-distill-qwen-7b",
            "prompt": prompt,
            "max_tokens": 10000,
            "temperature": 0.7,
        },
        timeout=60.0  # total timeout in seconds
    )


    try:
        completion = response.json()["choices"][0]["text"]
        questions.append(completion.strip())
    except Exception as e:
        questions.append({"error": f"Failed to parse response: {str(e)}"})

    return questions
