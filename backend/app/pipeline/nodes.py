import logging
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.cvs.models import CV
from app.database import AsyncSessionFactory
from app.jobs.models import Job
from app.matches.models import Match
from app.outreach.models import OutreachLog
from app.pipeline.llm import build_llm
from app.pipeline.state import (
    CVData,
    ExtractedJob,
    MatchResult,
    MatchScore,
    PipelineState,
)
from app.settings.service import get_prompt, get_settings

logger = logging.getLogger(__name__)


async def extract_node(state: PipelineState) -> PipelineState:
    async with AsyncSessionFactory() as db:
        app_settings = await get_settings(db)
        prompt = await get_prompt(db, "extraction")

        if not app_settings.openrouter_api_key:
            state["errors"].append("OpenRouter API key not configured")
            await _set_extraction_status(db, state["job_id"], "failed")
            return state

        llm = build_llm(app_settings)
        structured_llm = llm.with_structured_output(ExtractedJob)

        try:
            prompt_text = prompt.content.format(raw_text=state["raw_text"])
            extracted: ExtractedJob = await structured_llm.ainvoke(prompt_text)
            state["extracted_job"] = extracted
            await _update_job_fields(db, state["job_id"], extracted)
        except Exception as e:
            logger.error("Extraction failed for job %s: %s", state["job_id"], e)
            state["errors"].append(f"Extraction error: {e}")
            await _set_extraction_status(db, state["job_id"], "failed")

    return state


async def load_cvs_node(state: PipelineState) -> PipelineState:
    async with AsyncSessionFactory() as db:
        result = await db.execute(select(CV).where(CV.active == True))  # noqa: E712
        cvs = result.scalars().all()
        state["cvs"] = [
            CVData(
                id=str(cv.id),
                name=cv.name,
                content_text=cv.content_text,
                match_threshold=cv.match_threshold or 70,
            )
            for cv in cvs
        ]
    return state


async def match_node(state: PipelineState) -> PipelineState:
    if not state["extracted_job"] or not state["cvs"]:
        return state

    async with AsyncSessionFactory() as db:
        app_settings = await get_settings(db)
        prompt = await get_prompt(db, "matching")
        llm = build_llm(app_settings)
        structured_llm = llm.with_structured_output(MatchScore)

        job_json = state["extracted_job"].model_dump_json(indent=2)
        results: list[MatchResult] = []

        for cv in state["cvs"]:
            try:
                prompt_text = prompt.content.format(
                    job_json=job_json, cv_text=cv.content_text
                )
                score_result: MatchScore = await structured_llm.ainvoke(prompt_text)
                eligible = score_result.score >= cv.match_threshold
                results.append(
                    MatchResult(
                        cv_id=cv.id,
                        score=score_result.score,
                        reasoning=score_result.reasoning,
                        eligible=eligible,
                    )
                )
                match = Match(
                    job_id=state["job_id"],
                    cv_id=cv.id,
                    score=score_result.score,
                    reasoning=score_result.reasoning,
                    status="pending",
                )
                db.add(match)
            except Exception as e:
                logger.error("Matching failed for cv %s: %s", cv.id, e)
                state["errors"].append(f"Match error cv={cv.id}: {e}")

        await db.commit()
        state["match_results"] = results

    return state


async def outreach_node(state: PipelineState) -> PipelineState:
    if not state["match_results"]:
        return state

    tg_contact = state["extracted_job"].tg_contact if state["extracted_job"] else None

    async with AsyncSessionFactory() as db:
        app_settings = await get_settings(db)

        if app_settings.outreach_paused:
            await _bulk_update_match_status(
                db, state["job_id"], state["match_results"], "outreach_pending"
            )
            await db.commit()
            return state

        prompt = await get_prompt(db, "outreach")
        llm = build_llm(app_settings)

        job = await db.get(Job, state["job_id"])

        for match_result in state["match_results"]:
            if not match_result.eligible:
                await _set_match_status(
                    db, state["job_id"], match_result.cv_id, "skipped"
                )
                continue

            if not tg_contact:
                await _set_match_status(
                    db, state["job_id"], match_result.cv_id, "outreach_pending"
                )
                continue

            try:
                cv_result = await db.execute(
                    select(CV).where(CV.id == match_result.cv_id)
                )
                cv = cv_result.scalar_one_or_none()
                if not cv:
                    continue

                prompt_text = prompt.content.format(
                    job_title=job.title or "Unknown",
                    company=job.company or "Unknown",
                    cv_text_excerpt=cv.content_text[:1500],
                    template="Hi, I'm interested in the {job_title} position at {company}. [add 1-2 sentences]",
                )
                message_text = await llm.ainvoke(prompt_text)
                message_str = (
                    message_text.content
                    if hasattr(message_text, "content")
                    else str(message_text)
                )

                from app.collector.client import send_dm

                await send_dm(tg_contact, message_str)

                log = OutreachLog(
                    match_id=await _get_match_id(
                        db, state["job_id"], match_result.cv_id
                    ),
                    tg_contact=tg_contact,
                    message_text=message_str,
                    sent_at=datetime.now(timezone.utc),
                    status="sent",
                )
                db.add(log)
                await _set_match_status(
                    db, state["job_id"], match_result.cv_id, "outreach_sent"
                )

            except Exception as e:
                logger.error("Outreach failed: %s", e)
                state["errors"].append(f"Outreach error: {e}")
                log = OutreachLog(
                    match_id=await _get_match_id(
                        db, state["job_id"], match_result.cv_id
                    ),
                    tg_contact=tg_contact or "",
                    message_text="",
                    status="failed",
                    error_msg=str(e),
                )
                db.add(log)
                await _set_match_status(
                    db, state["job_id"], match_result.cv_id, "outreach_pending"
                )

        await db.commit()

    return state


async def _update_job_fields(
    db: AsyncSession, job_id: str, extracted: ExtractedJob
) -> None:
    await db.execute(
        update(Job)
        .where(Job.id == job_id)
        .values(
            **{k: v for k, v in extracted.model_dump().items() if v is not None},
            extraction_status="done",
        )
    )
    await db.commit()


async def _set_extraction_status(db: AsyncSession, job_id: str, status: str) -> None:
    await db.execute(
        update(Job).where(Job.id == job_id).values(extraction_status=status)
    )
    await db.commit()


async def _set_match_status(
    db: AsyncSession, job_id: str, cv_id: str, status: str
) -> None:
    await db.execute(
        update(Match)
        .where(Match.job_id == job_id, Match.cv_id == cv_id)
        .values(status=status)
    )


async def _bulk_update_match_status(
    db: AsyncSession, job_id: str, results: list[MatchResult], status: str
) -> None:
    eligible_cv_ids = [r.cv_id for r in results if r.eligible]
    if eligible_cv_ids:
        await db.execute(
            update(Match)
            .where(Match.job_id == job_id, Match.cv_id.in_(eligible_cv_ids))
            .values(status=status)
        )


async def _get_match_id(db: AsyncSession, job_id: str, cv_id: str) -> str:
    result = await db.execute(
        select(Match).where(Match.job_id == job_id, Match.cv_id == cv_id)
    )
    match = result.scalar_one()
    return str(match.id)
