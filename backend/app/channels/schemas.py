import uuid
from datetime import datetime

from pydantic import BaseModel


class ChannelRead(BaseModel):
    id: uuid.UUID
    tg_id: int
    username: str | None = None
    title: str | None = None
    monitored: bool | None = None
    added_at: datetime | None = None

    model_config = {"from_attributes": True}


class ChannelUpdate(BaseModel):
    monitored: bool
