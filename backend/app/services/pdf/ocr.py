from __future__ import annotations

import os
import subprocess
from pathlib import Path


class OcrNotAvailableError(RuntimeError):
    pass


class OcrFailedError(RuntimeError):
    pass


def run_ocrmypdf(
    *,
    input_pdf: Path,
    output_pdf: Path,
    ocrmypdf_path: str,
    lang: str,
    timeout_sec: int,
    extra_path: str | None = None,
) -> Path:
    """Runs OCRmyPDF to create a searchable PDF (text layer).

    Notes:
    - Requires external deps on Windows (e.g., Tesseract OCR, Ghostscript).
    - We use --skip-text to avoid damaging born-digital PDFs.
    """

    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        ocrmypdf_path,
        "--skip-text",
        "--deskew",
        "--rotate-pages",
        "--optimize",
        "1",
        "--language",
        lang,
        str(input_pdf),
        str(output_pdf),
    ]

    env = os.environ.copy()
    if extra_path:
        env["PATH"] = f"{extra_path};{env.get('PATH','')}"

    try:
        subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
            env=env,
        )
    except subprocess.TimeoutExpired as e:
        raise OcrFailedError("OCR timed out") from e
    except subprocess.CalledProcessError as e:
        stderr = (e.stderr or "").strip()
        tail = stderr[-1200:] if stderr else ""
        raise OcrFailedError(f"OCR failed: {tail}") from e

    if not output_pdf.exists() or output_pdf.stat().st_size == 0:
        raise OcrFailedError("OCR did not produce output PDF")

    return output_pdf
