from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.cvs.schemas import CVRead, CVUpdate
from app.cvs.service import create_cv, delete_cv, list_cvs, parse_content, update_cv
from app.database import get_db

router = APIRouter()


@router.post("/", response_model=CVRead, status_code=status.HTTP_201_CREATED)
async def upload_cv(
    file: UploadFile = File(...),
    name: str = Form(...),
    match_threshold: int = Form(70),
    cv_link: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_bytes = await file.read()
    filename = file.filename or ""
    try:
        content_text = await parse_content(file_bytes, filename)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )
    return await create_cv(
        db,
        str(current_user.id),
        name,
        content_text,
        match_threshold,
        file_bytes=file_bytes,
        filename=filename,
        cv_link=cv_link or None,
    )


@router.get("/", response_model=list[CVRead])
async def get_cvs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await list_cvs(db, str(current_user.id))


@router.patch("/{cv_id}", response_model=CVRead)
async def patch_cv(
    cv_id: str,
    body: CVUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = await update_cv(
        db,
        cv_id,
        str(current_user.id),
        **body.model_dump(exclude_none=True),
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV not found"
        )
    return updated


@router.delete("/{cv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cv(
    cv_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = await delete_cv(db, cv_id, str(current_user.id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV not found"
        )
