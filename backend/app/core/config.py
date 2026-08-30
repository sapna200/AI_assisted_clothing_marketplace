from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str
    supabase_url: str = ""
    supabase_service_key: str = ""
    # Comma-separated list of allowed browser origins (CORS). Read from the
    # ALLOWED_ORIGINS env var (or the field name) so it can be updated on
    # Render without a code change, e.g.:
    #   ALLOWED_ORIGINS=https://app.vercel.app,http://localhost:3000
    cors_origins: str = Field(
        default="http://localhost:3000",
        validation_alias=AliasChoices("ALLOWED_ORIGINS", "cors_origins"),
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        populate_by_name=True,
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()