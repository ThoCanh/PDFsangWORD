from __future__ import annotations

import time
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import and_
from sqlalchemy.orm import Session

from ..deps import get_db
from ..deps import get_current_user, get_optional_user
from ...core.config import settings
from ...services.image.jpg_to_png import JpgToPngError, convert_jpg_to_png
from ...services.pdf.libreoffice import LibreOfficeConvertError, LibreOfficeNotFoundError, convert_word_to_pdf
from ...services.pdf.pipeline import EditableConversionUnavailable, convert_pdf_to_docx_pipeline
from ...db.models import ConversionJob, Plan, User
from ...utils.files import make_work_dir, remove_tree, safe_filename

router = APIRouter()


@router.get("/convert/usage")
def get_my_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return current user's monthly usage stats for their current plan."""

    plan: Plan | None = None
    if current_user.plan_key and current_user.plan_key.startswith("plan:"):
        try:
            plan_id = int(current_user.plan_key.split(":", 1)[1])
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid plan_key")
        plan = db.get(Plan, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    limit = int(plan.doc_limit_per_month or 0) if plan is not None else int(settings.free_plan_doc_limit_per_month or 0)
    used = (
        db.query(ConversionJob)
        .filter(
            and_(
                ConversionJob.user_id == current_user.id,
                ConversionJob.created_at >= month_start,
                ConversionJob.status != "failed",
            )
        )
        .count()
    )
    remaining = max(limit - used, 0)
    return {
        "limit": limit,
        "used": used,
        "remaining": remaining,
        "month_start": month_start.isoformat(),
    }


@router.get("/convert/check")
def check_convert_access(
    request: Request,
    type: str,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Pre-check tool access + monthly quota.

    Frontend uses this to decide whether to show an upgrade/limit modal before
    opening file picker or running conversion.
    """

    tool_type = type
    plan: Plan | None = None

    if current_user and current_user.plan_key.startswith("plan:"):
        try:
            plan_id = int(current_user.plan_key.split(":", 1)[1])
        except Exception:
            return {"allowed": False, "reason": "invalid_plan_key", "detail": "Invalid plan_key"}
        plan = db.get(Plan, plan_id)
        if not plan:
            return {"allowed": False, "reason": "plan_not_found", "detail": "Plan not found"}

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    if plan is not None:
        # Allowed tools: if empty => backward-compatible allow-all.
        try:
            import json

            allowed_tools = json.loads(plan.tools_json) if plan.tools_json else []
            if not isinstance(allowed_tools, list):
                allowed_tools = []
            allowed_tools = [str(x) for x in allowed_tools if str(x).strip()]
        except Exception:
            allowed_tools = []

        if allowed_tools and tool_type not in set(allowed_tools):
            return {
                "allowed": False,
                "reason": "tool_not_allowed",
                "detail": "Chức năng này không có trong gói của bạn",
            }

        limit = int(plan.doc_limit_per_month or 0)
        used = (
            db.query(ConversionJob)
            .filter(
                and_(
                    ConversionJob.user_id == current_user.id,
                    ConversionJob.created_at >= month_start,
                    ConversionJob.status != "failed",
                )
            )
            .count()
        )
        remaining = max(limit - used, 0)
        if limit <= 0 or used >= limit:
            return {
                "allowed": False,
                "reason": "quota_exceeded",
                "detail": "Bạn đã đạt giới hạn tài liệu/tháng" if limit > 0 else "Gói của bạn không có lượt sử dụng trong tháng",
                "limit": limit,
                "used": used,
                "remaining": remaining,
            }

        return {
            "allowed": True,
            "reason": None,
            "detail": None,
            "limit": limit,
            "used": used,
            "remaining": remaining,
        }

    # Free plan gating
    raw = (settings.free_plan_tools or "").strip()
    free_tools = [x.strip() for x in raw.split(",") if x.strip()]
    allowed = {"pdf-word", "jpg-png", "word-pdf"}
    free_tools = [t for t in free_tools if t in allowed]

    if free_tools and tool_type not in set(free_tools):
        return {
            "allowed": False,
            "reason": "tool_not_allowed",
            "detail": "Chức năng này không có trong gói Free",
        }

    limit = int(settings.free_plan_doc_limit_per_month or 0)
    if current_user is not None:
        used = (
            db.query(ConversionJob)
            .filter(
                and_(
                    ConversionJob.user_id == current_user.id,
                    ConversionJob.created_at >= month_start,
                    ConversionJob.status != "failed",
                )
            )
            .count()
        )
    else:
        client_ip = getattr(getattr(request, "client", None), "host", None)
        if not client_ip:
            return {"allowed": False, "reason": "missing_client_ip", "detail": "Missing client IP"}
        used = (
            db.query(ConversionJob)
            .filter(
                and_(
                    ConversionJob.user_id.is_(None),
                    ConversionJob.client_ip == client_ip,
                    ConversionJob.created_at >= month_start,
                    ConversionJob.status != "failed",
                )
            )
            .count()
        )

    remaining = max(limit - used, 0)
    if limit <= 0 or used >= limit:
        return {
            "allowed": False,
            "reason": "quota_exceeded",
            "detail": "Bạn đã đạt giới hạn tài liệu/tháng" if limit > 0 else "Gói Free không có lượt sử dụng trong tháng",
            "limit": limit,
            "used": used,
            "remaining": remaining,
        }

    return {
        "allowed": True,
        "reason": None,
        "detail": None,
        "limit": limit,
        "used": used,
        "remaining": remaining,
    }


@router.post("/convert")
async def convert(
    background: BackgroundTasks,
    request: Request,
    file: UploadFile = File(...),
    type: str = Form(...),
    mode: str | None = Form(None),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    # Enforce plan tool access + monthly quota.
    tool_type = type
    plan: Plan | None = None
    if current_user and current_user.plan_key.startswith("plan:"):
        try:
            plan_id = int(current_user.plan_key.split(":", 1)[1])
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid plan_key")
        plan = db.get(Plan, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

    if plan is not None:
        # Allowed tools: if empty => backward-compatible allow-all.
        try:
            import json

            allowed_tools = json.loads(plan.tools_json) if plan.tools_json else []
            if not isinstance(allowed_tools, list):
                allowed_tools = []
            allowed_tools = [str(x) for x in allowed_tools if str(x).strip()]
        except Exception:
            allowed_tools = []

        if allowed_tools and tool_type not in set(allowed_tools):
            raise HTTPException(status_code=403, detail="Chức năng này không có trong gói của bạn")

        limit = int(plan.doc_limit_per_month or 0)
        if limit <= 0:
            raise HTTPException(status_code=429, detail="Gói của bạn không có lượt sử dụng trong tháng")

        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        used = (
            db.query(ConversionJob)
            .filter(
                and_(
                    ConversionJob.user_id == current_user.id,
                    ConversionJob.created_at >= month_start,
                    ConversionJob.status != "failed",
                )
            )
            .count()
        )
        if used >= limit:
            raise HTTPException(status_code=429, detail="Bạn đã đạt giới hạn tài liệu/tháng")

    if plan is None:
        # Free plan gating
        raw = (settings.free_plan_tools or "").strip()
        free_tools = [x.strip() for x in raw.split(",") if x.strip()]
        allowed = {"pdf-word", "jpg-png", "word-pdf"}
        free_tools = [t for t in free_tools if t in allowed]

        if free_tools and tool_type not in set(free_tools):
            raise HTTPException(status_code=403, detail="Chức năng này không có trong gói Free")

        limit = int(settings.free_plan_doc_limit_per_month or 0)
        if limit <= 0:
            raise HTTPException(status_code=429, detail="Gói Free không có lượt sử dụng trong tháng")

        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if current_user is not None:
            used = (
                db.query(ConversionJob)
                .filter(
                    and_(
                        ConversionJob.user_id == current_user.id,
                        ConversionJob.created_at >= month_start,
                        ConversionJob.status != "failed",
                    )
                )
                .count()
            )
        else:
            client_ip = getattr(getattr(request, "client", None), "host", None)
            if not client_ip:
                raise HTTPException(status_code=400, detail="Missing client IP")
            used = (
                db.query(ConversionJob)
                .filter(
                    and_(
                        ConversionJob.user_id.is_(None),
                        ConversionJob.client_ip == client_ip,
                        ConversionJob.created_at >= month_start,
                        ConversionJob.status != "failed",
                    )
                )
                .count()
            )
        if used >= limit:
            raise HTTPException(status_code=429, detail="Bạn đã đạt giới hạn tài liệu/tháng")

    if type == "pdf-word":
        filename = file.filename
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only .pdf is supported for pdf-word")

        job = ConversionJob(
            tool_type=type,
            user_id=(current_user.id if current_user else None),
            filename=filename,
            client_ip=getattr(getattr(request, "client", None), "host", None),
            status="processing",
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        t0 = time.perf_counter()
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

        # Persist upload size
        try:
            job.size_bytes = size
            db.add(job)
            db.commit()
        except Exception:
            # best-effort logging only
            db.rollback()

        try:
            # Enforce mode restrictions: Tier A is premium and not available for Free plan
            if mode and mode.startswith("tier-a") and plan is None:
                raise HTTPException(status_code=403, detail="Tier A conversion không áp dụng cho gói Free")

            prefer_ocr = False
            if mode and mode.startswith("tier-a"):
                # User requested Tier A behavior: prefer OCR-first when the PDF appears scanned
                prefer_ocr = True

            result = convert_pdf_to_docx_pipeline(pdf_path=in_pdf, work_dir=work_dir, prefer_ocr=prefer_ocr)
        except HTTPException as e:
            try:
                job.status = "failed"
                job.error = str(e.detail) if hasattr(e, "detail") else str(e)
                job.finished_at = datetime.now(timezone.utc)
                job.duration_ms = int((time.perf_counter() - t0) * 1000)
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()
            raise
        except EditableConversionUnavailable as e:
            try:
                job.status = "failed"
                job.error = str(e)
                job.finished_at = datetime.now(timezone.utc)
                job.duration_ms = int((time.perf_counter() - t0) * 1000)
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(status_code=422, detail=str(e)) from e
        except Exception as e:
            try:
                job.status = "failed"
                job.error = str(e)
                job.finished_at = datetime.now(timezone.utc)
                job.duration_ms = int((time.perf_counter() - t0) * 1000)
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()
            # If OCR toolchain is unavailable, surface as 503 so admin can act
            from ...services.pdf.pipeline import OcrUnavailableError
            if isinstance(e, OcrUnavailableError):
                raise HTTPException(status_code=503, detail=str(e)) from e
            raise HTTPException(status_code=500, detail=str(e)) from e

        try:
            job.status = "completed"
            job.mode = result.mode
            job.has_text_layer = 1 if result.has_text_layer else 0
            job.finished_at = datetime.now(timezone.utc)
            job.duration_ms = int((time.perf_counter() - t0) * 1000)
            db.add(job)
            db.commit()
        except Exception:
            db.rollback()

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

        job = ConversionJob(
            tool_type=type,
            user_id=(current_user.id if current_user else None),
            filename=filename,
            client_ip=getattr(getattr(request, "client", None), "host", None),
            status="processing",
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        t0 = time.perf_counter()
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
            job.size_bytes = size
            db.add(job)
            db.commit()
        except Exception:
            db.rollback()

        try:
            result = convert_jpg_to_png(jpg_path=in_jpg, out_dir=Path(work_dir) / "image")
        except JpgToPngError as e:
            try:
                job.status = "failed"
                job.error = str(e)
                job.finished_at = datetime.now(timezone.utc)
                job.duration_ms = int((time.perf_counter() - t0) * 1000)
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(status_code=422, detail=str(e)) from e
        except Exception as e:  # noqa: BLE001
            try:
                job.status = "failed"
                job.error = str(e)
                job.finished_at = datetime.now(timezone.utc)
                job.duration_ms = int((time.perf_counter() - t0) * 1000)
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(status_code=500, detail=str(e)) from e

        try:
            job.status = "completed"
            job.mode = "pillow"
            job.finished_at = datetime.now(timezone.utc)
            job.duration_ms = int((time.perf_counter() - t0) * 1000)
            db.add(job)
            db.commit()
        except Exception:
            db.rollback()

        out_name = safe_filename(Path(filename).stem, fallback="image") + ".png"
        return FileResponse(
            path=str(result.png_path),
            media_type="image/png",
            filename=out_name,
            headers={
                "X-Conversion-Mode": "pillow",
            },
        )

    if type == "word-pdf":
        filename = file.filename
        lower = filename.lower()
        if not (lower.endswith(".doc") or lower.endswith(".docx")):
            raise HTTPException(status_code=400, detail="Only .doc/.docx is supported for word-pdf")

        if not settings.libreoffice_path:
            raise HTTPException(status_code=503, detail="LibreOffice is not configured on the server")

        job = ConversionJob(
            tool_type=type,
            user_id=(current_user.id if current_user else None),
            filename=filename,
            client_ip=getattr(getattr(request, "client", None), "host", None),
            status="processing",
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        t0 = time.perf_counter()
        work_dir = make_work_dir("docuflow-convert")
        background.add_task(remove_tree, work_dir)

        in_word = Path(work_dir) / ("input.docx" if lower.endswith(".docx") else "input.doc")

        max_bytes = settings.max_upload_mb * 1024 * 1024
        size = 0
        try:
            with in_word.open("wb") as f:
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
            job.size_bytes = size
            db.add(job)
            db.commit()
        except Exception:
            db.rollback()

        try:
            out_dir = Path(work_dir) / "pdf"
            result_pdf = convert_word_to_pdf(
                word_path=in_word,
                out_dir=out_dir,
                soffice_path=settings.libreoffice_path,
                timeout_sec=settings.conversion_timeout_sec,
                user_install_dir=Path(work_dir) / "lo-profile",
            )
        except LibreOfficeNotFoundError as e:
            try:
                job.status = "failed"
                job.error = str(e)
                job.finished_at = datetime.now(timezone.utc)
                job.duration_ms = int((time.perf_counter() - t0) * 1000)
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(status_code=503, detail=str(e)) from e
        except LibreOfficeConvertError as e:
            try:
                job.status = "failed"
                job.error = str(e)
                job.finished_at = datetime.now(timezone.utc)
                job.duration_ms = int((time.perf_counter() - t0) * 1000)
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(status_code=422, detail=str(e)) from e
        except Exception as e:  # noqa: BLE001
            try:
                job.status = "failed"
                job.error = str(e)
                job.finished_at = datetime.now(timezone.utc)
                job.duration_ms = int((time.perf_counter() - t0) * 1000)
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(status_code=500, detail=str(e)) from e

        try:
            job.status = "completed"
            job.mode = "libreoffice"
            job.finished_at = datetime.now(timezone.utc)
            job.duration_ms = int((time.perf_counter() - t0) * 1000)
            db.add(job)
            db.commit()
        except Exception:
            db.rollback()

        out_name = safe_filename(Path(filename).stem, fallback="document") + ".pdf"
        return FileResponse(
            path=str(result_pdf),
            media_type="application/pdf",
            filename=out_name,
            headers={
                "X-Conversion-Mode": "libreoffice",
            },
        )

    raise HTTPException(status_code=400, detail=f"Unsupported type: {type}")
