# backend/config/settings.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    MONGODB_URI: str
    OPENROUTER_API_KEY: str
    OPENAI_API_KEY: str
    CLERK_PEM_PUBLIC_KEY: str

    @field_validator('CLERK_PEM_PUBLIC_KEY', mode='before')
    @classmethod
    def parse_public_key(cls, v):
        """Handle multi-line public key from .env file"""
        if isinstance(v, str):
            # Replace literal \n with actual newlines if needed
            v = v.replace('\\n', '\n')
        # If validation fails, try reading directly from environment
        if not v or not isinstance(v, str):
            env_key = os.getenv('CLERK_PEM_PUBLIC_KEY', '')
            if env_key:
                return env_key.replace('\\n', '\n')
        return v

settings = Settings()