from __future__ import annotations

from pathlib import Path

from docx import Document

from ...utils.files import safe_filename


class PdfTextToDocxError(RuntimeError):
    pass


def convert_pdf_text_to_docx(*, pdf_path: Path, out_dir: Path, max_pages: int) -> Path:
    """Fallback converter: extract selectable text from PDF and write a simple DOCX.

    This favors completeness (no missing text) over layout fidelity.
    """

    if not pdf_path.exists():
        raise FileNotFoundError(str(pdf_path))

    out_dir.mkdir(parents=True, exist_ok=True)
    stem = safe_filename(pdf_path.stem, fallback="document")
    out_docx = out_dir / f"{stem}.docx"

    try:
        import fitz  # PyMuPDF

        doc = fitz.open(str(pdf_path))
        try:
            total_pages = doc.page_count
            pages_to_convert = total_pages
            if max_pages and max_pages > 0:
                pages_to_convert = min(total_pages, int(max_pages))

            word = Document()
            for page_index in range(pages_to_convert):
                page = doc.load_page(page_index)
                text = (page.get_text("text") or "").strip()
                if not text:
                    continue
                for line in text.splitlines():
                    line = line.strip()
                    if line:
                        word.add_paragraph(line)

            word.save(str(out_docx))
        finally:
            doc.close()

        if not out_docx.exists():
            raise PdfTextToDocxError("Failed to write DOCX")

        return out_docx

    except PdfTextToDocxError:
        raise
    except Exception as e:  # noqa: BLE001
        raise PdfTextToDocxError(str(e)) from e
