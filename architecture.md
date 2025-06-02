🏗️ SOFTWARE ARCHITECTURE (Revised for Accuracy + Budget)
🧱 PHASE 1: PDF INGESTION + CONTEXTUAL SEGMENTATION
✅ Tools:

    PyMuPDF (fitz) – for accurate text + image + layout extraction.

    pdfplumber – for precise bounding boxes + tables (optional).

    pdf2image – to rasterize images for OCR or referencing.

✅ Output:

You want to extract structured document units with layout and spatial metadata:

[
  {
    "page": 1,
    "type": "text",
    "text": "Question 2. What is the purpose of the mitochondria?",
    "bbox": [x0, y0, x1, y1]
  },
  {
    "page": 1,
    "type": "image",
    "image_id": "img_1",
    "bbox": [x0, y0, x1, y1],
    "image_path": "/images/exam1_pg1_img1.png"
  },
  ...
]

🔍 Detect Question Blocks:

Use regex + NLP heuristics to segment into blocks:

    Regex: (?i)question\s*\d+[:.\)]

    Look for lists (A), B), C), etc.) right after

    Anchor adjacent text or images (based on bbox proximity)

📖 Detect Contextual References:

Use a simple engine:

    If a block says "Refer to Figure 2", scan nearby/following pages for "Figure 2"

    Match on Figure, Diagram, Table, or numeric citations ^(1), [^1]

🧠 PHASE 2: AI PARSING (Token-Conscious Strategy)

You’re using GPT-4o-mini, which is great. Here's how to optimize it:
✅ Strategy:

    Preprocess input into question candidates via code, not AI.

    Call GPT once per question, not for the whole PDF.

    Include only relevant text and linked citation text/image captions.

🧠 Sample Prompt (Token-Optimized):

You are an exam parser. Extract the following content into this JSON format:

{
  "question": "...",
  "supplementalContent": "...",
  "questionType": "...",
  "responses": [...],
  "correctResponse": "..."
}

---

QUESTION:
Question 2. What is the purpose of the mitochondria?
A) Protein synthesis
B) Energy production
C) DNA replication
D) Waste removal

Caption from Figure 2: Diagram of a mitochondrion with labeled parts.

➡️ GPT will return a precise JSON structure ready for UI.
🖼️ PHASE 3: HANDLING IMAGES IN QUESTIONS
✅ Detection:

    Use PyMuPDF to extract image metadata and binary.

    Use the bbox coordinates to check proximity to the question block.

✅ Link to Questions:

    If bbox is within ~100px of question or referenced by caption, attach:

{
  "supplementalContent": "See image: ![diagram](https://cdn.examapp.com/exam1_pg2_img1.png)"
}

✅ OCR if Needed (Optional, Budget Sensitive):

Use Tesseract OCR on image only if:

    The question references "Figure/Table X"

    The image has labels/text that are non-trivial (e.g. diagrams)

💰 COST MODEL (PER TOKEN BUDGETING)
Step	Token Usage	Cost Impact
PDF parsing	0 (local tools)	✅ Free
Image extraction	0 (PyMuPDF)	✅ Free
Question AI parsing	~100–200 tokens	✅ Cheap
Vision/OCR (optional)	~300+ (Vision/OCR)	❌ Only if essential

So for ~10 questions per exam, total tokens ≈ 1,000–2,000 (within budget for €0.25).
⚙️ TECH STACK RECOMMENDATION

You’re on Next.js — you can keep it. But for processing PDFs and managing AI calls:
✅ Server Backend (Recommended):

    Python FastAPI / Flask microservice for:

        PDF parsing

        Image detection and storage

        Prompt preparation + AI call

    Store results in DB or cache layer (e.g., Redis/S3)

✅ Frontend (Next.js):

    Fetch pre-parsed JSON

    Display embedded images via CDN

    Render questions dynamically with a UI component engine

🔄 FUTURE-PROOFING

    Add questionCategory, difficulty, topicTag etc. later.

    Detect tables as input fields (tableQuestion) in questionType.

    Add imageAnnotations if user needs to click on diagrams in UI.

✅ ACTION PLAN
Task	Tool	Owner
Replace pdf-parser with PyMuPDF	Python	Backend
Extract and link images	PyMuPDF/pdf2image	Backend
Create contextual chunking engine	Custom regex/NLP	Backend
Create prompt template for GPT-4o-mini	Python/JS	Backend
Add image storage (e.g. S3)	AWS/Cloudinary	DevOps
Integrate output JSON into UI	Next.js	Frontend