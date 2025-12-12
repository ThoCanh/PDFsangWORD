from __future__ import annotations

from pathlib import Path


def pdf_has_text_layer(pdf_path: str | Path, min_chars: int = 20) -> bool:
    """Heuristic: returns True if the PDF appears to contain selectable text."""
    import fitz  # PyMuPDF

    doc = fitz.open(str(pdf_path))
    try:
        total = 0
        for page in doc:
            txt = page.get_text("text") or ""
            total += len(txt.strip())
            if total >= min_chars:
                return True
        return False
    finally:
        doc.close()
