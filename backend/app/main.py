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
    except Exception:
        # If migration fails, do not block server startup.
        # (Admin/user flows will surface issues in logs.)
        pass


@app.get("/")
def read_root():
    return {"message": "Hello! DocuFlowAI is running perfectly."}