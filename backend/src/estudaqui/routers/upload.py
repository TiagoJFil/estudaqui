from fastapi import APIRouter, UploadFile, File
from estudaqui.services.ocr import extract_text_from_pdf
from estudaqui.services.llm import extract_questions_from_text
import os

router = APIRouter()

UPLOAD_DIR = "src/estudaqui/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/api/v1/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    text = extract_text_from_pdf(file_path)
    questions = extract_questions_from_text(text)
    return {"questions": questions}
