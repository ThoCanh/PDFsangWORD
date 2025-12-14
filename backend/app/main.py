from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .core.config import settings
from .db.base import Base
from .db.session import engine
from .db import models as _models  # noqa: F401
from .core.log_buffer import install_log_buffer

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


@app.get("/")
def read_root():
    return {"message": "Hello! DocuFlowAI is running perfectly."}