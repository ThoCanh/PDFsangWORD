from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ...utils.files import safe_filename


class AsposeWordsConvertError(RuntimeError):
    pass


@dataclass(frozen=True)
class AsposeWordsConvertResult:
    docx_path: Path


def convert_pdf_to_docx_aspose_words(*, pdf_path: Path, out_dir: Path) -> AsposeWordsConvertResult:
    """Convert PDF → DOCX using Aspose.Words.

    Notes:
    - Aspose.Words is commercial. Without a license it may add evaluation watermarks.
    - It does NOT perform OCR by itself; for scanned PDFs, run OCR first.
    """

    if not pdf_path.exists():
        raise FileNotFoundError(str(pdf_path))

    out_dir.mkdir(parents=True, exist_ok=True)
    stem = safe_filename(pdf_path.stem, fallback="document")
    out_docx = out_dir / f"{stem}.docx"

    try:
        import aspose.words as aw

        # Load PDF and save as DOCX
        doc = aw.Document(str(pdf_path))
        doc.save(str(out_docx), aw.SaveFormat.DOCX)

        if not out_docx.exists():
            raise AsposeWordsConvertError("Aspose.Words did not produce a DOCX output")

        return AsposeWordsConvertResult(docx_path=out_docx)

    except AsposeWordsConvertError:
        raise
    except Exception as e:  # noqa: BLE001
        raise AsposeWordsConvertError(str(e)) from e
