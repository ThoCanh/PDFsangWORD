from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


# Load environment variables from `backend/.env` when running locally.
# Use an explicit path so it works regardless of the current working directory.
_dotenv_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_dotenv_path)


@dataclass(frozen=True)
class Settings:
    app_name: str = "DocuFlowAI Backend"

    # CORS
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./docuflow.db").strip()

    # Auth (JWT)
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_DEV_SECRET")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expires_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "1440"))

    # Conversion
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "20"))
    conversion_timeout_sec: int = int(os.getenv("CONVERSION_TIMEOUT_SEC", "120"))
    # PDF_MAX_PAGES=0 means no limit (convert all pages).
    max_pages: int = int(os.getenv("PDF_MAX_PAGES", "300"))
    prefer_editable: bool = os.getenv("PREFER_EDITABLE", "true").lower() in ("1", "true", "yes")

    # Free plan gating (server-side source of truth)
    # Comma-separated tool keys: pdf-word,jpg-png,word-pdf
    free_plan_tools: str = os.getenv("FREE_PLAN_TOOLS", "pdf-word,jpg-png")
    free_plan_doc_limit_per_month: int = int(os.getenv("FREE_PLAN_DOC_LIMIT_PER_MONTH", "3"))

    # Adobe PDF Services API (PDF -> DOCX)
    # IMPORTANT: keep credentials server-side only.
    adobe_base_url: str = os.getenv("ADOBE_PDF_SERVICES_BASE_URL", "https://pdf-services.adobe.io").rstrip("/")
    adobe_client_id: str | None = os.getenv("ADOBE_CLIENT_ID")
    adobe_client_secret: str | None = os.getenv("ADOBE_CLIENT_SECRET")
    adobe_job_timeout_sec: int = int(os.getenv("ADOBE_JOB_TIMEOUT_SEC", "240"))
    adobe_poll_interval_ms: int = int(os.getenv("ADOBE_POLL_INTERVAL_MS", "1500"))
    # OCR language (Adobe expects locale-style strings like vi-VN, en-US)
    adobe_ocr_lang: str = os.getenv("ADOBE_OCR_LANG", "vi-VN")

    # Tier A (LibreOffice)
    libreoffice_path: str | None = os.getenv("LIBREOFFICE_PATH")

    # Optional OCR (for scanned PDFs)
    ocrmypdf_path: str | None = os.getenv("OCR_MY_PDF_PATH")
    ocr_enabled: bool = os.getenv("OCR_ENABLED", "true").lower() in ("1", "true", "yes")
    ocr_lang: str = os.getenv("OCR_LANG", "vie+eng")
    ocr_timeout_sec: int = int(os.getenv("OCR_TIMEOUT_SEC", "180"))
    tesseract_path: str | None = os.getenv("TESSERACT_PATH")

    # Tier B (Image fallback)
    pdf_image_dpi: int = int(os.getenv("PDF_IMAGE_DPI", "250"))

    # Payments (SePay VA)
    # These are used to generate VietQR links and validate webhook calls.
    sepay_bank: str = os.getenv("SEPAY_BANK", "").strip()
    sepay_va_account: str = os.getenv("SEPAY_VA_ACCOUNT", "").strip()
    # Transfer content rules (as shown in SePay docs/UI):
    # - Must start with prefix (often: SEVQR)
    # - Must contain a keyword that includes VA account (often: TKP{VA_ACCOUNT})
    sepay_transfer_prefix: str = os.getenv("SEPAY_TRANSFER_PREFIX", "SEVQR").strip() or "SEVQR"
    sepay_keyword_prefix: str = os.getenv("SEPAY_KEYWORD_PREFIX", "TKP").strip() or "TKP"

    # If set, webhook must present this secret.
    # Supported locations:
    # - Header: X-SePay-Token
    # - Query:  ?token=...
    sepay_webhook_secret: str = os.getenv("SEPAY_WEBHOOK_SECRET", "").strip()

    # QR image base URL
    sepay_qr_base_url: str = os.getenv("SEPAY_QR_BASE_URL", "https://qr.sepay.vn/img").strip().rstrip("/")


settings = Settings()
