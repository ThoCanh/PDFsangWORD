from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="user")

    # Current plan key for the user. Keep it simple and stable for the frontend.
    # Examples: "free", "plan:12".
    plan_key: Mapped[str] = mapped_column(String(64), nullable=False, default="free")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class ConversionJob(Base):
    __tablename__ = "conversion_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tool_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    user_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    client_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)

    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False, default="processing")
    mode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    has_text_layer: Mapped[int | None] = mapped_column(Integer, nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    price_vnd: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    billing_cycle: Mapped[str] = mapped_column(String(16), nullable=False, default="month")
    doc_limit_per_month: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)

    # Stored as JSON text for simplicity.
    features_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    tools_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
