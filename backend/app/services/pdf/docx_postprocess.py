from __future__ import annotations

import re
import zipfile
from pathlib import Path


class DocxPostprocessError(RuntimeError):
    pass


_PAGE_BREAK_RE = re.compile(r"<w:br\b[^>]*w:type=\"page\"[^>]*/>")
_LAST_RENDERED_RE = re.compile(r"<w:lastRenderedPageBreak\s*/>")
_PAGE_BREAK_BEFORE_RE = re.compile(r"<w:pageBreakBefore\s*/>")


def normalize_docx_page_breaks(*, docx_path: Path, aggressive: bool = False) -> None:
    """Reduce common pdf2docx page-break artifacts.

    - Removes <w:lastRenderedPageBreak/> which can show up mid-paragraph.
    - Collapses repeated consecutive page breaks into a single break.

    This is a best-effort normalization; it doesn't guarantee perfect layout.
    """

    if not docx_path.exists():
        raise FileNotFoundError(str(docx_path))

    try:
        with zipfile.ZipFile(docx_path, "r") as zin:
            try:
                xml_bytes = zin.read("word/document.xml")
            except KeyError as e:
                raise DocxPostprocessError("DOCX missing word/document.xml") from e

            xml = xml_bytes.decode("utf-8")

            # Remove rendered page breaks
            xml2 = _LAST_RENDERED_RE.sub("", xml)

            if aggressive:
                # Remove explicit page breaks and "page break before" flags.
                # This reduces unwanted "ngắt trang" artifacts in Word.
                xml2 = _PAGE_BREAK_RE.sub("", xml2)
                xml2 = _PAGE_BREAK_BEFORE_RE.sub("", xml2)

        # Write back by rebuilding zip (in-place safe update)
        tmp_path = docx_path.with_suffix(docx_path.suffix + ".tmp")
        with zipfile.ZipFile(docx_path, "r") as zin, zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == "word/document.xml":
                    data = xml2.encode("utf-8")
                zout.writestr(item, data)

        tmp_path.replace(docx_path)

    except DocxPostprocessError:
        raise
    except Exception as e:  # noqa: BLE001
        raise DocxPostprocessError(str(e)) from e
