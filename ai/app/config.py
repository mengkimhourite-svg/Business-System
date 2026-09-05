"""Service configuration — secrets come ONLY from environment variables / .env (never from clients)."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "SBS AI Service"
    app_env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8001

    internal_api_key: str = ""  # X-Internal-Key expected from Laravel (empty = not enforced)

    ai_provider: str = "openai"
    ai_api_key: str = ""
    ai_base_url: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-4o-mini"
    ai_timeout_seconds: float = 20.0

    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173"

    @property
    def provider_enabled(self) -> bool:
        return bool(self.ai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
