from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "tgjobs"
    postgres_user: str = "tgjobs"
    postgres_password: str = "changeme"

    secret_key: str = "changeme"
    admin_username: str = "admin"
    admin_password: str = "changeme"
    internal_secret: str = "changeme"

    backend_url: str = "http://backend:8000"
    collector_url: str = "http://collector:8001"

    openrouter_api_key: str = ""
    llm_model: str = "openai/gpt-4o-mini"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
