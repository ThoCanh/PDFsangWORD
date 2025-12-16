from __future__ import annotations

import time
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile, Response
from fastapi.responses import FileResponse, JSONResponse
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
import shutil
import os
from ..db.session import SessionLocal
from fastapi.concurrency import run_in_threadpool  # run heavy sync tasks without blocking the event loop
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

# In-process conversion executor and bookkeeping
CONVERSION_EXECUTOR = ThreadPoolExecutor(max_workers=int(os.environ.get("CONVERSION_WORKERS", "2")))
JOB_FUTURES: dict[int, "concurrent.futures.Future"] = {}
JOB_FUTURES_LOCK = Lock()
RESULT_DIR = Path(os.environ.get("CONVERT_RESULT_DIR", "/tmp/convert_results"))
RESULT_DIR.mkdir(parents=True, exist_ok=True)


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
            # Mode gating: Tier A and OCR modes are Premium-only
            if mode and mode.startswith("tier-a") and plan is None:
                raise HTTPException(status_code=403, detail="Tier A conversion không áp dụng cho gói Free")
            if mode == "ocr" and plan is None:
                raise HTTPException(status_code=403, detail="Chế độ OCR chỉ áp dụng cho tài khoản Premium")
            # OCR-first mode expects Adobe to be available to perform layout-preserving conversion.
            if mode == "ocr" and not bool(settings.adobe_client_id and settings.adobe_client_secret):
                raise HTTPException(status_code=503, detail="Chế độ OCR yêu cầu Adobe PDF Services được cấu hình trên server")

            prefer_tier_a = False
            force_ocr = False
            if mode and mode.startswith("tier-a"):
                # User requested Tier A: send original scan to Adobe (no server-side OCR/preprocessing)
                prefer_tier_a = True
            if mode == "ocr":
                # User explicitly requested OCR-first local processing
                force_ocr = True

            # --- NEW: schedule conversion as an asynchronous job in the executor ---
            def _run_job(job_id: int, in_pdf_path: str, work_dir_path: str, prefer_tier_a: bool, force_ocr: bool, user_id: int | None, client_ip: str | None):
                # Each thread creates its own DB session
                db = SessionLocal()
                t0_inner = time.perf_counter()
                try:
                    # Re-fetch job inside thread/session
                    job_inner = db.get(ConversionJob, job_id)

                    # Use the pipeline (sync) inside the worker thread
                    result = convert_pdf_to_docx_pipeline(
                        pdf_path=Path(in_pdf_path),
                        work_dir=Path(work_dir_path),
                        prefer_tier_a=prefer_tier_a,
                        force_ocr=force_ocr,
                    )

                    # Move docx to a shared results folder
                    dest = RESULT_DIR / f"{job_id}.docx"
                    shutil.copy(result.docx_path, dest)

                    job_inner.mode = result.mode
                    job_inner.has_text_layer = 1 if result.has_text_layer else 0
                    job_inner.finished_at = datetime.now(timezone.utc)
                    job_inner.duration_ms = int((time.perf_counter() - t0_inner) * 1000)
                    job_inner.status = "completed"
                    db.add(job_inner)
                    db.commit()
                except Exception as e:
                    try:
                        job_inner = db.get(ConversionJob, job_id)
                        job_inner.status = "failed"
                        job_inner.error = str(e)
                        job_inner.finished_at = datetime.now(timezone.utc)
                        job_inner.duration_ms = int((time.perf_counter() - t0_inner) * 1000)
                        db.add(job_inner)
                        db.commit()
                    except Exception:
                        db.rollback()
                finally:
                    db.close()

            # Submit the job and return 202 with job id
            from concurrent.futures import Future

            future = CONVERSION_EXECUTOR.submit(
                _run_job,
                job.id,
                str(in_pdf),
                str(work_dir),
                prefer_tier_a,
                force_ocr,
                (current_user.id if current_user else None),
                getattr(getattr(request, 'client', None), 'host', None),
            )
            with JOB_FUTURES_LOCK:
                JOB_FUTURES[job.id] = future

            # Return 202 with job id and status endpoint
            return JSONResponse(status_code=202, content={"job_id": job.id}, headers={"Location": f"/convert/status/{job.id}"})
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
        # Previously returned the file directly. Now we schedule background work and return 202 job id above.
        # This code-path is intentionally unreachable if scheduling worked above, but left here for backward compatibility.
        out_name = safe_filename(Path(filename).stem, fallback="document") + ".docx"
        return FileResponse(
            path=str(Path(RESULT_DIR) / f"{job.id}.docx"),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=out_name,
            headers={
                "X-Conversion-Mode": job.mode or "",
                "X-PDF-Has-Text": "1" if job.has_text_layer else "0",
            },
        )

    if type == "jpg-png":
        # No changes for jpg-png
        pass
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


@router.get("/convert/status/{job_id}")
def get_convert_status(job_id: int, db: Session = Depends(get_db)):
    job = db.get(ConversionJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    result_url = None
    result_path = RESULT_DIR / f"{job.id}.docx"
    if result_path.exists() and job.status == "completed":
        result_url = f"/convert/result/{job.id}"

    return {
        "id": job.id,
        "status": job.status,
        "mode": job.mode,
        "has_text_layer": bool(job.has_text_layer),
        "error": job.error,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "finished_at": job.finished_at.isoformat() if job.finished_at else None,
        "result_url": result_url,
    }


@router.get("/convert/result/{job_id}")
def get_convert_result(job_id: int, db: Session = Depends(get_db)):
    job = db.get(ConversionJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    result_path = RESULT_DIR / f"{job.id}.docx"
    if not result_path.exists() or job.status != "completed":
        raise HTTPException(status_code=404, detail="Result not ready")

    out_name = safe_filename(Path(job.filename or "document").stem, fallback="document") + ".docx"
    return FileResponse(
        path=str(result_path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=out_name,
    )


@router.post("/convert/cancel/{job_id}")
def cancel_convert_job(job_id: int, db: Session = Depends(get_db)):
    job = db.get(ConversionJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    with JOB_FUTURES_LOCK:
        f = JOB_FUTURES.get(job_id)
        if f:
            cancelled = f.cancel()
            if cancelled:
                job.status = "cancelled"
                db.add(job)
                db.commit()
                return {"cancelled": True}
            else:
                return {"cancelled": False, "detail": "Could not cancel (already running)"}
    return {"cancelled": False, "detail": "No running job"}
