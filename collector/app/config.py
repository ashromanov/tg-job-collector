from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    telegram_api_id: int = 0
    telegram_api_hash: str = ""
    backend_url: str = "http://backend:8000"
    internal_secret: str = "changeme"
    session_path: str = "session/user"


settings = Settings()
