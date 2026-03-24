from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.channels.models import Channel


async def upsert_channel(
    db: AsyncSession, tg_id: int, username: str | None, title: str
) -> Channel:
    stmt = (
        insert(Channel)
        .values(tg_id=tg_id, username=username, title=title)
        .on_conflict_do_update(
            index_elements=["tg_id"],
            set_={"title": title, "username": username},
        )
        .returning(Channel)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.scalar_one()


async def list_channels(db: AsyncSession) -> list[Channel]:
    result = await db.execute(select(Channel).order_by(Channel.title))
    return list(result.scalars().all())


async def set_monitored(
    db: AsyncSession, channel_id: str, monitored: bool
) -> Channel | None:
    result = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = result.scalar_one_or_none()
    if not channel:
        return None
    channel.monitored = monitored
    await db.commit()
    await db.refresh(channel)
    return channel


async def get_monitored_tg_ids(db: AsyncSession) -> list[int]:
    result = await db.execute(select(Channel.tg_id).where(Channel.monitored == True))  # noqa: E712
    return list(result.scalars().all())
