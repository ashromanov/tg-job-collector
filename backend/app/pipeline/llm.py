from langchain_openai import ChatOpenAI

from app.settings.models import AppSettings


def build_llm(app_settings: AppSettings) -> ChatOpenAI:
    return ChatOpenAI(
        model=app_settings.llm_model or "openai/gpt-4o-mini",
        openai_api_key=app_settings.openrouter_api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "https://tg-job-collector",
            "X-Title": "tg-job-collector",
        },
    )
