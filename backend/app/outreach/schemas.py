import uuid
from datetime import datetime

from pydantic import BaseModel


class OutreachLogRead(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID | None = None
    tg_contact: str | None = None
    message_text: str | None = None
    sent_at: datetime | None = None
    status: str | None = None
    error_msg: str | None = None

    model_config = {"from_attributes": True}


class OutreachRetryResponse(BaseModel):
    message: str
