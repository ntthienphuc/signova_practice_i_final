from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    database_url: str = Field(default="sqlite:///./signova.db")
    jwt_secret_key: str = Field(default="supersecretkeyforjwttokengenerate321")
    jwt_refresh_secret_key: str = Field(default="supersecretkeyforjwttokengeneraterefresh123")
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
