from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.matches.models import Match


async def list_matches(
    db: AsyncSession,
    cv_id: str | None = None,
    min_score: int | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Match]:
    q = select(Match).order_by(Match.created_at.desc())
    if cv_id:
        q = q.where(Match.cv_id == cv_id)
    if min_score is not None:
        q = q.where(Match.score >= min_score)
    if status:
        q = q.where(Match.status == status)
    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_match(db: AsyncSession, match_id: str) -> Match | None:
    result = await db.execute(select(Match).where(Match.id == match_id))
    return result.scalar_one_or_none()
