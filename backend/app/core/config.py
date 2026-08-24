from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str
    supabase_url: str = ""
    supabase_service_key: str = ""
    # Comma-separated list of allowed browser origins (CORS). Update via env
    # var when deploying — no code change needed, e.g. on Render:
    #   ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()