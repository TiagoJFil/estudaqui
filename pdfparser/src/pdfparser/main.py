from fastapi import FastAPI
from pdfparser.routers.upload import router

app = FastAPI(title="PDF Parser API", description="API for parsing PDF files", version="0.1.0")

app.include_router(router, prefix="/api/v1")