import uuid
from datetime import datetime

from pydantic import BaseModel


class MatchRead(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID | None = None
    cv_id: uuid.UUID | None = None
    score: int | None = None
    reasoning: str | None = None
    status: str | None = None
    created_at: datetime | None = None
    job_title: str | None = None
    job_company: str | None = None
    cv_name: str | None = None

    model_config = {"from_attributes": True}
