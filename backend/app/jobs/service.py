from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.jobs.models import Job


async def create_job(db: AsyncSession, **kwargs) -> Job:
    job = Job(**kwargs)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def get_job(db: AsyncSession, job_id: str) -> Job | None:
    result = await db.execute(select(Job).where(Job.id == job_id))
    return result.scalar_one_or_none()


async def list_jobs(
    db: AsyncSession,
    channel_id: str | None = None,
    extraction_status: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Job]:
    q = select(Job).order_by(Job.created_at.desc())
    if channel_id:
        q = q.where(Job.channel_id == channel_id)
    if extraction_status:
        q = q.where(Job.extraction_status == extraction_status)
    if search:
        term = f"%{search}%"
        q = q.where(
            Job.title.ilike(term) | Job.company.ilike(term) | Job.raw_text.ilike(term)
        )
    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    return list(result.scalars().all())
