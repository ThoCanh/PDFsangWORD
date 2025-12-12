from __future__ import annotations

import os
import shutil
import tempfile
import uuid
from pathlib import Path


def make_work_dir(prefix: str = "docuflow") -> Path:
    base = Path(tempfile.gettempdir())
    p = base / f"{prefix}-{uuid.uuid4().hex}"
    p.mkdir(parents=True, exist_ok=False)
    return p


def safe_filename(stem: str, fallback: str = "file") -> str:
    cleaned = "".join(ch for ch in stem if ch.isalnum() or ch in ("-", "_", " ")).strip()
    cleaned = cleaned.replace(" ", "_")
    return cleaned or fallback


def which(executable: str, explicit_path: str | None = None) -> str | None:
    if explicit_path:
        p = Path(explicit_path)
        if p.exists():
            return str(p)
    return shutil.which(executable)


def remove_tree(path: str | os.PathLike[str]) -> None:
    try:
        shutil.rmtree(path, ignore_errors=True)
    except Exception:
        # best-effort cleanup
        pass
