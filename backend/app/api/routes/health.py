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

    return {
        "prefer_editable": settings.prefer_editable,
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
