import os
import tempfile
import fitz
import cv2
import numpy as np
import gc
import psutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
from firebase_functions import storage_fn, options
from firebase_admin import initialize_app, storage
from firebase_functions.options import set_global_options
from datetime import datetime
from firebase_functions.options import MemoryOption 
from image_processing.processing import OpenCVProcesser
from gcloud.aio.storage import Storage

# Maximum number of concurrent operations
MAX_CONCURRENT_OPERATIONS = int(os.environ.get("THREADS", "10"))
FIGURES_DESTINATION_BUCKET = "estudaqui-pdf-figures"
PAGE_IMAGES_DESTINATION_BUCKET = "estudaqui-pdf-images"

dpi_factor = 200  # DPI for rendering the PDF pages
zoom_factor = dpi_factor / 72  # Fit to the PDF's default DPI
MATRIX_PICTURE = fitz.Matrix(zoom_factor, zoom_factor)  # 2x zoom for better quality
SCALE_FACTOR = 0.75  # Scale factor for downscaling the image

def get_memory_usage():
    """Get current memory usage in MB"""
    process = psutil.Process(os.getpid())
    memory_mb = process.memory_info().rss / 1024 / 1024
    return memory_mb


# Configure global options for optimal performance
set_global_options(
    max_instances=20,  # Increased instances for better scalability
    region="us-west1", 
    memory=MemoryOption.GB_2,
    timeout_sec=540,  # Increased timeout for larger PDFs
    cpu=1,
    concurrency=11
)

openCVProcesser = OpenCVProcesser()
initialize_app()

def extract_images_from_picture(image):
    """
    Extract images from a picture file and optionally downscale them.
    
    Args:
        picture_path (str): Path to the picture file
        scale_factor (float): Scale factor for resizing images (1.0 means 100%, 0.5 means 50%)
        
    Returns:
        list: List of OpenCV BGR images
    """
    # Use OpenCV to read the image
    img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR) if len(image.shape) == 3 else image

    if img_bgr is None:
        raise ValueError(f"Could not read image from provided data")
    
    figures = openCVProcesser.process(img_bgr)
    
    return figures


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
    image = cv2.imencode('.jpg', img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])[1]
    return image

async def upload_image_async(destination_path, image_metadata, image_bytes,figures_metadata, figures):
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
    
    def get_figure_path(i):
        return f"pdf/{image_metadata['pdfId']}/figures/page_{image_metadata['pageNumber']}_figure_{i+1}.jpg"

    async with Storage() as client:
        # Prepare all our upload data
        uploads = []
        for i, figure in enumerate(figures):
            if figure is not None:
                # Encode the NumPy array as JPEG bytes
                success, encoded_img = cv2.imencode('.jpg', figure, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if success:
                    # Convert to bytes
                    figure_bytes = encoded_img.tobytes()
                    uploads.append({
                        "figure": figure_bytes,  # This is now bytes, not NumPy array
                        "index": i,
                        "metadata": figures_metadata[i]
                    })
        await client.upload(
            PAGE_IMAGES_DESTINATION_BUCKET,
            destination_path,
            image_bytes,
            content_type='image/jpeg',
            metadata=image_metadata
        )

        # Simultaneously upload all files
        await asyncio.gather(
            *[
                client.upload(
                    FIGURES_DESTINATION_BUCKET,
                    get_figure_path(figure_info["index"]), 
                    figure_info["figure"], 
                    metadata=figure_info["metadata"]
                )
                for figure_info in uploads
            ]
        )    

    print(f"Uploaded image to {destination_path} with metadata: {image_metadata}")
    return destination_path

async def process_page(page, pdf_id, page_number, file_name):
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
    image_buffer = await asyncio.to_thread(
        extract_image_from_page, 
        page, 
        MATRIX_PICTURE, 
        scale_factor=SCALE_FACTOR
    )
    image_bytes = image_buffer.tobytes()
    #make image object for opencv
    image_cv = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)

    
    destination_path = f"pdf/{pdf_id}/images/page_{page_number}.jpg"
    image_metadata = {
        'pdfId': pdf_id,
        'pageNumber': str(page_number),
        'originalFileName': file_name
    }
    figures = extract_images_from_picture(image_cv)
    figures_metadata = [{"pageNumber": page_number, "figure_number": i } for i in range(len(figures))]

    print(f"Processed image {page_number}, queued for upload")
    return await upload_image_async(destination_path, image_metadata, image_bytes,figures_metadata,figures)

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
    
    bucket = storage.bucket(bucket_name)
    blob = bucket.blob(file_name)
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        temp_path = temp_file.name
        blob.download_to_filename(temp_path)

    del bucket, blob

    try:
        startingtime = datetime.now()
        startingmemory = get_memory_usage()
        
        # Setup async processing with semaphore to control concurrency
        async def process_pdf_async():
            # Create a semaphore to limit concurrent operations to prevent memory overload
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_OPERATIONS)
            
            async def process_with_semaphore(page, page_num):
                async with semaphore:
                    return await process_page(page, pdf_id, page_num, file_name)
            
            # Process the PDF in batches to optimize memory usage
            upload_tasks = []
            batch_size = 10  # Process 10 pages at a time to balance memory and speed
            
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



