import uuid
from datetime import datetime

from sqlalchemy import ARRAY, BigInteger, Boolean, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    channel_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    tg_message_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    post_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    post_date: Mapped[datetime | None] = mapped_column(nullable=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    company: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)
    country: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_remote: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str | None] = mapped_column(Text, nullable=True)
    employment_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    tech_stack: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text()), server_default=text("'{}'")
    )
    experience_level: Mapped[str | None] = mapped_column(Text, nullable=True)
    experience_years: Mapped[str | None] = mapped_column(Text, nullable=True)
    tg_contact: Mapped[str | None] = mapped_column(Text, nullable=True)
    emails: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text()), server_default=text("'{}'")
    )
    phones: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text()), server_default=text("'{}'")
    )
    apply_links: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text()), server_default=text("'{}'")
    )
    extraction_status: Mapped[str | None] = mapped_column(
        Text, server_default=text("'pending'")
    )
    created_at: Mapped[datetime | None] = mapped_column(server_default=text("now()"))
