import uuid
from datetime import datetime

from pydantic import BaseModel


class JobRead(BaseModel):
    id: uuid.UUID
    channel_id: uuid.UUID | None = None
    tg_message_id: int | None = None
    raw_text: str
    post_link: str | None = None
    post_date: datetime | None = None
    title: str | None = None
    company: str | None = None
    city: str | None = None
    country: str | None = None
    is_remote: bool | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    employment_type: str | None = None
    tech_stack: list[str] | None = None
    experience_level: str | None = None
    experience_years: str | None = None
    tg_contact: str | None = None
    emails: list[str] | None = None
    phones: list[str] | None = None
    apply_links: list[str] | None = None
    extraction_status: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class JobFilter(BaseModel):
    channel_id: uuid.UUID | None = None
    extraction_status: str | None = None
    search: str | None = None
