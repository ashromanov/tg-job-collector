import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.jobs.schemas import JobRead
from app.jobs.service import get_job, list_jobs

router = APIRouter()


@router.get("/", response_model=list[JobRead])
async def read_jobs(
    channel_id: uuid.UUID | None = Query(None),
    extraction_status: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await list_jobs(
        db,
        channel_id=str(channel_id) if channel_id else None,
        extraction_status=extraction_status,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/{job_id}", response_model=JobRead)
async def read_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    job = await get_job(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    return job
