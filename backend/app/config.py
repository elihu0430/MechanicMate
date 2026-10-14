import ast
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_backend_dir / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "MechanicMate API"
    API_V1_STR: str = "/api/v1"
    
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://mechanicmate.vercel.app"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    return [str(item).strip().rstrip("/") for item in ast.literal_eval(v)]
                except Exception:
                    pass
            return [origin.strip().rstrip("/") for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return [str(item).strip().rstrip("/") for item in v]
        return ["*"]


    # Neon PostgreSQL connection string (asyncpg)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/mechanicmate"

    # Clerk Auth settings
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_JWKS_URL: str = ""

    # Trigger.dev Background Orchestration
    TRIGGER_SECRET_KEY: str = ""
    TRIGGER_API_URL: str = "https://api.trigger.dev"

settings = Settings()
