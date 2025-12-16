from __future__ import annotations

from datetime import datetime, timedelta, timezone


def compute_order_expiry(created_at: datetime | None, minutes: int = 3) -> datetime:
    """Compute expiry time for a payment order.

    If created_at is naive, assume UTC.
    """

    if created_at is None:
        created_at = datetime.now(timezone.utc)

    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    return created_at + timedelta(minutes=minutes)


def add_months(dt: datetime, months: int) -> datetime:
    """Add months to a datetime, clamping the day to the last day of target month."""

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    y = dt.year
    m = dt.month + int(months)
    y += (m - 1) // 12
    m = ((m - 1) % 12) + 1

    # last day of target month
    # (simple: move to first of next month, subtract a day)
    if m == 12:
        next_month = datetime(y + 1, 1, 1, tzinfo=dt.tzinfo)
    else:
        next_month = datetime(y, m + 1, 1, tzinfo=dt.tzinfo)
    last_day = (next_month - timedelta(days=1)).day

    day = min(dt.day, last_day)
    return dt.replace(year=y, month=m, day=day)


def compute_subscription_expiry(paid_at: datetime, quantity: int, billing_cycle: str = "month") -> datetime:
    cycle = (billing_cycle or "month").lower()
    qty = max(1, int(quantity or 1))

    if cycle == "year":
        return add_months(paid_at, qty * 12)
    if cycle == "lifetime":
        # 100 years is effectively lifetime for display purposes
        return add_months(paid_at, 12 * 100)

    return add_months(paid_at, qty)
