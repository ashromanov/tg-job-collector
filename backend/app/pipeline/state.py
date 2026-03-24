from typing import TypedDict

from pydantic import BaseModel


class ExtractedJob(BaseModel):
    title: str | None = None
    company: str | None = None
    city: str | None = None
    country: str | None = None
    is_remote: bool | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    employment_type: str | None = None
    tech_stack: list[str] = []
    experience_level: str | None = None
    experience_years: str | None = None
    tg_contact: str | None = None
    emails: list[str] = []
    phones: list[str] = []
    apply_links: list[str] = []


class CVData(BaseModel):
    id: str
    name: str
    content_text: str
    match_threshold: int
    cv_link: str | None = None
    file_path: str | None = None


class MatchResult(BaseModel):
    cv_id: str
    score: int
    reasoning: str
    eligible: bool  # score >= threshold


class MatchScore(BaseModel):
    score: int
    reasoning: str


class PipelineState(TypedDict):
    job_id: str
    raw_text: str
    extracted_job: ExtractedJob | None
    cvs: list[CVData]
    match_results: list[MatchResult]
    errors: list[str]
