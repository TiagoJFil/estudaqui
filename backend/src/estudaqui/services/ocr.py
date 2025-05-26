import pdfplumber
import pytesseract
from PIL import Image
import fitz  # PyMuPDF

def extract_text_from_pdf(path):
    try:
        with pdfplumber.open(path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except:
        return extract_text_with_ocr(path)

def extract_text_with_ocr(path):
    text = ""
    doc = fitz.open(path)
    for page in doc:
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text += pytesseract.image_to_string(img)
    return text
