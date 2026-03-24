from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.channels.schemas import ChannelRead, ChannelUpdate
from app.channels.service import list_channels, set_monitored, upsert_channel
from app.collector.client import get_collector_channels, set_channel_monitored
from app.database import get_db

router = APIRouter()


@router.get("", response_model=list[ChannelRead])
async def read_channels(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await list_channels(db)


@router.get("/sync", response_model=list[ChannelRead])
async def sync_channels(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    dialogs = await get_collector_channels()
    channels = []
    for dialog in dialogs:
        channel = await upsert_channel(
            db,
            tg_id=dialog["tg_id"],
            username=dialog.get("username"),
            title=dialog.get("title", ""),
        )
        channels.append(channel)
    return channels


@router.patch("/{channel_id}", response_model=ChannelRead)
async def patch_channel(
    channel_id: str,
    body: ChannelUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy import select
    from app.channels.models import Channel

    result = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )

    updated = await set_monitored(db, channel_id, body.monitored)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )

    try:
        await set_channel_monitored(updated.tg_id, body.monitored)
    except Exception:
        pass

    return updated
