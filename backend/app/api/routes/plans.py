from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..deps import get_db
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
