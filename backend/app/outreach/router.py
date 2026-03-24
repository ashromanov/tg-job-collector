import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.matches.models import Match
from app.outreach.schemas import OutreachLogRead, OutreachRetryResponse
from app.outreach.service import list_outreach

router = APIRouter()


@router.get("", response_model=list[OutreachLogRead])
async def read_outreach(
    outreach_status: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await list_outreach(db, status=outreach_status, limit=limit, offset=offset)


@router.post("/{outreach_id}/retry", response_model=OutreachRetryResponse)
async def retry_outreach(
    outreach_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from app.outreach.models import OutreachLog

    result = await db.execute(select(OutreachLog).where(OutreachLog.id == outreach_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Outreach log not found"
        )

    match_result = await db.execute(select(Match).where(Match.id == log.match_id))
    match = match_result.scalar_one_or_none()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Associated match not found"
        )

    from app.jobs.models import Job

    job_result = await db.execute(select(Job).where(Job.id == match.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Associated job not found"
        )

    from app.pipeline.graph import run_pipeline

    asyncio.create_task(run_pipeline(str(job.id), job.raw_text))

    return OutreachRetryResponse(message="Retry pipeline triggered")
