from __future__ import annotations

from fastapi import APIRouter

from ...core.config import settings
from ...utils.files import which

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/conversion")
def conversion_health():
    soffice = (
        which("soffice.com", settings.libreoffice_path)
        or which("soffice.exe", settings.libreoffice_path)
        or which("soffice", settings.libreoffice_path)
    )

    ocrmypdf = which("ocrmypdf", settings.ocrmypdf_path)

    try:
        import fitz  # noqa: F401

        pymupdf_available = True
    except Exception:  # noqa: BLE001
        pymupdf_available = False

    try:
        import pdf2docx  # noqa: F401

        pdf2docx_available = True
    except Exception:  # noqa: BLE001
        pdf2docx_available = False

    try:
        import aspose.words  # noqa: F401

        aspose_words_available = True
    except Exception:  # noqa: BLE001
        aspose_words_available = False

    try:
        import httpx  # noqa: F401

        httpx_available = True
    except Exception:  # noqa: BLE001
        httpx_available = False

    return {
        "prefer_editable": settings.prefer_editable,
        "adobe_pdf_services": {
            "configured": bool(settings.adobe_client_id and settings.adobe_client_secret),
            "required": settings.adobe_required,
            "base_url": settings.adobe_base_url,
            "ocr_lang": settings.adobe_ocr_lang,
            "httpx_available": httpx_available,
        },
        "pdf2docx": {
            "available": pdf2docx_available,
            "pymupdf_available": pymupdf_available,
        },
        "aspose_words": {
            "available": aspose_words_available,
        },
        "libreoffice": {
            "configured_path": settings.libreoffice_path,
            "resolved_path": soffice,
            "available": bool(soffice),
        },
        "ocr": {
            "enabled": settings.ocr_enabled,
            "lang": settings.ocr_lang,
            "resolved_ocrmypdf": ocrmypdf,
            "available": bool(ocrmypdf),
        },
    }
