from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, model_validator


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
    user_id: UUID | None = None
    email: EmailStr | None = None
    role: str

    @model_validator(mode="after")
    def validate_target(self) -> "MembershipUpsertRequest":
        if not self.user_id and not self.email:
            raise ValueError("either user_id or email is required")
        return self


class MembershipResponse(BaseModel):
    id: UUID
    user_id: UUID
    project_id: UUID
    role: str
    created_at: datetime
    email: EmailStr | None = None
    full_name: str | None = None
    global_role: str | None = None

