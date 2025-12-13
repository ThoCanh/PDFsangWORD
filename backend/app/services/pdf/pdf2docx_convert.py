from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ...utils.files import safe_filename


class Pdf2DocxConvertError(RuntimeError):
    pass


@dataclass(frozen=True)
class Pdf2DocxConvertResult:
    docx_path: Path
    pages_converted: int


def convert_pdf_to_docx_pdf2docx(
    *,
    pdf_path: Path,
    out_dir: Path,
    max_pages: int,
) -> Pdf2DocxConvertResult:
    if not pdf_path.exists():
        raise FileNotFoundError(str(pdf_path))

    out_dir.mkdir(parents=True, exist_ok=True)
    stem = safe_filename(pdf_path.stem, fallback="document")
    out_docx = out_dir / f"{stem}.docx"

    try:
        import fitz  # PyMuPDF
        from pdf2docx import Converter

        doc = fitz.open(str(pdf_path))
        try:
            total_pages = doc.page_count
        finally:
            doc.close()

        pages_to_convert = total_pages
        if max_pages and int(max_pages) > 0:
            pages_to_convert = min(total_pages, int(max_pages))

        pages_to_convert = max(0, int(pages_to_convert))
        if pages_to_convert == 0:
            raise Pdf2DocxConvertError("PDF has 0 pages")

        end_page_index = pages_to_convert - 1  # pdf2docx uses 0-based inclusive end

        cv = Converter(str(pdf_path))
        try:
            cv.convert(str(out_docx), start=0, end=end_page_index)
        finally:
            cv.close()

        if not out_docx.exists():
            raise Pdf2DocxConvertError("pdf2docx did not produce a DOCX output")

        return Pdf2DocxConvertResult(docx_path=out_docx, pages_converted=pages_to_convert)

    except Pdf2DocxConvertError:
        raise
    except Exception as e:  # noqa: BLE001
        raise Pdf2DocxConvertError(str(e)) from e
