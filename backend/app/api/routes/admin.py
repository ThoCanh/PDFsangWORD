from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..deps import get_db, require_admin
from ...core.config import settings
from ...core.log_buffer import get_log_items
from ...db.models import User
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
