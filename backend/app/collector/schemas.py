from pydantic import BaseModel


class IngestPayload(BaseModel):
    channel_tg_id: int
    message_id: int
    text: str
    post_date: str  # ISO datetime string
    post_link: str | None = None
