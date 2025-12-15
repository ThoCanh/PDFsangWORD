from __future__ import annotations

from datetime import datetime, timezone
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..deps import get_db, require_admin
from ...core.config import settings
from ...core.log_buffer import get_log_items
from ...db.models import ConversionJob, User
from ...utils.files import which


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def admin_ping(_: User = Depends(require_admin)):
    return {"ok": True}


class AdminUserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = db.query(User).order_by(User.created_at.desc(), User.id.desc()).all()
    return [
        AdminUserResponse(
            id=u.id,
            email=u.email,
            role=u.role,
            created_at=u.created_at,
        )
        for u in users
    ]


class SystemStatusResponse(BaseModel):
    app_name: str
    server_time: datetime
    started_at: datetime | None
    users_count: int
    db_ok: bool
    conversion: dict


class SystemMetricsResponse(BaseModel):
    cpu_percent: float
    ram_used_bytes: int
    ram_total_bytes: int
    ram_percent: float


@router.get("/system/metrics", response_model=SystemMetricsResponse)
def system_metrics(_: User = Depends(require_admin)):
    try:
        import psutil  # type: ignore
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail="psutil is not installed on the server",
        ) from e

    # interval>0 gives a real sampled reading.
    cpu_percent = float(psutil.cpu_percent(interval=0.2))
    vm = psutil.virtual_memory()

    return SystemMetricsResponse(
        cpu_percent=cpu_percent,
        ram_used_bytes=int(vm.used),
        ram_total_bytes=int(vm.total),
        ram_percent=float(vm.percent),
    )


@router.get("/system/status", response_model=SystemStatusResponse)
def system_status(request: Request, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    # DB
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    users_count = db.query(User).count()

    # Conversion tool availability (same logic as /health/conversion)
    soffice = (
        which("soffice.com", settings.libreoffice_path)
        or which("soffice.exe", settings.libreoffice_path)
        or which("soffice", settings.libreoffice_path)
    )
    ocrmypdf = which("ocrmypdf", settings.ocrmypdf_path)

    started_at = getattr(request.app.state, "started_at", None)

    return SystemStatusResponse(
        app_name=settings.app_name,
        server_time=datetime.now(timezone.utc),
        started_at=started_at,
        users_count=users_count,
        db_ok=db_ok,
        conversion={
            "prefer_editable": settings.prefer_editable,
            "libreoffice": {
                "available": bool(soffice),
                "resolved_path": soffice,
            },
            "ocr": {
                "enabled": settings.ocr_enabled,
                "available": bool(ocrmypdf),
                "resolved_ocrmypdf": ocrmypdf,
                "lang": settings.ocr_lang,
            },
        },
    )


class SystemLogItemResponse(BaseModel):
    id: int
    time: str
    level: str
    logger: str
    message: str


@router.get("/system/logs", response_model=list[SystemLogItemResponse])
def system_logs(limit: int = 200, _: User = Depends(require_admin)):
    items = get_log_items(limit=limit)
    return [
        SystemLogItemResponse(
            id=i.id,
            time=i.time,
            level=i.level,
            logger=i.logger,
            message=i.message,
        )
        for i in items
    ]


class AdminStatsResponse(BaseModel):
    total_documents: int
    ai_processed: int
    accuracy_rate: float
    processing_queue: int

    total_documents_change: str
    ai_processed_change: str
    accuracy_rate_change: str
    processing_queue_change: str


def _pct_change(current: int, previous: int) -> str:
    if previous <= 0:
        if current <= 0:
            return "0%"
        return "+100%"
    diff = (current - previous) / previous * 100.0
    return f"{diff:+.0f}%"


def _pp_change(current_rate: float, previous_rate: float) -> str:
    diff = current_rate - previous_rate
    return f"{diff:+.1f}%"


@router.get("/stats", response_model=AdminStatsResponse)
def admin_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    d30 = now - timedelta(days=30)
    d60 = now - timedelta(days=60)

    total_documents = db.query(ConversionJob).count()
    ai_processed = db.query(ConversionJob).filter(ConversionJob.tool_type == "pdf-word").count()
    processing_queue = (
        db.query(ConversionJob)
        .filter(ConversionJob.status == "processing")
        .count()
    )

    completed = (
        db.query(ConversionJob)
        .filter(ConversionJob.status == "completed")
        .count()
    )
    accuracy_rate = round((completed / total_documents * 100.0), 1) if total_documents else 0.0

    current_total = db.query(ConversionJob).filter(ConversionJob.created_at >= d30).count()
    prev_total = (
        db.query(ConversionJob)
        .filter(ConversionJob.created_at >= d60, ConversionJob.created_at < d30)
        .count()
    )

    current_ai = (
        db.query(ConversionJob)
        .filter(ConversionJob.tool_type == "pdf-word", ConversionJob.created_at >= d30)
        .count()
    )
    prev_ai = (
        db.query(ConversionJob)
        .filter(
            ConversionJob.tool_type == "pdf-word",
            ConversionJob.created_at >= d60,
            ConversionJob.created_at < d30,
        )
        .count()
    )

    current_completed = (
        db.query(ConversionJob)
        .filter(ConversionJob.status == "completed", ConversionJob.created_at >= d30)
        .count()
    )
    current_total_for_rate = current_total
    current_rate = (
        current_completed / current_total_for_rate * 100.0 if current_total_for_rate else 0.0
    )

    prev_completed = (
        db.query(ConversionJob)
        .filter(
            ConversionJob.status == "completed",
            ConversionJob.created_at >= d60,
            ConversionJob.created_at < d30,
        )
        .count()
    )
    prev_total_for_rate = prev_total
    prev_rate = prev_completed / prev_total_for_rate * 100.0 if prev_total_for_rate else 0.0

    return AdminStatsResponse(
        total_documents=total_documents,
        ai_processed=ai_processed,
        accuracy_rate=accuracy_rate,
        processing_queue=processing_queue,
        total_documents_change=_pct_change(current_total, prev_total),
        ai_processed_change=_pct_change(current_ai, prev_ai),
        accuracy_rate_change=_pp_change(round(current_rate, 1), round(prev_rate, 1)),
        processing_queue_change="—",
    )
