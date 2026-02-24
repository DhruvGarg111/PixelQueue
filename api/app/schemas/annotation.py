from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class Point(BaseModel):
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)


class BBoxGeometry(BaseModel):
    type: Literal["bbox"]
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    w: float = Field(gt=0, le=1)
    h: float = Field(gt=0, le=1)

    @model_validator(mode="after")
    def validate_bounds(self) -> "BBoxGeometry":
        if self.x + self.w > 1.00001 or self.y + self.h > 1.00001:
            raise ValueError("bbox exceeds normalized image bounds")
        return self


class PolygonGeometry(BaseModel):
    type: Literal["polygon"]
    points: list[Point] = Field(min_length=3)


Geometry = BBoxGeometry | PolygonGeometry


class AnnotationWriteItem(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    geometry: Geometry
    source: Literal["manual", "auto"] = "manual"
    status: Literal["draft", "approved", "rejected"] = "draft"
    confidence: float | None = Field(default=None, ge=0, le=1)


class AnnotationSaveRequest(BaseModel):
    expected_revision: int = Field(ge=0)
    annotations: list[AnnotationWriteItem]


class AnnotationView(BaseModel):
    id: UUID
    project_id: UUID
    image_id: UUID
    label: str
    geometry: dict
    source: str
    status: str
    confidence: float | None
    revision: int
    created_by: UUID
    updated_by: UUID
    created_at: datetime
    updated_at: datetime


class AnnotationBundleResponse(BaseModel):
    image_id: UUID
    revision: int
    task_status: str | None = None
    annotations: list[AnnotationView]


class ReviewRequest(BaseModel):
    action: Literal["approve", "reject"]
    comment: str | None = None

