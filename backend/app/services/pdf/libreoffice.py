from __future__ import annotations

import subprocess
from pathlib import Path


class LibreOfficeNotFoundError(RuntimeError):
    pass


class LibreOfficeConvertError(RuntimeError):
    pass


def convert_pdf_to_docx(
    *,
    pdf_path: Path,
    out_dir: Path,
    soffice_path: str,
    timeout_sec: int,
    user_install_dir: Path | None = None,
) -> Path:
    """Convert PDF to DOCX using LibreOffice (Tier A).

    Returns path to generated .docx.
    """

    if not pdf_path.exists():
        raise FileNotFoundError(str(pdf_path))
    if not out_dir.exists():
        out_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        soffice_path,
        "--headless",
        "--nologo",
        "--nofirststartwizard",
        "--norestore",
    ]
    if user_install_dir:
        user_install_dir.mkdir(parents=True, exist_ok=True)
        cmd.append(f"-env:UserInstallation={user_install_dir.as_uri()}")

    cmd += [
        "--convert-to",
        "docx",
        "--outdir",
        str(out_dir),
        str(pdf_path),
    ]

    try:
        completed = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )
    except subprocess.TimeoutExpired as e:
        raise LibreOfficeConvertError("LibreOffice conversion timed out") from e
    except subprocess.CalledProcessError as e:
        stderr = (e.stderr or "").strip()
        tail = stderr[-800:] if stderr else ""
        raise LibreOfficeConvertError(f"LibreOffice conversion failed: {tail}") from e

    # LO output naming can vary; pick newest docx.
    outputs = sorted(out_dir.glob("*.docx"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not outputs:
        debug = (completed.stderr or completed.stdout or "").strip()
        raise LibreOfficeConvertError(f"LibreOffice did not produce DOCX. Output: {debug[-800:]}")

    out_docx = outputs[0]
    if out_docx.stat().st_size == 0:
        raise LibreOfficeConvertError("LibreOffice produced empty DOCX")

    return out_docx
