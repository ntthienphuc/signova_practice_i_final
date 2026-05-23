from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    database_url: str = Field(default="postgresql://neondb_owner:npg_ZU0F2aQufwjN@ep-red-dream-ad3huiiw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")
    jwt_secret_key: str = Field(default="supersecretkeyforjwttokengenerate321")
    jwt_refresh_secret_key: str = Field(default="supersecretkeyforjwttokengeneraterefresh123")
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
