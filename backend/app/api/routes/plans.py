from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..deps import get_db
from ...core.config import settings
from ...db.models import Plan

router = APIRouter(prefix="/plans", tags=["plans"])


class PlanPublicResponse(BaseModel):
    id: int
    created_at: datetime
    name: str
    price_vnd: int
    billing_cycle: str
    doc_limit_per_month: int
    features: list[str]
    tools: list[str]
    notes: str | None


class FreePlanResponse(BaseModel):
    key: str
    doc_limit_per_month: int
    tools: list[str]


def _parse_free_tools() -> list[str]:
    raw = (settings.free_plan_tools or "").strip()
    items = [x.strip() for x in raw.split(",") if x.strip()]
    # Keep only known tools (defense-in-depth)
    allowed = {"pdf-word", "jpg-png", "word-pdf"}
    return [x for x in items if x in allowed]


@router.get("/free", response_model=FreePlanResponse)
def get_free_plan():
    return FreePlanResponse(
        key="free",
        doc_limit_per_month=int(settings.free_plan_doc_limit_per_month or 0),
        tools=_parse_free_tools(),
    )


@router.get("", response_model=list[PlanPublicResponse])
@router.get("/", response_model=list[PlanPublicResponse])
def list_public_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).order_by(Plan.created_at.desc(), Plan.id.desc()).all()

    out: list[PlanPublicResponse] = []
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
            PlanPublicResponse(
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
