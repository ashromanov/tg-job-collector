import io
import os
import uuid as uuid_lib

from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cvs.models import CV

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "/app/uploads")


async def parse_content(file_bytes: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if not text.strip():
            raise ValueError(
                "PDF appears to be scanned or empty — no text could be extracted"
            )
        return text
    return file_bytes.decode("utf-8", errors="replace")


def _save_file(cv_id: str, file_bytes: bytes, filename: str) -> str:
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    ext = os.path.splitext(filename)[1].lower() or ".bin"
    path = os.path.join(UPLOADS_DIR, f"{cv_id}{ext}")
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path


async def create_cv(
    db: AsyncSession,
    user_id: str,
    name: str,
    content_text: str,
    threshold: int,
    file_bytes: bytes | None = None,
    filename: str = "",
    cv_link: str | None = None,
) -> CV:
    cv_id = str(uuid_lib.uuid4())
    file_path: str | None = None
    if file_bytes:
        file_path = _save_file(cv_id, file_bytes, filename)
    cv = CV(
        id=cv_id,
        user_id=user_id,
        name=name,
        content_text=content_text,
        match_threshold=threshold,
        cv_link=cv_link,
        file_path=file_path,
    )
    db.add(cv)
    await db.commit()
    await db.refresh(cv)
    return cv


async def list_cvs(db: AsyncSession, user_id: str) -> list[CV]:
    result = await db.execute(
        select(CV).where(CV.user_id == user_id).order_by(CV.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_cv(db: AsyncSession, cv_id: str, user_id: str) -> bool:
    result = await db.execute(select(CV).where(CV.id == cv_id, CV.user_id == user_id))
    cv = result.scalar_one_or_none()
    if not cv:
        return False
    await db.delete(cv)
    await db.commit()
    return True


async def update_cv(db: AsyncSession, cv_id: str, user_id: str, **kwargs) -> CV | None:
    result = await db.execute(select(CV).where(CV.id == cv_id, CV.user_id == user_id))
    cv = result.scalar_one_or_none()
    if not cv:
        return None
    for key, value in kwargs.items():
        setattr(cv, key, value)
    await db.commit()
    await db.refresh(cv)
    return cv
