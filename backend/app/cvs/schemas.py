import uuid
from datetime import datetime

from pydantic import BaseModel


class CVCreate(BaseModel):
    name: str
    match_threshold: int = 70


class CVRead(BaseModel):
    id: uuid.UUID
    name: str
    match_threshold: int | None = None
    active: bool | None = None
    cv_link: str | None = None
    file_path: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class CVUpdate(BaseModel):
    name: str | None = None
    match_threshold: int | None = None
    active: bool | None = None
    cv_link: str | None = None
