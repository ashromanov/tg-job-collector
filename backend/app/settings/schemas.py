import uuid
from datetime import datetime

from pydantic import BaseModel


class AppSettingsRead(BaseModel):
    id: int
    openrouter_api_key: str | None = None
    llm_model: str | None = None
    outreach_paused: bool | None = None
    onboarding_complete: bool | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class AppSettingsUpdate(BaseModel):
    openrouter_api_key: str | None = None
    llm_model: str | None = None
    outreach_paused: bool | None = None
    onboarding_complete: bool | None = None


class PromptRead(BaseModel):
    id: uuid.UUID
    name: str
    content: str
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class PromptUpdate(BaseModel):
    content: str


class PromptTestRequest(BaseModel):
    sample_text: str


class PromptTestResponse(BaseModel):
    result: str
