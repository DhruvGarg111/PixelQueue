from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    created_by: UUID
    created_at: datetime
    my_role: str | None = None


class MembershipUpsertRequest(BaseModel):
    user_id: UUID
    role: str


class MembershipResponse(BaseModel):
    id: UUID
    user_id: UUID
    project_id: UUID
    role: str
    created_at: datetime

