from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from ...core.config import settings
from ...services.pdf.pipeline import EditableConversionUnavailable, convert_pdf_to_docx_pipeline
from ...utils.files import make_work_dir, remove_tree, safe_filename

router = APIRouter()


@router.post("/convert")
async def convert(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    type: str = Form(...),
):
    if type != "pdf-word":
        raise HTTPException(status_code=400, detail=f"Unsupported type: {type}")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

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

    # Note: FileResponse will stream from disk; cleanup happens via BackgroundTasks.
    return FileResponse(
        path=str(result.docx_path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=out_name,
        headers={
            "X-Conversion-Mode": result.mode,
            "X-PDF-Has-Text": "1" if result.has_text_layer else "0",
        },
    )
