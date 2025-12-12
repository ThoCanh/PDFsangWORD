from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ...core.config import settings
from ...utils.files import safe_filename, which
from .classifier import pdf_has_text_layer
from .image_fallback import pdf_to_docx_images
from .libreoffice import LibreOfficeConvertError, convert_pdf_to_docx
from .ocr import OcrFailedError, run_ocrmypdf


@dataclass(frozen=True)
class PdfToDocxResult:
    docx_path: Path
    mode: str  # "tier-a" | "tier-a-ocr" | "tier-b"
    has_text_layer: bool


class EditableConversionUnavailable(RuntimeError):
    pass


def convert_pdf_to_docx_pipeline(*, pdf_path: Path, work_dir: Path) -> PdfToDocxResult:
    """Professional PDF→DOCX pipeline.

    Tier A: LibreOffice (best effort editable)
    Tier B: Image fallback (max visual fidelity)
    """

    if not pdf_path.exists():
        raise FileNotFoundError(str(pdf_path))

    has_text = pdf_has_text_layer(pdf_path)

    # Tier A (LibreOffice)
    # On Windows, LibreOffice CLI entry is often soffice.com.
    soffice = (
        which("soffice.com", settings.libreoffice_path)
        or which("soffice.exe", settings.libreoffice_path)
        or which("soffice", settings.libreoffice_path)
    )
    if soffice:
        out_dir = work_dir / "tier-a"
        out_dir.mkdir(parents=True, exist_ok=True)
        try:
            docx = convert_pdf_to_docx(
                pdf_path=pdf_path,
                out_dir=out_dir,
                soffice_path=soffice,
                timeout_sec=settings.conversion_timeout_sec,
            )
            return PdfToDocxResult(docx_path=docx, mode="tier-a", has_text_layer=has_text)
        except LibreOfficeConvertError:
            # If PDF is scanned (no text), try OCR then LibreOffice.
            if (not has_text) and settings.ocr_enabled:
                ocrmypdf = which("ocrmypdf", settings.ocrmypdf_path)
                if ocrmypdf:
                    ocr_out = work_dir / "ocr" / "searchable.pdf"
                    try:
                        run_ocrmypdf(
                            input_pdf=pdf_path,
                            output_pdf=ocr_out,
                            ocrmypdf_path=ocrmypdf,
                            lang=settings.ocr_lang,
                            timeout_sec=settings.ocr_timeout_sec,
                        )
                        # Re-check for text after OCR
                        has_text_after = pdf_has_text_layer(ocr_out)
                        docx2 = convert_pdf_to_docx(
                            pdf_path=ocr_out,
                            out_dir=out_dir,
                            soffice_path=soffice,
                            timeout_sec=settings.conversion_timeout_sec,
                        )
                        return PdfToDocxResult(
                            docx_path=docx2,
                            mode="tier-a-ocr",
                            has_text_layer=has_text_after,
                        )
                    except (LibreOfficeConvertError, OcrFailedError):
                        pass

            # If user prefers editable, do not silently fall back to image DOCX.
            if settings.prefer_editable:
                raise EditableConversionUnavailable(
                    "Unable to produce editable DOCX. Install/configure LibreOffice and (for scanned PDFs) OCRmyPDF + Tesseract, or disable PREFER_EDITABLE to allow image fallback."
                )

            # Otherwise fall through to Tier B
            pass

    if settings.prefer_editable:
        raise EditableConversionUnavailable(
            "LibreOffice not found. Set LIBREOFFICE_PATH to soffice.com (or add LibreOffice to PATH), or disable PREFER_EDITABLE to allow image fallback."
        )

    # Tier B (Image fallback)
    stem = safe_filename(pdf_path.stem, fallback="document")
    out_docx = work_dir / "tier-b" / f"{stem}.docx"
    out_docx.parent.mkdir(parents=True, exist_ok=True)
    docx = pdf_to_docx_images(
        pdf_path=pdf_path,
        out_docx=out_docx,
        dpi=settings.pdf_image_dpi,
        max_pages=settings.max_pages,
    )
    return PdfToDocxResult(docx_path=docx, mode="tier-b", has_text_layer=has_text)
