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
MAX_CONCURRENT_OPERATIONS = int(os.environ.get("THREADS", "12"))  # Increased from 10
FIGURES_DESTINATION_BUCKET = "estudaqui-pdf-figures"
PAGE_IMAGES_DESTINATION_BUCKET = "estudaqui-pdf-images"

# Performance optimization constants
dpi_factor = 200  # DPI for rendering the PDF pages
zoom_factor = dpi_factor / 72  # Fit to the PDF's default DPI
MATRIX_PICTURE = fitz.Matrix(zoom_factor, zoom_factor)  # 2x zoom for better quality
SCALE_FACTOR = 0.75  # Scale factor for downscaling the image
JPEG_QUALITY = 85  # JPEG compression quality (85 is good balance of quality/size)
BATCH_SIZE = 15  # Pages to process in each batch

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
    concurrency=30
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
    # Pre-calculate the matrix with scale factor for better performance
    if scale_factor != 1.0:
        # Use simpler matrix multiplication for better performance
        adjusted_mat = mat * scale_factor
        pix = page.get_pixmap(matrix=adjusted_mat, alpha=False)  # Disable alpha channel for speed
    else:
        pix = page.get_pixmap(matrix=mat, alpha=False)  # Disable alpha channel for speed
    
    try:
        # Direct conversion without intermediate array - more memory efficient
        img_data = pix.pil_tobytes(format="JPEG", optimize=True, quality=JPEG_QUALITY)
        return np.frombuffer(img_data, dtype=np.uint8)
    finally:
        # Ensure pixmap is always freed
        pix = None

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
        figure_uploads = []
        
        # Upload the page image
        page_upload_task = client.upload(
            PAGE_IMAGES_DESTINATION_BUCKET,
            destination_path,
            image_bytes,
            content_type='image/jpeg',
            metadata={'metadata': image_metadata}
        )
        
        # Prepare figure uploads
        for i, figure in enumerate(figures):
            if figure is not None:
                # Encode the NumPy array as JPEG bytes
                success, encoded_img = cv2.imencode('.jpg', figure, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
                if success:
                    # Convert to bytes
                    figure_bytes = encoded_img.tobytes()
                    figure_uploads.append({
                        "figure": figure_bytes,  # This is now bytes, not NumPy array
                        "index": i,
                        "metadata": figures_metadata[i]
                    })

        # Simultaneously upload all files
        figures_upload_start_time = datetime.now()
        
        # Create all upload tasks
        upload_tasks = [page_upload_task]
        upload_tasks.extend([
            client.upload(
                FIGURES_DESTINATION_BUCKET,
                get_figure_path(figure_info["index"]), 
                figure_info["figure"], 
                metadata={'metadata': figure_info["metadata"]}
            )
            for figure_info in figure_uploads
        ])
        
        # Execute all uploads concurrently
        await asyncio.gather(*upload_tasks)    
        figures_upload_end_time = datetime.now()
        if figure_uploads:
            print(f"Page {image_metadata['pageNumber']}: {len(figure_uploads)} figures uploaded in {figures_upload_end_time - figures_upload_start_time}")
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
    page_processing_start_time = datetime.now()
    extract_image_start_time = datetime.now()
    image_bytes_array = await asyncio.to_thread(
        extract_image_from_page, 
        page, 
        MATRIX_PICTURE, 
        scale_factor=SCALE_FACTOR
    )
    extract_image_end_time = datetime.now()
    print(f"Page {page_number}: Extracted page image in {extract_image_end_time - extract_image_start_time}")
    
    # Convert once for upload
    image_bytes = image_bytes_array.tobytes()
    
    # Decode directly for OpenCV processing - avoid double conversion
    extract_figures_start_time = datetime.now()
    image_cv = cv2.imdecode(image_bytes_array, cv2.IMREAD_COLOR)
    figures = await asyncio.to_thread(extract_images_from_picture, image_cv)
    extract_figures_end_time = datetime.now()
    print(f"Page {page_number}: Extracted {len(figures)} figures in {extract_figures_end_time - extract_figures_start_time}")

    
    destination_path = f"pdf/{pdf_id}/images/page_{page_number}.jpg"
    image_metadata = {
        'pdfId': pdf_id,
        'pageNumber': str(page_number),
        'originalFileName': file_name,
        'figureCount': len(figures),
    }
    figures_metadata = [{"pageNumber": page_number, "figureNumber": i + 1 } for i in range(len(figures))]

    upload_start_time = datetime.now()
    result = await upload_image_async(destination_path, image_metadata, image_bytes,figures_metadata,figures)
    upload_end_time = datetime.now()
    print(f"Page {page_number}: Uploaded images in {upload_end_time - upload_start_time}")
    
    page_processing_end_time = datetime.now()
    print(f"Page {page_number}: Total processing time {page_processing_end_time - page_processing_start_time}")
    return result


async def download_blob_to_memory(bucket_name, source_blob_name):
    async with Storage() as client:
        stream_response = await client.download_stream(bucket_name, source_blob_name)
        content = await stream_response.read()
        return content


async def process_pdf_async(filestream, pdf_id, file_name):
    # Create a semaphore to limit concurrent operations to prevent memory overload
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_OPERATIONS)
    
    async def process_with_semaphore(page, page_num):
        async with semaphore:
            return await process_page(page, pdf_id, page_num, file_name)
    
    # Process the PDF in batches to optimize memory usage
    upload_tasks = []
    batch_size = BATCH_SIZE  # Use configurable batch size
    
    pdf_open_start_time = datetime.now()
    # Open PDF from bytes content
    with fitz.open(stream=filestream, filetype="pdf") as doc:
        pdf_open_end_time = datetime.now()
        print(f"Opened PDF in {pdf_open_end_time - pdf_open_start_time}, total pages: {len(doc)}, memory usage: {get_memory_usage():.2f} MB")
        total_pages = len(doc)
        
        # Pre-load all pages for faster access
        all_pages = [doc[i] for i in range(total_pages)]
        
        # Process pages in batches
        for i in range(0, total_pages, batch_size):
            batch_start_time = datetime.now()
            batch_end = min(i + batch_size, total_pages)
            
            # Create processing tasks for this batch using pre-loaded pages
            batch_tasks = [
                process_with_semaphore(all_pages[j], j + 1) 
                for j in range(i, batch_end)
            ]
            
            # Process this batch and wait for completion
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Filter out exceptions and add successful results
            successful_results = [r for r in batch_results if not isinstance(r, Exception)]
            upload_tasks.extend(successful_results)
            
            # Log any exceptions
            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    print(f"Error processing page {i + j + 1}: {result}")
            
            # Force garbage collection after each batch
            del batch_tasks, batch_results
            gc.collect()
            batch_end_time = datetime.now()
            print(f"Processed batch {i//batch_size + 1} ({batch_end - i} pages) in {batch_end_time - batch_start_time}, memory usage: {get_memory_usage():.2f} MB")
    
    return upload_tasks

@storage_fn.on_object_finalized(bucket="estudaqui-pdf-uploads")
def process_uploaded_pdf(event: storage_fn.CloudEvent) -> None:
    """
    Cloud function that triggers when a PDF is uploaded to the specified bucket.
    It extracts images from the PDF and uploads each image asynchronously to another bucket.
    
    Args:
        event: The event payload containing information about the uploaded file
    """
    total_start_time = datetime.now()
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
    
    download_start_time = datetime.now()
    file_content = asyncio.run(download_blob_to_memory(bucket_name, file_name))
    download_end_time = datetime.now()
    print(f"PDF downloaded in {download_end_time - download_start_time}")

    try:
        startingtime = datetime.now()
        startingmemory = get_memory_usage()
        
        
        # Run the async processing with a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            async_process_start_time = datetime.now()
            uploaded_paths = loop.run_until_complete(process_pdf_async(file_content,pdf_id,file_name))
            async_process_end_time = datetime.now()
            print(f"Async processing finished in {async_process_end_time - async_process_start_time}")
            print(f"Successfully uploaded {len(uploaded_paths)} images")
        finally:
            loop.close()
            
        gc.collect()  # Force garbage collection
        
        endingtime = datetime.now()
        endingmemory = get_memory_usage()
        print(f"Processing completed in {endingtime - startingtime}, memory spent: {endingmemory - startingmemory:.2f} MB")
        print(f"Total execution time: {datetime.now() - total_start_time}")
        print(f"Successfully processed PDF {file_name} and uploaded {len(uploaded_paths)} images")
    
    except Exception as e:
        print(f"Error processing PDF {file_name}: {str(e)}")
        import traceback
        print(f"Error details: {traceback.format_exc()}")
    
    finally:
        # Clean up memory
        if 'file_content' in locals():
            del file_content
        gc.collect()



