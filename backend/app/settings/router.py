from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.settings.schemas import (
    AppSettingsRead,
    AppSettingsUpdate,
    PromptRead,
    PromptTestRequest,
    PromptTestResponse,
    PromptUpdate,
)
from app.settings.service import (
    get_settings,
    list_prompts,
    get_prompt,
    update_settings,
    update_prompt,
)

router = APIRouter()


@router.get("/", response_model=AppSettingsRead)
async def read_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await get_settings(db)


@router.put("/", response_model=AppSettingsRead)
async def write_settings(
    body: AppSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await update_settings(db, body.model_dump(exclude_none=True))


@router.get("/prompts", response_model=list[PromptRead])
async def read_prompts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await list_prompts(db)


@router.get("/prompts/{name}", response_model=PromptRead)
async def read_prompt(
    name: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    prompt = await get_prompt(db, name)
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Prompt {name!r} not found"
        )
    return prompt


@router.put("/prompts/{name}", response_model=PromptRead)
async def write_prompt(
    name: str,
    body: PromptUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        return await update_prompt(db, name, body.content)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/prompts/{name}/test", response_model=PromptTestResponse)
async def test_prompt(
    name: str,
    body: PromptTestRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from app.pipeline.llm import build_llm
    from app.settings.service import get_settings as _get_settings

    prompt = await get_prompt(db, name)
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Prompt {name!r} not found"
        )

    app_settings = await _get_settings(db)
    llm = build_llm(app_settings)

    try:
        prompt_text = prompt.content.format(raw_text=body.sample_text)
    except KeyError:
        prompt_text = prompt.content

    response = await llm.ainvoke(prompt_text)
    result = response.content if hasattr(response, "content") else str(response)
    return PromptTestResponse(result=result)
