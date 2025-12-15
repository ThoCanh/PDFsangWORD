from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from ...core.config import settings
from ...services.image.jpg_to_png import JpgToPngError, convert_jpg_to_png
from ...services.pdf.pipeline import EditableConversionUnavailable, convert_pdf_to_docx_pipeline
from ...utils.files import make_work_dir, remove_tree, safe_filename

router = APIRouter()


@router.post("/convert")
async def convert(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    type: str = Form(...),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    if type == "pdf-word":
        filename = file.filename
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only .pdf is supported for pdf-word")

        work_dir = make_work_dir("docuflow-convert")
        background.add_task(remove_tree, work_dir)

        in_pdf = Path(work_dir) / "input.pdf"

        max_bytes = settings.max_upload_mb * 1024 * 1024
        size = 0
        try:
            with in_pdf.open("wb") as f:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > max_bytes:
                        raise HTTPException(
                            status_code=413,
                            detail=f"File too large. Max {settings.max_upload_mb}MB",
                        )
                    f.write(chunk)
        finally:
            await file.close()

        try:
            result = convert_pdf_to_docx_pipeline(pdf_path=in_pdf, work_dir=work_dir)
        except HTTPException:
            raise
        except EditableConversionUnavailable as e:
            raise HTTPException(status_code=422, detail=str(e)) from e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) from e

        out_name = safe_filename(Path(filename).stem, fallback="document") + ".docx"

        return FileResponse(
            path=str(result.docx_path),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=out_name,
            headers={
                "X-Conversion-Mode": result.mode,
                "X-PDF-Has-Text": "1" if result.has_text_layer else "0",
            },
        )

    if type == "jpg-png":
        filename = file.filename
        lower = filename.lower()
        if not (lower.endswith(".jpg") or lower.endswith(".jpeg")):
            raise HTTPException(status_code=400, detail="Only .jpg/.jpeg is supported for jpg-png")

        work_dir = make_work_dir("docuflow-convert")
        background.add_task(remove_tree, work_dir)

        in_jpg = Path(work_dir) / "input.jpg"

        max_bytes = settings.max_upload_mb * 1024 * 1024
        size = 0
        try:
            with in_jpg.open("wb") as f:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > max_bytes:
                        raise HTTPException(
                            status_code=413,
                            detail=f"File too large. Max {settings.max_upload_mb}MB",
                        )
                    f.write(chunk)
        finally:
            await file.close()

        try:
            result = convert_jpg_to_png(jpg_path=in_jpg, out_dir=Path(work_dir) / "image")
        except JpgToPngError as e:
            raise HTTPException(status_code=422, detail=str(e)) from e
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=str(e)) from e

        out_name = safe_filename(Path(filename).stem, fallback="image") + ".png"
        return FileResponse(
            path=str(result.png_path),
            media_type="image/png",
            filename=out_name,
            headers={
                "X-Conversion-Mode": "pillow",
            },
        )

    raise HTTPException(status_code=400, detail=f"Unsupported type: {type}")
