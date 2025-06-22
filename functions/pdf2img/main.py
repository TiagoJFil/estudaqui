import os
import tempfile
import fitz
import cv2
import numpy as np
import gc
import psutil
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
from firebase_functions import storage_fn, options
from firebase_admin import initialize_app, storage
from firebase_functions.options import set_global_options
from datetime import datetime
from firebase_functions.options import MemoryOption 

# Maximum number of concurrent operations
MAX_CONCURRENT_OPERATIONS = 10

def get_memory_usage():
    """Get current memory usage in MB"""
    process = psutil.Process(os.getpid())
    memory_mb = process.memory_info().rss / 1024 / 1024
    return memory_mb

# Initialize Firebase app

# Configure global options for optimal performance
set_global_options(
    max_instances=20,  # Increased instances for better scalability
    region="us-west1", 
    memory=MemoryOption.GB_1,
    timeout_sec=540,  # Increased timeout for larger PDFs
    cpu=1
)

initialize_app()

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
            img_bgr = extract_image_from_page(page, mat, scale_factor)
            images.append(img_bgr)
    return images

def extract_image_from_page(page, mat, scale_factor=1.0):
    """
    Extract an image from a single PDF page and optionally downscale it.
    
    Args:
        page: The PDF page object
        scale_factor (float): Scale factor for resizing images (1.0 means 100%, 0.5 means 50%)
        dpi (int): DPI to use when rendering the PDF page
        
    Returns:
        np.ndarray: OpenCV BGR image
    """
    # If we're going to resize anyway, we can save memory by applying the scale to the matrix
    # before rendering the pixmap, resulting in a smaller initial image
    if scale_factor != 1.0:
        adjusted_mat = fitz.Matrix(mat.a * scale_factor, mat.b * scale_factor, 
                                  mat.c * scale_factor, mat.d * scale_factor, 
                                  mat.e * scale_factor, mat.f * scale_factor)
        pix = page.get_pixmap(matrix=adjusted_mat)
    else:
        pix = page.get_pixmap(matrix=mat)
    
    # Process the pixmap directly
    img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    # Free the pixmap memory as soon as possible
    del pix
    
    return img_bgr

async def upload_image_async(destination_bucket, destination_path, metadata, image_bytes):
    """
    Upload an image to Firebase Storage asynchronously.
    
    Args:
        destination_bucket: Firebase Storage bucket object
        destination_path (str): Path where the image will be stored
        metadata (dict): Metadata to store with the image
        image_bytes (bytes): The image data as bytes
        
    Returns:
        str: The path where the image was uploaded
    """
    # Create a task for the upload to make it truly non-blocking
    dest_blob = destination_bucket.blob(destination_path)
    dest_blob.metadata = metadata

    # Convert the synchronous upload to asynchronous with asyncio.to_thread
    await asyncio.to_thread(dest_blob.upload_from_string, image_bytes, content_type='image/jpeg')
    return destination_path

async def process_page(page, destination_bucket, pdf_id, page_number, file_name):
    """
    Process a single PDF page and upload the extracted image.
    
    Args:
        page: The PDF page object
        destination_bucket: Firebase Storage bucket object
        pdf_id (str): Unique identifier for the PDF
        page_number (int): Page number to process
        file_name (str): Original file name of the PDF
        
    Returns:
        str: The path where the image was uploaded
    """
    # Make the image extraction and encoding asynchronous
    img_bgr = await asyncio.to_thread(
        extract_image_from_page, 
        page, 
        fitz.Matrix(2, 2), 
        scale_factor=0.63
    )
    
    # Make the image encoding asynchronous too
    buffer = await asyncio.to_thread(
        lambda: cv2.imencode('.jpg', img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])[1]
    )
    image_bytes = buffer.tobytes()
    
    destination_path = f"pdf/{pdf_id}/images/page_{page_number}.jpg"
    metadata = {
        'pdfId': pdf_id,
        'pageNumber': str(page_number),
        'originalFileName': file_name
    }
    
    print(f"Processed image {page_number}, queued for upload")
    return await upload_image_async(destination_bucket, destination_path, metadata, image_bytes)

@storage_fn.on_object_finalized(bucket="estudaqui-pdf-uploads")
def process_uploaded_pdf(event: storage_fn.CloudEvent) -> None:
    """
    Cloud function that triggers when a PDF is uploaded to the specified bucket.
    It extracts images from the PDF and uploads each image asynchronously to another bucket.
    
    Args:
        event: The event payload containing information about the uploaded file
    """
    file_data = event.data
    
    # Get file details from the event
    file_name = file_data.name
    bucket_name = file_data.bucket
    
    # Skip processing if not a PDF file
    if not file_name.lower().endswith('.pdf'):
        print(f"Skipping non-PDF file: {file_name}")
        return
    
    pdf_id = os.path.splitext(os.path.basename(file_name))[0]
    
    print(f"Processing PDF: {file_name} from bucket: {bucket_name}")
    print(f"Initial memory usage: {get_memory_usage():.2f} MB")
      # Download the PDF to a temporary file using streaming
    bucket = storage.bucket(bucket_name)
    blob = bucket.blob(file_name)
    
    # Create a temporary file path
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        temp_path = temp_file.name
    
        
    bucket = storage.bucket(bucket_name)
    blob = bucket.blob(file_name)
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        temp_path = temp_file.name
        blob.download_to_filename(temp_path)
    
    try:
        # Process PDF pages with optimized batch processing and concurrency control
        destination_bucket = storage.bucket("estudaqui-pdf-images")
        zoom = 200 / 72  # Calculate zoom factor based on DPI
        mat = fitz.Matrix(zoom, zoom)
        scale_factor = 0.63
        startingtime = datetime.now()
        startingmemory = get_memory_usage()
        
        # Setup async processing with semaphore to control concurrency
        async def process_pdf_async():
            # Create a semaphore to limit concurrent operations to prevent memory overload
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_OPERATIONS)
            
            # Create a wrapper function to process page with semaphore
            async def process_with_semaphore(page, page_num):
                async with semaphore:
                    return await process_page(page, destination_bucket, pdf_id, page_num, file_name)
            
            # Process the PDF in batches to optimize memory usage
            upload_tasks = []
            batch_size = 5  # Process 5 pages at a time to balance memory and speed
            
            with fitz.open(temp_path) as doc:
                print(f"Opened PDF, total pages: {len(doc)}, memory usage: {get_memory_usage():.2f} MB")
                total_pages = len(doc)
                
                # Process pages in batches
                for i in range(0, total_pages, batch_size):
                    batch_end = min(i + batch_size, total_pages)
                    batch_pages = [doc[j] for j in range(i, batch_end)]
                    
                    # Create processing tasks for this batch
                    batch_tasks = [
                        process_with_semaphore(page, j + 1) 
                        for j, page in enumerate(batch_pages, start=i)
                    ]
                    
                    # Process this batch and wait for completion
                    batch_results = await asyncio.gather(*batch_tasks)
                    upload_tasks.extend(batch_results)
                    
                    # Force garbage collection after each batch
                    del batch_pages, batch_tasks, batch_results
                    gc.collect()
                    print(f"Processed batch {i//batch_size + 1}, memory usage: {get_memory_usage():.2f} MB")
            
            return upload_tasks
        
        # Run the async processing with a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            uploaded_paths = loop.run_until_complete(process_pdf_async())
            print(f"Successfully uploaded {len(uploaded_paths)} images")
        finally:
            loop.close()
            
        gc.collect()  # Force garbage collection
        
        endingtime = datetime.now()
        endingmemory = get_memory_usage()
        print(f"Processing completed in {endingtime - startingtime}, memory spent: {endingmemory - startingmemory:.2f} MB")
        print(f"Successfully processed PDF {file_name} and uploaded {len(uploaded_paths)} images")
    
    except Exception as e:
        print(f"Error processing PDF {file_name}: {str(e)}")
        import traceback
        print(f"Error details: {traceback.format_exc()}")
    
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)



"""
async def test_async():
    
    test_pdf_path = "ex.pdf"  # Replace with a valid PDF path
    startingtime = datetime.now()
    startingmemory = get_memory_usage()
    print(f"Starting processing of {test_pdf_path}, initial memory usage: {startingmemory:.2f} MB")
    
    # Extract images
    images = extract_images_from_pdf(test_pdf_path, scale_factor=0.63, dpi=200)
    print(f"Extracted {len(images)} images from {test_pdf_path}")
    
    # Create tasks for writing images asynchronously
    tasks = []
    for i, img in enumerate(images):
        output_path = f"output_image_{i+1}.jpg"
        # Instead of writing directly, we'll create a task for each image
        tasks.append(asyncio.to_thread(cv2.imwrite, output_path, img))
    
    # Execute all writes concurrently
    await asyncio.gather(*tasks)
    
    endingtime = datetime.now()
    endingmemory = get_memory_usage()
    print(f"Processing completed in {endingtime - startingtime}, memory spent: {endingmemory - startingmemory:.2f} MB")
    print(f"Saved {len(images)} images")

#test
if __name__ == "__main__":
    # This block is for local testing only
    asyncio.run(test_async())
"""