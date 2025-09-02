from __future__ import annotations
from functools import lru_cache
from pydantic import AnyHttpUrl, validator, AnyUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Required (no defaults): must be provided via environment
    SUPABASE_URL: AnyHttpUrl
    SUPABASE_ANON_KEY: str
    NOSTR_RELAY_URL: AnyUrl

    # Optional (still from env if present)
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    BLOSSOM_ENDPOINT: AnyHttpUrl | None = None

    # Non-sensitive defaults
    LOG_LEVEL: str = "INFO"
    HTTP_CONNECT_TIMEOUT: float = 1.0
    HTTP_READ_TIMEOUT: float = 2.0
    HTTP_RETRY_MAX: int = 2
    MAX_EVENT_BYTES: int = 65536
    RATE_LIMIT_MAX: int | None = None
    MEDIA_ALLOWED_MIME: str | None = None

    @validator("LOG_LEVEL")
    def _upper(cls, v: str) -> str:  # noqa: D401
        return v.upper()

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Cached settings loader; fails fast if required env vars missing."""
    return Settings()
