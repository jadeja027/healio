from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/healio.db — works without Docker; set DATABASE_URL for Postgres in .env
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_SQLITE_URL = "sqlite:///" + (_BACKEND_DIR / "healio.db").resolve().as_posix()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = _DEFAULT_SQLITE_URL
    anthropic_api_key: str = ""


settings = Settings()
