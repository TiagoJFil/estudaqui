# PDF to Images Cloud Function

This cloud function automatically converts uploaded PDF documents to images.

## Functionality

- Triggers when a PDF is uploaded to the `pdf-uploads` bucket
- Extracts each page from the PDF as an image using PyMuPDF
- Converts the images to BGR format for OpenCV processing
- Resizes images based on the configured scale factor
- Uploads each extracted page as a PNG image to the `pdf-images` bucket
- Images are stored in the path format: `pdf/{pdf_id}/images/page_{number}.png`

## Configuration

The function can be configured with the following parameters:

- `scale_factor`: Resizing factor for the images (default: 0.5)
- `dpi`: DPI setting for PDF rendering (default: 200)

## Deployment

Deploy this function using Firebase CLI:

```
firebase deploy --only functions:pdf2img
```

