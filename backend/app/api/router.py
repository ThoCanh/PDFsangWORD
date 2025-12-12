from __future__ import annotations

from fastapi import APIRouter

from .routes.convert import router as convert_router
from .routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(convert_router)
api_router.include_router(health_router)
