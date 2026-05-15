from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/healio.db — works without Docker; set DATABASE_URL for Postgres in .env
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_SQLITE_URL = "sqlite:///" + (_BACKEND_DIR / "healio.db").resolve().as_posix()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_BACKEND_DIR / ".env", extra="ignore")

    database_url: str = _DEFAULT_SQLITE_URL
    # Google AI Studio / Gemini (https://aistudio.google.com/apikey)
    gemini_api_key: str = ""
    google_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    def effective_gemini_key(self) -> str:
        return (self.gemini_api_key or self.google_api_key).strip()


settings = Settings()
