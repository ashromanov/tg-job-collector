import uuid
from datetime import datetime

from sqlalchemy import Boolean, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AppSettings(Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    openrouter_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    llm_model: Mapped[str | None] = mapped_column(
        Text, nullable=True, default="openai/gpt-4o-mini"
    )
    outreach_paused: Mapped[bool | None] = mapped_column(
        Boolean, server_default=text("false")
    )
    onboarding_complete: Mapped[bool | None] = mapped_column(
        Boolean, server_default=text("false")
    )
    updated_at: Mapped[datetime | None] = mapped_column(server_default=text("now()"))


class Prompt(Base):
    __tablename__ = "prompts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(server_default=text("now()"))
