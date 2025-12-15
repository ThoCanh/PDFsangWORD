from __future__ import annotations

from fastapi import APIRouter

from .routes.admin import router as admin_router
from .routes.auth import router as auth_router
from .routes.convert import router as convert_router
from .routes.health import router as health_router
from .routes.plans import router as plans_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(plans_router)
api_router.include_router(convert_router)
api_router.include_router(health_router)
