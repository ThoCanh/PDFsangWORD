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


def pdf_text_layer_seems_low_quality(
    pdf_path: str | Path,
    *,
    max_pages: int = 2,
    min_chars: int = 200,
    min_space_ratio: float = 0.015,
) -> bool:
    """Best-effort heuristic to detect OCR/embedded text layers that are hard to read.

    Examples this aims to catch:
    - Vietnamese words glued together without spaces ("tờpháplý", "cổđôngsánglập")
    - Text layers that exist but are not usable for conversion quality

    Returns True when the extracted text is long enough but contains unusually few
    spaces, which often correlates with missing word boundaries.
    """

    import fitz  # PyMuPDF

    doc = fitz.open(str(pdf_path))
    try:
        pages_to_scan = doc.page_count
        if max_pages and int(max_pages) > 0:
            pages_to_scan = min(pages_to_scan, int(max_pages))

        text_parts: list[str] = []
        for i in range(pages_to_scan):
            try:
                text_parts.append(doc.load_page(i).get_text("text") or "")
            except Exception:  # noqa: BLE001
                continue

        text = "\n".join(text_parts)
        stripped = text.strip()
        if len(stripped) < int(min_chars):
            return False

        space_count = stripped.count(" ")
        space_ratio = space_count / max(len(stripped), 1)
        return space_ratio < float(min_space_ratio)
    finally:
        doc.close()
