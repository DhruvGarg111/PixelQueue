from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PresignUploadRequest(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=100)


class PresignUploadResponse(BaseModel):
    object_key: str
    upload_url: str
    expires_in: int


class CommitUploadRequest(BaseModel):
    object_key: str
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    checksum: str | None = None


class ImageResponse(BaseModel):
    id: UUID
    project_id: UUID
    object_key: str
    width: int
    height: int
    checksum: str | None
    annotation_revision: int
    uploaded_by: UUID
    created_at: datetime
    download_url: str | None = None


class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    image_id: UUID
    status: str
    assigned_to: UUID | None
    created_at: datetime
    updated_at: datetime
    image: ImageResponse | None = None

