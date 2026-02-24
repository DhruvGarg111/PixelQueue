from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AutoLabelCreateResponse(BaseModel):
    job_id: UUID
    status: str


class ExportCreateRequest(BaseModel):
    format: str


class ExportJobResponse(BaseModel):
    id: UUID
    project_id: UUID
    format: str
    status: str
    object_key: str | None
    summary_jsonb: dict
    error_text: str | None
    created_at: datetime
    finished_at: datetime | None
    download_url: str | None = None

