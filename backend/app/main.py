from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .core.config import settings
from .db.base import Base
from .db.session import engine
from .db import models as _models  # noqa: F401
from .core.log_buffer import install_log_buffer
from sqlalchemy import inspect, text

# CHÚ Ý: Biến này BẮT BUỘC phải tên là 'app' (vì lệnh chạy là :app)
app = FastAPI(title=settings.app_name)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
if origins:
    allow_all = "*" in origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if allow_all else origins,
        # If allow_origins is '*', credentials must be disabled for browsers.
        allow_credentials=False if allow_all else True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "X-Conversion-Mode",
            "X-PDF-Has-Text",
            "Content-Disposition",
        ],
    )

app.include_router(api_router)


@app.on_event("startup")
def _init_db() -> None:
    install_log_buffer()
    app.state.started_at = datetime.now(timezone.utc)
    Base.metadata.create_all(bind=engine)

    # Lightweight migration (no Alembic in this project).
    # Ensure new columns exist for existing databases.
    try:
        inspector = inspect(engine)
        existing_cols = {c.get("name") for c in inspector.get_columns("users")}
        if "plan_key" not in existing_cols:
            with engine.begin() as conn:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN plan_key VARCHAR(64) NOT NULL DEFAULT 'free'")
                )
        if "plan_assigned_at" not in existing_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN plan_assigned_at TIMESTAMP WITH TIME ZONE NULL"))
        if "plan_duration_months" not in existing_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN plan_duration_months INTEGER NULL"))

        plan_cols = {c.get("name") for c in inspector.get_columns("plans")}
        if "tools_json" not in plan_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE plans ADD COLUMN tools_json TEXT NOT NULL DEFAULT '[]'"))

        job_cols = {c.get("name") for c in inspector.get_columns("conversion_jobs")}
        if "user_id" not in job_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE conversion_jobs ADD COLUMN user_id INTEGER"))

        # Payments tables/columns (SQLite/Postgres friendly, best-effort)
        try:
            po_cols = {c.get("name") for c in inspector.get_columns("payment_orders")}
            if "user_account_name" not in po_cols:
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE payment_orders ADD COLUMN user_account_name VARCHAR(320) NOT NULL DEFAULT ''"
                        )
                    )
            if "plan_name" not in po_cols:
                with engine.begin() as conn:
                    conn.execute(
                        text("ALTER TABLE payment_orders ADD COLUMN plan_name VARCHAR(128) NOT NULL DEFAULT ''")
                    )
            if "unit_price_vnd" not in po_cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE payment_orders ADD COLUMN unit_price_vnd INTEGER NOT NULL DEFAULT 0"))
        except Exception:
            # Table may not exist yet on first run, or DB may not support ALTER in the same way.
            pass
        # Ensure plan_assignments table exists (history of admin/system plan assignments)
        try:
            tables = {t for t in inspector.get_table_names()}
            if "plan_assignments" not in tables:
                with engine.begin() as conn:
                    # Create a minimal table compatible with SQLite/Postgres
                    conn.execute(
                        text(
                            """
                        CREATE TABLE plan_assignments (
                            id INTEGER PRIMARY KEY,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            user_id INTEGER NOT NULL,
                            user_name VARCHAR(320) NOT NULL DEFAULT '',
                            plan_id INTEGER NOT NULL,
                            plan_key VARCHAR(64) NOT NULL DEFAULT '',
                            start_at TIMESTAMP WITH TIME ZONE NULL,
                            duration_months INTEGER NULL,
                            assigned_by INTEGER NULL,
                            assigned_by_name VARCHAR(320) NULL,
                            notes TEXT NULL
                        )
                    """
                        )
                    )
        except Exception:
            pass
    except Exception:
        # If migration fails, do not block server startup.
        # (Admin/user flows will surface issues in logs.)
        pass


@app.get("/")
def read_root():
    return {"message": "Hello! DocuFlowAI is running perfectly."}