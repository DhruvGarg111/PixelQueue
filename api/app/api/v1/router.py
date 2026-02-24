from fastapi import APIRouter

from app.api.v1.annotations import router as annotations_router
from app.api.v1.auth import router as auth_router
from app.api.v1.events import router as events_router
from app.api.v1.exports import router as exports_router
from app.api.v1.health import router as health_router
from app.api.v1.images import router as images_router
from app.api.v1.projects import router as projects_router
from app.api.v1.users import router as users_router


api_router = APIRouter()
api_router.include_router(auth_router, prefix="/api/v1")
api_router.include_router(projects_router, prefix="/api/v1")
api_router.include_router(images_router, prefix="/api/v1")
api_router.include_router(annotations_router, prefix="/api/v1")
api_router.include_router(exports_router, prefix="/api/v1")
api_router.include_router(events_router, prefix="/api/v1")
api_router.include_router(users_router)
api_router.include_router(health_router)
