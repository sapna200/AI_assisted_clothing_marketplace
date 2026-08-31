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
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        # Support wildcard for Vercel preview deployments (*.vercel.app)
        # This is checked at request time in main.py via is_origin_allowed
        return origins

    def is_origin_allowed(self, origin: str) -> bool:
        """Check if an origin is allowed, supporting wildcard patterns."""
        if not origin:
            return False
        for pattern in self.allowed_origins:
            if pattern == origin:
                return True
            # Wildcard subdomain match: *.vercel.app matches any.vercel.app
            if pattern.startswith("*."):
                wildcard_base = pattern[1:]  # e.g. ".vercel.app"
                if origin.endswith(wildcard_base):
                    # Ensure the part before the wildcard is a single subdomain label
                    prefix = origin[: -len(wildcard_base)]
                    if prefix and "." not in prefix and "/" not in prefix:
                        return True
        return False


settings = Settings()