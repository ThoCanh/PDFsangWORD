from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "DocuFlowAI Backend"

    # CORS
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

    # Conversion
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "20"))
    conversion_timeout_sec: int = int(os.getenv("CONVERSION_TIMEOUT_SEC", "120"))
    max_pages: int = int(os.getenv("PDF_MAX_PAGES", "80"))
    prefer_editable: bool = os.getenv("PREFER_EDITABLE", "true").lower() in ("1", "true", "yes")

    # Tier A (LibreOffice)
    libreoffice_path: str | None = os.getenv("LIBREOFFICE_PATH")

    # Optional OCR (for scanned PDFs)
    ocrmypdf_path: str | None = os.getenv("OCR_MY_PDF_PATH")
    ocr_enabled: bool = os.getenv("OCR_ENABLED", "true").lower() in ("1", "true", "yes")
    ocr_lang: str = os.getenv("OCR_LANG", "vie+eng")
    ocr_timeout_sec: int = int(os.getenv("OCR_TIMEOUT_SEC", "180"))

    # Tier B (Image fallback)
    pdf_image_dpi: int = int(os.getenv("PDF_IMAGE_DPI", "250"))


settings = Settings()
