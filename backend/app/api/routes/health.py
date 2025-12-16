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


    # Ghostscript (gs) is required by ocrmypdf on Windows and for PDF raster ops
    gs = which("gs") or which("gswin64c") or which("gswin32c")
    tesseract = which("tesseract", settings.tesseract_path)

    ocr_available = bool(ocrmypdf and tesseract and gs)

    ocr_hints = []
    if not ocrmypdf:
        ocr_hints.append("ocrmypdf not found on PATH. Install via Chocolatey: 'choco install ocrmypdf' or pip in the backend venv")
    if not tesseract:
        ocr_hints.append("Tesseract not found on PATH. On Windows: 'choco install tesseract' or install from UB Mannheim and set TESSERACT_PATH/TESSDATA_PREFIX")
    if not gs:
        ocr_hints.append("Ghostscript (gs) not found on PATH. On Windows: 'choco install ghostscript' or install from https://www.ghostscript.com/download/gsdnld.html")

    return {
        "prefer_editable": settings.prefer_editable,
        "adobe_pdf_services": {
            "configured": bool(settings.adobe_client_id and settings.adobe_client_secret),
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
            "resolved_tesseract": tesseract,
            "resolved_ghostscript": gs,
            "available": ocr_available,
            "hints": ocr_hints,
        },
    }
