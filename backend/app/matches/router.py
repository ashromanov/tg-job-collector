import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.cvs.models import CV
from app.database import get_db
from app.jobs.models import Job
from app.matches.schemas import MatchRead
from app.matches.service import get_match, list_matches

router = APIRouter()


@router.get("", response_model=list[MatchRead])
async def read_matches(
    cv_id: uuid.UUID | None = Query(None),
    min_score: int | None = Query(None, ge=0, le=100),
    match_status: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await list_matches(
        db,
        cv_id=str(cv_id) if cv_id else None,
        min_score=min_score,
        status=match_status,
        limit=limit,
        offset=offset,
    )


@router.get("/{match_id}", response_model=MatchRead)
async def read_match(
    match_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    match = await get_match(db, match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )

    job_title = None
    job_company = None
    cv_name = None

    if match.job_id:
        job_result = await db.execute(select(Job).where(Job.id == match.job_id))
        job = job_result.scalar_one_or_none()
        if job:
            job_title = job.title
            job_company = job.company

    if match.cv_id:
        cv_result = await db.execute(select(CV).where(CV.id == match.cv_id))
        cv = cv_result.scalar_one_or_none()
        if cv:
            cv_name = cv.name

    read = MatchRead.model_validate(match)
    read.job_title = job_title
    read.job_company = job_company
    read.cv_name = cv_name
    return read
