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
