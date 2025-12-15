from __future__ import annotations

import json
import re
import secrets
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ..deps import get_current_user, get_db
from ...core.config import settings
from ...db.models import PaymentOrder, PaymentTransaction, Plan, User

router = APIRouter(prefix="/payments", tags=["payments"])


def _generate_order_code() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "DF" + "".join(secrets.choice(alphabet) for _ in range(10))


def _sepay_keyword() -> str:
    if settings.sepay_va_account:
        return f"{settings.sepay_keyword_prefix}{settings.sepay_va_account}"
    # Fallback: still allow creating orders (dev), but webhook matching will be less reliable.
    return settings.sepay_keyword_prefix


def _build_transfer_content(order_code: str) -> str:
    # Example: SEVQR-TKP{VA_ACCOUNT}-DFXXXXXXXXXX
    prefix = settings.sepay_transfer_prefix
    keyword = _sepay_keyword()
    if keyword:
        return f"{prefix}-{keyword}-{order_code}"
    return f"{prefix}-{order_code}"


def _build_qr_image_url(*, transfer_content: str, amount_vnd: int) -> str:
    base = settings.sepay_qr_base_url
    if not settings.sepay_va_account or not settings.sepay_bank:
        # Still return an empty string to avoid breaking UI, but encourage config.
        return ""

    params: dict[str, Any] = {
        "acc": settings.sepay_va_account,
        "bank": settings.sepay_bank,
        "des": transfer_content,
    }
    if amount_vnd > 0:
        params["amount"] = str(int(amount_vnd))

    return f"{base}?{urlencode(params)}"


def _require_webhook_secret(request: Request) -> None:
    secret = settings.sepay_webhook_secret
    if not secret:
        return

    header_token = request.headers.get("x-sepay-token")
    query_token = request.query_params.get("token")
    if header_token == secret or query_token == secret:
        return

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")


class CreateOrderRequest(BaseModel):
    plan_id: int
    quantity: int = Field(default=1, ge=1, le=36)
    promo_code: str | None = None


class UpdateOrderRequest(BaseModel):
    quantity: int = Field(default=1, ge=1, le=36)
    promo_code: str | None = None


class OrderResponse(BaseModel):
    order_id: int
    order_code: str
    status: str

    plan_id: int
    plan_name: str

    quantity: int
    subtotal_vnd: int
    discount_vnd: int
    total_vnd: int

    transfer_content: str
    qr_image_url: str

    bank: str
    va_account: str

    model_config = ConfigDict(extra="ignore")


def _compute_amounts(*, plan_price_vnd: int, quantity: int, promo_code: str | None) -> tuple[int, int, int]:
    subtotal = max(0, int(plan_price_vnd)) * max(1, int(quantity))
    discount = 0

    # Keep consistent with current frontend UX: any non-empty promo code => 10% off.
    if promo_code and promo_code.strip():
        discount = max(0, round(subtotal * 0.1))

    total = max(0, subtotal - discount)
    return subtotal, discount, total


def _as_order_response(order: PaymentOrder, plan_name: str) -> OrderResponse:
    return OrderResponse(
        order_id=order.id,
        order_code=order.order_code,
        status=order.status,
        plan_id=order.plan_id,
        plan_name=plan_name,
        quantity=order.quantity,
        subtotal_vnd=order.subtotal_vnd,
        discount_vnd=order.discount_vnd,
        total_vnd=order.total_vnd,
        transfer_content=order.transfer_content,
        qr_image_url=order.qr_image_url,
        bank=settings.sepay_bank,
        va_account=settings.sepay_va_account,
    )


@router.post("/orders", response_model=OrderResponse)
def create_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    plan = db.get(Plan, payload.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Generate unique order_code
    for _ in range(5):
        order_code = _generate_order_code()
        exists = db.query(PaymentOrder).filter(PaymentOrder.order_code == order_code).first()
        if not exists:
            break
    else:
        raise HTTPException(status_code=500, detail="Could not generate order code")

    subtotal, discount, total = _compute_amounts(
        plan_price_vnd=plan.price_vnd,
        quantity=payload.quantity,
        promo_code=payload.promo_code,
    )

    transfer_content = _build_transfer_content(order_code)
    qr_image_url = _build_qr_image_url(transfer_content=transfer_content, amount_vnd=total)

    order = PaymentOrder(
        provider="sepay",
        status="pending",
        user_id=current_user.id,
        plan_id=plan.id,
        quantity=payload.quantity,
        subtotal_vnd=subtotal,
        discount_vnd=discount,
        total_vnd=total,
        promo_code=(payload.promo_code.strip() if payload.promo_code and payload.promo_code.strip() else None),
        order_code=order_code,
        transfer_content=transfer_content,
        qr_image_url=qr_image_url,
        raw_meta_json=json.dumps(
            {
                "bank": settings.sepay_bank,
                "va_account": settings.sepay_va_account,
            },
            ensure_ascii=False,
        ),
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return _as_order_response(order, plan_name=plan.name)


@router.put("/orders/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    payload: UpdateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    order = db.get(PaymentOrder, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Order cannot be updated")

    plan = db.get(Plan, order.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    subtotal, discount, total = _compute_amounts(
        plan_price_vnd=plan.price_vnd,
        quantity=payload.quantity,
        promo_code=payload.promo_code,
    )

    order.quantity = payload.quantity
    order.subtotal_vnd = subtotal
    order.discount_vnd = discount
    order.total_vnd = total
    order.promo_code = (payload.promo_code.strip() if payload.promo_code and payload.promo_code.strip() else None)

    # Transfer content remains stable (order_code based) for reliable webhook matching.
    order.qr_image_url = _build_qr_image_url(transfer_content=order.transfer_content, amount_vnd=total)

    db.add(order)
    db.commit()
    db.refresh(order)

    return _as_order_response(order, plan_name=plan.name)


class SePayWebhookPayload(BaseModel):
    """Schema for SePay webhook payload.

    SePay field names can differ by product/version, so we accept extras.
    We normalize a few common fields used for matching and auditing.
    """

    transaction_id: str | None = Field(default=None, alias="transaction_id")
    # Common alternates
    id: str | None = None
    trans_id: str | None = None

    amount: int | None = None
    money: int | None = None

    description: str | None = None
    content: str | None = None
    des: str | None = None

    bank: str | None = None
    account: str | None = None

    time: str | None = None
    occurred_at: str | None = None

    model_config = ConfigDict(extra="allow", populate_by_name=True)


def _extract_provider_tx_id(p: SePayWebhookPayload) -> str | None:
    for v in [p.transaction_id, p.id, p.trans_id]:
        if v and str(v).strip():
            return str(v).strip()
    return None


def _extract_amount(p: SePayWebhookPayload) -> int:
    for v in [p.amount, p.money]:
        if v is None:
            continue
        try:
            return int(v)
        except Exception:
            continue
    return 0


def _extract_description(p: SePayWebhookPayload) -> str:
    for v in [p.description, p.content, p.des]:
        if v and str(v).strip():
            return str(v).strip()
    return ""


_order_code_re = re.compile(r"\bDF[A-Z0-9]{6,32}\b")


def _extract_order_code_from_description(description: str) -> str | None:
    if not description:
        return None
    m = _order_code_re.search(description.upper())
    return m.group(0) if m else None


@router.post("/sepay/webhook")
async def sepay_webhook(
    request: Request,
    payload: SePayWebhookPayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    _require_webhook_secret(request)

    provider_tx_id = _extract_provider_tx_id(payload)
    if not provider_tx_id:
        raise HTTPException(status_code=400, detail="Missing transaction id")

    # Idempotency: ignore duplicates
    existing = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.provider == "sepay")
        .filter(PaymentTransaction.provider_tx_id == provider_tx_id)
        .first()
    )
    if existing:
        return {"ok": True, "status": "duplicate"}

    amount = _extract_amount(payload)
    description = _extract_description(payload)
    order_code = _extract_order_code_from_description(description)

    order: PaymentOrder | None = None
    if order_code:
        order = db.query(PaymentOrder).filter(PaymentOrder.order_code == order_code).first()

    raw = payload.model_dump(by_alias=True)

    tx = PaymentTransaction(
        provider="sepay",
        provider_tx_id=provider_tx_id,
        amount_vnd=amount,
        description=description or None,
        bank=payload.bank,
        account=payload.account,
        occurred_at=None,
        order_id=order.id if order else None,
        status="received",
        raw_json=json.dumps(raw, ensure_ascii=False),
    )

    db.add(tx)

    # Update order/user if match found
    if order and order.status == "pending":
        # Mark paid if amount covers expected total
        if amount >= int(order.total_vnd):
            order.status = "paid"
            order.paid_at = datetime.now(timezone.utc)

            user = db.get(User, order.user_id)
            if user:
                user.plan_key = f"plan:{order.plan_id}"
                db.add(user)
        else:
            order.status = "amount_mismatch"

        db.add(order)

    db.commit()

    return {
        "ok": True,
        "matched": bool(order),
        "order_code": order_code,
        "order_status": order.status if order else None,
    }
