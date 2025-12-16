from __future__ import annotations

import os
import subprocess
import shutil
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
    - This function validates that requested Tesseract languages exist and attempts to
      set a sensible TESSDATA_PREFIX when running inside containers.
    """

    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    # Prepare env for subprocess
    env = os.environ.copy()

    # Ensure PATH includes a tesseract location if provided
    if extra_path:
        # Allow Windows paths to be present in settings but ignore them on POSIX containers
        if os.name == "nt":
            env["PATH"] = f"{extra_path};{env.get('PATH','')}"
        else:
            # On Linux containers, extra_path might be a Windows path referenced in .env; ignore if invalid
            if Path(extra_path).exists():
                env["PATH"] = f"{extra_path}:{env.get('PATH','')}"

    # If TESSDATA_PREFIX not set, try common container paths
    if not env.get("TESSDATA_PREFIX"):
        candidates = [
            "/usr/share/tesseract-ocr/5/tessdata",
            "/usr/share/tessdata",
            "/usr/share/tesseract-ocr/tessdata",
        ]
        for c in candidates:
            if Path(c).exists():
                env["TESSDATA_PREFIX"] = c
                break

    # Verify tesseract is available and list languages
    tesseract_bin = shutil.which("tesseract")
    if not tesseract_bin:
        raise OcrNotAvailableError(
            "Tesseract not found on PATH. Install Tesseract and ensure it is visible to the backend process."
        )

    try:
        proc = subprocess.run([tesseract_bin, "--list-langs"], capture_output=True, text=True, env=env, check=True)
        langs_out = proc.stdout or proc.stderr or ""
        available = {l.strip() for l in langs_out.splitlines() if l.strip()}
    except Exception:
        available = set()

    # lang can be like 'vie+eng' — ensure at least one requested language is present (prefer 'vie')
    requested = {l.strip() for l in str(lang).split("+") if l.strip()}
    if not requested.intersection(available):
        # Helpful error to instruct admin to install vie traineddata
        raise OcrNotAvailableError(
            f"Requested OCR languages ({lang}) not available in Tesseract. Available: {sorted(available)}. Ensure 'vie' traineddata is installed and TESSDATA_PREFIX points to tessdata."
        )

    # Build ocrmypdf command
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
