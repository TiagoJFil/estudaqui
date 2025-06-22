# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`
import asyncio
import json
from io import BytesIO
import base64

from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
from openai import AsyncOpenAI
from traits.trait_types import self
import re
import fitz 
import cv2
import numpy as np
from image_processing.processing import OpenCVProcesser
# For cost control, you can set the maximum number of containers that can be
# running at the same time. This helps mitigate the impact of unexpected
# traffic spikes by instead downgrading performance. This limit is a per-function
# limit. You can override the limit for each function using the max_instances
# parameter in the decorator, e.g. @https_fn.on_request(max_instances=5).
set_global_options(max_instances=10)


initialize_app()

openai_client = AsyncOpenAI()



def extract_images_from_pdf(pdf_path, scale_factor=1.0, dpi=200):
    """
    Extract images from a PDF file and optionally downscale them.
    
    Args:
        pdf_path (str): Path to the PDF file
        scale_factor (float): Scale factor for resizing images (1.0 means 100%, 0.5 means 50%)
        dpi (int): DPI to use when rendering the PDF pages
        
    Returns:
        list: List of OpenCV BGR images
    """
    # render pages to OpenCV images using context manager
    images = []
    # zoom factor based on requested DPI
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    with fitz.open(pdf_path) as doc:
        for page in doc:
            pix = page.get_pixmap(matrix=mat)
            # Convert to numpy array and OpenCV BGR format directly
            img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
            # PyMuPDF creates RGB, convert to BGR for OpenCV
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Apply scaling if needed
            if scale_factor != 1.0:
                h, w = img_bgr.shape[:2]
                new_h, new_w = int(h * scale_factor), int(w * scale_factor)
                img_bgr = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA if scale_factor < 1.0 else cv2.INTER_LINEAR)
            
            images.append(img_bgr)
    
    return images




async def process_image(image, idx: int) -> dict:
    """
    Send a single page-image to OpenAI and return its JSON payload.
    """
    # encode OpenCV BGR image to PNG bytes
    _, image_bytes = cv2.imencode('.png', image)
    
    # base64-encode image for embedding
    b64 = base64.b64encode(image_bytes).decode('utf-8')

    # construct messages
    messages = [
        {
            "role": "system",
            "content": (
                "You are an assistant that extracts all the exam questions "
                "from the provided page image. "
                "Return ONLY valid JSON in this shape:\n"
                "{\n"
                '  "questions": [\n'
                '    { "text": string, "choices": [string,…] },\n'
                '    …\n'
                "  ]\n"
                "}\n"
            )
        },
        { "role": "user", "content": (
            f"Page {idx + 1} image below as base64-encoded PNG:\n"
            f"data:image/png;base64,{b64}"
        ) }
    ]

    # call OpenAI without file attachments
    resp = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )

    # assume the assistant’s reply content is the JSON text
    content = resp.choices[0].message.content
    return json.loads(content)


def merge_jsons(json_list: list[dict]) -> dict:
    """
    Combine multiple question lists into one.
    """
    merged = {"questions": []}
    for j in json_list:
        merged["questions"].extend(j.get("questions", []))
    return merged


async def extract_questions(pdf_path: str, scale_factor=0.5, dpi=200) -> dict:
    """
    Full pipeline: PDF -> images -> OpenAI -> merged JSON.
    
    Args:
        pdf_path (str): Path to the PDF file
        scale_factor (float): Scale factor for resizing images (1.0 means 100%, 0.5 means 50%)
        dpi (int): DPI to use when rendering PDF
    """
    images = extract_images_from_pdf(pdf_path, scale_factor=scale_factor, dpi=dpi)
    tasks = [
        process_image(img, idx)
        for idx, img in enumerate(images)
    ]
    results = await asyncio.gather(*tasks)
    return merge_jsons(results)


@https_fn.on_request()
def on_request_example(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP endpoint that runs the whole pipeline.
    Expects JSON body: { 
        "pdf_path": "some/local.pdf",
        "scale_factor": 0.5,  # optional
        "dpi": 200  # optional
    }
    """
    data = req.json or {}
    path = data.get("pdf_path")
    if not path:
        return https_fn.Response(
            {"error": "missing pdf_path"}, status=400
        )
        
    # Get optional parameters with defaults
    scale_factor = data.get("scale_factor", 0.5)
    dpi = data.get("dpi", 200)

    merged = asyncio.run(extract_questions(path, scale_factor=scale_factor, dpi=dpi))
    return https_fn.Response(merged)




"""
@https_fn.on_request()
def on_request_example(req: https_fn.Request) -> https_fn.Response:
    response = asyncio.run(reqTest())
    print(response)
    return https_fn.Response(response)
"""

def showImages(images):
    """
    Display a list of PIL images in a loop.
    Press 'n' for next, 'p' for previous, 'q' to quit.
    """
    idx = 0
    total = len(images)
    if total == 0:
        print("No images to display.")
        return

    while True:
        img = images[idx]
        img.show()  # This will open the default image viewer
        print(f"Showing image {idx + 1}/{total}. (n)ext, (p)rev, (q)uit.")
        
        key = input().strip().lower()
        if key == 'q':
            break
        elif key == 'n':
            idx = (idx + 1) % total
        elif key == 'p':
            idx = (idx - 1) % total


if __name__ == "__main__":
    import sys
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Extract images from PDF with optional scaling")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--scale", type=float, default=1.0, help="Scale factor (0.5 for 50%, 1.0 for 100%)")
    parser.add_argument("--dpi", type=int, default=200, help="DPI for PDF rendering")
    parser.add_argument("--outdir", default=".", help="Output directory for saved images")
    
    args = parser.parse_args()
    
    images = extract_images_from_pdf(args.pdf_path, scale_factor=args.scale, dpi=args.dpi)
    if not images:
        print("No images extracted.")
    else:
        # Save images to disk
        import os
        os.makedirs(args.outdir, exist_ok=True)
        for i, img in enumerate(images):
            out_path = os.path.join(args.outdir, f"page_{i + 1}.png")
            cv2.imwrite(out_path, img)
            print(f"Saved page {i + 1} as {out_path}")
        print(f"Extracted {len(images)} images from {args.pdf_path} at {args.scale*100:.0f}% scale.")

        # prepare carousel of processed images
        processor = OpenCVProcesser()
        processed_imgs = []
        for img_bgr in images:
            # resize images to 50%
            #h, w = img_bgr.shape[:2]
            #img_bgr = cv2.resize(img_bgr, (int(w * 0.50), int(h * 0.50)), interpolation=cv2.INTER_AREA)
            # process images and get boxes
            processed_boxes = processor.process(img_bgr.copy())
            if not processed_boxes:
                print("No boxes detected in the image.")
                continue
            processed_imgs.extend(processed_boxes)
        # display in loop: n-next, p-prev, q-quit
        idx = 0
        total = len(processed_imgs)
        if total == 0:
            print("No processed images to display.")
            sys.exit(0)
        while True:
            cv2.imshow("Processed Carousel", processed_imgs[idx])
            print(f"Showing processed image {idx+1}/{total}. (n)ext, (p)rev, (q)uit.")
            key = cv2.waitKey(0) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('n'):
                idx = (idx + 1) % total
            elif key == ord('p'):
                idx = (idx - 1) % total
        cv2.destroyAllWindows()


## usage
#import asyncio
#qs = asyncio.run(extract_questions("1pag.pdf"))
#console.log(f"Question {i}: {q['text']}")

