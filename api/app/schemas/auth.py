from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class MembershipView(BaseModel):
    project_id: UUID
    role: str


class MeResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    global_role: str
    memberships: list[MembershipView]
    created_at: datetime

