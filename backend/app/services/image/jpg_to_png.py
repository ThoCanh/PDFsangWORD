from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps

from ...utils.files import safe_filename


class JpgToPngError(RuntimeError):
    pass


@dataclass(frozen=True)
class JpgToPngResult:
    png_path: Path


def convert_jpg_to_png(*, jpg_path: Path, out_dir: Path) -> JpgToPngResult:
    if not jpg_path.exists():
        raise FileNotFoundError(str(jpg_path))

    out_dir.mkdir(parents=True, exist_ok=True)
    stem = safe_filename(jpg_path.stem, fallback="image")
    out_png = out_dir / f"{stem}.png"

    try:
        with Image.open(jpg_path) as im:
            im = ImageOps.exif_transpose(im)
            # JPEG commonly loads as RGB/L; ensure it's a PNG-safe mode.
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            im.save(out_png, format="PNG", optimize=True)

        if not out_png.exists():
            raise JpgToPngError("Failed to write PNG")

        return JpgToPngResult(png_path=out_png)
    except JpgToPngError:
        raise
    except Exception as e:  # noqa: BLE001
        raise JpgToPngError(str(e)) from e
