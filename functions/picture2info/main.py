# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`
import asyncio
import json
import os

from firebase_functions import https_fn, storage_fn, params
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app, storage
from openai import AsyncOpenAI
from traits.trait_types import self
from firebase_functions.options import MemoryOption
import numpy as np
# For cost control, you can set the maximum number of containers that can be
# running at the same time. This helps mitigate the impact of unexpected
# traffic spikes by instead downgrading performance. This limit is a per-function
# limit. You can override the limit for each function using the max_instances
# parameter in the decorator, e.g. @https_fn.on_request(max_instances=5).
set_global_options(
    max_instances=20,  # Increased instances for better scalability
    region="us-west1", 
    memory=MemoryOption.GB_1,
    timeout_sec=540,  # Increased timeout for larger PDFs
    cpu=1,
    secrets=["OPENAI_API_KEY"]  # Use Firebase Secret Manager for sensitive data
)

MAX_CONCURRENT_OPERATIONS = int(os.environ.get("THREADS", "8"))

initialize_app()

# Get the OpenAI API key from Firebase Secret Manager
openai_api_key = params.SecretParam("OPENAI_API_KEY")
openai_client = AsyncOpenAI(api_key=openai_api_key.value)


async def process_image_gpt(image_link, file_name, model="gpt-4.1") -> dict:
    """
    Send a single page-image to OpenAI and return its JSON payload.
    """
    # construct messages
    messages = [
        {
            "role": "system",
            "content": (
"""You are a professional exam parser.

Your task is to extract all questions from the **provided document only**. Do not use any external knowledge or make assumptions beyond the content shown.
Return the results in **strict, valid JSON** with the following structure (no comments, no trailing commas):

{
  "questions": [
    {
      "question": "string",
      "supplementalContent": "string",
      "questionType": "openEnded" | "multipleChoice" | "other",
      "responses": [ "string", ... ] | null,
      "correctResponses": [ "string", ... ] | null,
      "imgCount": number
    }
  ]
}

### Rules:

1. Use **only** the content from the input document. **Do not infer, invent, or supplement** information.
2. For each question:
   - Set the \`question\` field to the **exact question text** as written.
   - Set the \`supplementalContent\` field to include **all directly attached content necessary to understand the question**, such as:
     - Code snippets
     - Text excerpts
     - Definitions
     - Instructions
   - **Do not reference external content** (e.g., do not write "Leia o excerto..."). If an excerpt or context is present, copy it in full.
   - Set \`imgCount\` to the number of images directly attached to the question, or 0 if none are present.
3. Set \`questionType\` as follows:
- "openEnded": requires a free-text response
- "multipleChoice": includes predefined options
- "other": any other format
4.Set \`responses\` to:
-An array of response options (in exact order and formatting)
-Otherwise "null" if none are present
5. Set  \`correctResponses\` to:
-An array of correct answers, **only if clearly marked** in the document
-Otherwise, set to "null"
6. **Escape all necessary characters** to ensure valid JSON (e.g., quotes, newlines).
7. **Preserve original wording, formatting, and order** exactly as shown in the document.
8. **Do not include explanations, commentary, or any output other than the JSON.**
### Output:

Return **only the JSON object** as described above. Do not include any other text, commentary, or formatting (such as code fences)."""
            )
        },
        { "role": "user",
          "content": [
                {
                    "type": "input_image",
                    "image_url": image_link,
                    "detail": "high"
                },
            ],
        }
    ]
    # call OpenAI without file attachments
    startTime = asyncio.get_event_loop().time()
    resp = await openai_client.responses.create(
        model=model,
        input=messages
    )
    endTime = asyncio.get_event_loop().time()
    print(f"Processed image \"{file_name}\" in {endTime - startTime:.2f} seconds with model {model}.")
    # assume the assistant’s reply content is the JSON text
    content = resp.output_text.strip()

    # validate JSON format
    try:
        content_json = json.loads(content)
        return content_json
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON for file {file_name}: {str(e)}")
        print(f"Raw content: {content[:200]}...")  # Print first 200 chars for debugging
        raise

async def update_pdf_info_firestore(pdf_id: str, page_number: int, result: dict) -> None:
    """
    Update the Firestore document with the processed image results.
    
    Args:
        pdf_id: The ID of the PDF document in Firestore
        page_number: The page number of the image
        result: The processed result from OpenAI
    """
    from firebase_admin import firestore
    db = firestore.client()
    doc_ref = db.collection("test").document(pdf_id)
    
    # Update the document with the new results
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: doc_ref.update({f"questions.{page_number}": result})
    )
    print(f"Updated Firestore document {pdf_id} for page {page_number}.")


async def process_image(image_link, file_name, page_number) -> dict:
    result = await process_image_gpt(image_link, file_name)
    await update_pdf_info_firestore(pdf_id=file_name, page_number=int(page_number), result=result)
    return result

# Helper function for the async processing with proper error handling
async def process_with_timeout(file_link, file_name, page_number, timeout=300):
    try:
        return await asyncio.wait_for(process_image(file_link, file_name, page_number), timeout=timeout)
    except asyncio.TimeoutError:
        print(f"Processing timed out for {file_name}, page {page_number}")
        return None
    except Exception as e:
        print(f"Error processing {file_name}, page {page_number}: {str(e)}")
        return None

@storage_fn.on_object_finalized(bucket="estudaqui-pdf-images")
def process_image_upload(event: storage_fn.CloudEvent) -> None:
    """
    Triggers when a new file is uploaded to the estudaqui-pdf-images bucket.
    Processes the image through the OpenAI pipeline and stores the results.
    
    Args:
        event: The Cloud Storage event
    """
    print(f"Received event: {event.data}")
    bucket_name = event.data.bucket
    file_path = event.data.name
    file_name = file_path.split("/")[-1] if file_path else "unknown"
    file_name = file_name.split("_")[1]
    if bucket_name != "estudaqui-pdf-images":
        print(f"Ignoring file upload in bucket: {bucket_name}")
        return
    
    # encode the file path to be URL safe
    file_path = file_path.replace("/", "%2F")

    # get the link for the file
    file_link = f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/{file_path}?alt=media"
    
    print(f"Using URL: {file_link}")
    page_number = file_path.split("_")[-1].split(".")[0] if "_" in file_path else "unknown"
    if not page_number.isdigit():
        print(f"Invalid page number in file path: {file_path}")
        return
    print(f"Processing new file: {file_path} in bucket: {bucket_name} (page {page_number})")
    
    try:
        # Use the existing event loop instead of creating a new one
        # Cloud Functions already runs within an event loop context
        result = asyncio.run(process_with_timeout(file_link, file_name, page_number, timeout=150))
        
        if result:
            print(f"Successfully processed file {file_path}, page {page_number}")
        else:
            print(f"Failed to process file {file_path}, page {page_number}")
            
    except Exception as e:
        print(f"Critical error processing file {file_path}: {str(e)}")
            



