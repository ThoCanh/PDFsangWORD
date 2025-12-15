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
from ...db.models import ConversionJob, Plan, User
from ...utils.files import which


# Protect the entire admin router by default.
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


class PlanCreateRequest(BaseModel):
    name: str
    price_vnd: int = 0
    billing_cycle: str = "month"  # month|year|lifetime
    doc_limit_per_month: int = 1000
    features: list[str] = []
    tools: list[str] = []
    notes: str | None = None


class PlanResponse(BaseModel):
    id: int
    created_at: datetime
    name: str
    price_vnd: int
    billing_cycle: str
    doc_limit_per_month: int
    features: list[str]
    tools: list[str]
    notes: str | None


@router.get("/plans", response_model=list[PlanResponse])
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).order_by(Plan.created_at.desc(), Plan.id.desc()).all()
    out: list[PlanResponse] = []
    for p in plans:
        try:
            import json

            features = json.loads(p.features_json) if p.features_json else []
            if not isinstance(features, list):
                features = []
            features = [str(x) for x in features]
        except Exception:
            features = []

        try:
            import json

            tools = json.loads(p.tools_json) if getattr(p, "tools_json", None) else []
            if not isinstance(tools, list):
                tools = []
            tools = [str(x) for x in tools]
        except Exception:
            tools = []

        out.append(
            PlanResponse(
                id=p.id,
                created_at=p.created_at,
                name=p.name,
                price_vnd=p.price_vnd,
                billing_cycle=p.billing_cycle,
                doc_limit_per_month=p.doc_limit_per_month,
                features=features,
                tools=tools,
                notes=p.notes,
            )
        )
    return out


@router.post("/plans", response_model=PlanResponse)
def create_plan(
    body: PlanCreateRequest,
    db: Session = Depends(get_db),
):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="name is required")

    cycle = body.billing_cycle.strip().lower()
    if cycle not in {"month", "year", "lifetime"}:
        raise HTTPException(status_code=422, detail="billing_cycle must be month|year|lifetime")

    if body.price_vnd < 0:
        raise HTTPException(status_code=422, detail="price_vnd must be >= 0")
    if body.doc_limit_per_month < 0:
        raise HTTPException(status_code=422, detail="doc_limit_per_month must be >= 0")

    exists = db.query(Plan).filter(Plan.name == name).first()
    if exists:
        raise HTTPException(status_code=409, detail="plan name already exists")

    import json

    features = [str(x).strip() for x in (body.features or []) if str(x).strip()]

    allowed_tools = {"pdf-word", "jpg-png", "word-pdf"}
    tools = [str(x).strip() for x in (body.tools or []) if str(x).strip()]
    bad_tools = [t for t in tools if t not in allowed_tools]
    if bad_tools:
        raise HTTPException(status_code=422, detail=f"Invalid tools: {', '.join(bad_tools)}")

    plan = Plan(
        name=name,
        price_vnd=int(body.price_vnd),
        billing_cycle=cycle,
        doc_limit_per_month=int(body.doc_limit_per_month),
        features_json=json.dumps(features, ensure_ascii=False),
        tools_json=json.dumps(tools, ensure_ascii=False),
        notes=body.notes.strip() if body.notes else None,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return PlanResponse(
        id=plan.id,
        created_at=plan.created_at,
        name=plan.name,
        price_vnd=plan.price_vnd,
        billing_cycle=plan.billing_cycle,
        doc_limit_per_month=plan.doc_limit_per_month,
        features=features,
        tools=tools,
        notes=plan.notes,
    )


@router.put("/plans/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int,
    body: PlanCreateRequest,
    db: Session = Depends(get_db),
):
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="plan not found")

    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="name is required")

    cycle = body.billing_cycle.strip().lower()
    if cycle not in {"month", "year", "lifetime"}:
        raise HTTPException(status_code=422, detail="billing_cycle must be month|year|lifetime")

    if body.price_vnd < 0:
        raise HTTPException(status_code=422, detail="price_vnd must be >= 0")
    if body.doc_limit_per_month < 0:
        raise HTTPException(status_code=422, detail="doc_limit_per_month must be >= 0")

    if name != plan.name:
        exists = db.query(Plan).filter(Plan.name == name).first()
        if exists:
            raise HTTPException(status_code=409, detail="plan name already exists")

    import json

    features = [str(x).strip() for x in (body.features or []) if str(x).strip()]

    allowed_tools = {"pdf-word", "jpg-png", "word-pdf"}
    tools = [str(x).strip() for x in (body.tools or []) if str(x).strip()]
    bad_tools = [t for t in tools if t not in allowed_tools]
    if bad_tools:
        raise HTTPException(status_code=422, detail=f"Invalid tools: {', '.join(bad_tools)}")

    plan.name = name
    plan.price_vnd = int(body.price_vnd)
    plan.billing_cycle = cycle
    plan.doc_limit_per_month = int(body.doc_limit_per_month)
    plan.features_json = json.dumps(features, ensure_ascii=False)
    plan.tools_json = json.dumps(tools, ensure_ascii=False)
    plan.notes = body.notes.strip() if body.notes else None

    db.add(plan)
    db.commit()
    db.refresh(plan)

    return PlanResponse(
        id=plan.id,
        created_at=plan.created_at,
        name=plan.name,
        price_vnd=plan.price_vnd,
        billing_cycle=plan.billing_cycle,
        doc_limit_per_month=plan.doc_limit_per_month,
        features=features,
        tools=tools,
        notes=plan.notes,
    )


@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="plan not found")

    db.delete(plan)
    db.commit()
    return {"ok": True}


@router.get("/ping")
def admin_ping():
    return {"ok": True}


class AdminUserResponse(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(db: Session = Depends(get_db)):
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
def system_metrics():
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
def system_status(request: Request, db: Session = Depends(get_db)):
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
def system_logs(limit: int = 200):
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
def admin_stats(db: Session = Depends(get_db)):
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
