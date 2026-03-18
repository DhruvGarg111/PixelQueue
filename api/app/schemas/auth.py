from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


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


class UserLookupResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    global_role: str

