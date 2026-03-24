import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.channels.service import upsert_channel
from app.collector.client import (
    get_collector_channels,
    get_qr_start,
    get_qr_status,
    set_channel_monitored,
)
from app.collector.schemas import IngestPayload
from app.config import settings
from app.database import get_db
from app.jobs.service import create_job

router = APIRouter()


def _verify_internal_secret(x_internal_secret: str = Header(...)) -> None:
    if x_internal_secret != settings.internal_secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("/internal/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest(
    payload: IngestPayload,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_verify_internal_secret),
):
    channel = await upsert_channel(
        db,
        tg_id=payload.channel_tg_id,
        username=None,
        title=str(payload.channel_tg_id),
    )

    try:
        post_date = datetime.fromisoformat(payload.post_date)
    except ValueError:
        post_date = datetime.now(timezone.utc)

    job = await create_job(
        db,
        channel_id=channel.id,
        tg_message_id=payload.message_id,
        raw_text=payload.text,
        post_link=payload.post_link,
        post_date=post_date,
        extraction_status="pending",
    )

    from app.pipeline.graph import run_pipeline

    asyncio.create_task(run_pipeline(str(job.id), job.raw_text))

    return {"job_id": str(job.id)}


@router.get("/collector/qr/start")
async def qr_start():
    return await get_qr_start()


@router.get("/collector/qr/status")
async def qr_status():
    return await get_qr_status()


@router.get("/collector/channels")
async def collector_channels(
    db: AsyncSession = Depends(get_db),
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


@router.patch("/collector/channels/{tg_id}/monitor")
async def monitor_channel(
    tg_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    from app.channels.models import Channel
    from app.channels.service import set_monitored

    monitored = body.get("monitored", False)
    result = await db.execute(select(Channel).where(Channel.tg_id == tg_id))
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )

    updated = await set_monitored(db, str(channel.id), monitored)
    try:
        await set_channel_monitored(tg_id, monitored)
    except Exception:
        pass

    return updated
