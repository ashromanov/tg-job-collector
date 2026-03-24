from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.outreach.models import OutreachLog


async def list_outreach(
    db: AsyncSession,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[OutreachLog]:
    q = select(OutreachLog).order_by(OutreachLog.sent_at.desc().nullslast())
    if status:
        q = q.where(OutreachLog.status == status)
    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    return list(result.scalars().all())
