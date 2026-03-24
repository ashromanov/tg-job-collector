from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as env_settings
from app.database import AsyncSessionFactory
from app.settings.models import AppSettings, Prompt

DEFAULT_PROMPTS = {
    "extraction": """Extract job posting information from the following Telegram message text.
Return a JSON object with these fields (use null if not found):
- title: job title/role name
- company: company name
- city: city name
- country: country name
- is_remote: boolean, true if remote work is mentioned
- salary_min: minimum salary as integer (null if not found)
- salary_max: maximum salary as integer (null if not found)
- salary_currency: currency code (USD, EUR, RUB, etc.)
- employment_type: one of "full-time", "part-time", "contract", "freelance", or null
- tech_stack: array of technology/skill names
- experience_level: one of "junior", "mid", "senior", or null
- experience_years: years of experience as string (e.g. "3-5", "2+")
- tg_contact: telegram @username or t.me/ link for contact (single string or null)
- emails: array of email addresses found
- phones: array of phone numbers found
- apply_links: array of application URLs (excluding telegram links)

Message text:
{raw_text}""",
    "matching": """You are evaluating how well a job posting matches a candidate's CV.

JOB POSTING:
{job_json}

CANDIDATE CV:
{cv_text}

Score the match from 0 to 100 and explain why. Consider:
- Technical skills alignment
- Experience level match
- Employment type preference
- Location/remote compatibility

Return JSON: {{"score": <0-100>, "reasoning": "<2-3 sentences explaining the match>"}}""",
    "outreach": """Write a short professional outreach message for a job application.

JOB: {job_title} at {company}
CV SUMMARY: {cv_text_excerpt}

USER TEMPLATE:
{template}

Fill in the template placeholders and add 1-2 natural sentences connecting the candidate's background to this specific role. Keep it concise and professional. Return only the final message text.""",
}


async def seed_defaults() -> None:
    async with AsyncSessionFactory() as db:
        result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
        if result.scalar_one_or_none() is None:
            db.add(
                AppSettings(
                    id=1,
                    openrouter_api_key=env_settings.openrouter_api_key,
                    llm_model=env_settings.llm_model,
                )
            )

        for name, content in DEFAULT_PROMPTS.items():
            result = await db.execute(select(Prompt).where(Prompt.name == name))
            if result.scalar_one_or_none() is None:
                db.add(Prompt(name=name, content=content))

        await db.commit()


async def get_settings(db: AsyncSession) -> AppSettings:
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    return result.scalar_one()


async def update_settings(db: AsyncSession, data: dict) -> AppSettings:
    app_settings = await get_settings(db)
    for key, value in data.items():
        if value is not None:
            setattr(app_settings, key, value)
    await db.commit()
    await db.refresh(app_settings)
    return app_settings


async def get_prompt(db: AsyncSession, name: str) -> Prompt | None:
    result = await db.execute(select(Prompt).where(Prompt.name == name))
    return result.scalar_one_or_none()


async def list_prompts(db: AsyncSession) -> list[Prompt]:
    result = await db.execute(select(Prompt))
    return list(result.scalars().all())


async def update_prompt(db: AsyncSession, name: str, content: str) -> Prompt:
    prompt = await get_prompt(db, name)
    if not prompt:
        raise ValueError(f"Prompt {name!r} not found")
    prompt.content = content
    await db.commit()
    await db.refresh(prompt)
    return prompt
