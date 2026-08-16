"""
Application configuration using Pydantic Settings.
All settings can be overridden via environment variables.
"""
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Central configuration for Parallax Lite backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Parallax Lite"
    app_version: str = "0.3.0"
    debug: bool = False
    
    # Mode
    parallax_mode: Literal["network", "private", "local"] = "local"

    # Database
    database_url: str = "sqlite:///./parallax.db"

    # CORS
    frontend_origin: str = "http://localhost:3000"

    # Escrow
    min_payment_amount: float = 0.01
    max_payment_amount: float = 10_000.0
    
    # Derived Feature Flags
    @property
    def public_endpoints_enabled(self) -> bool:
        return self.parallax_mode in ["network", "local"]

    @property
    def rate_limits_enabled(self) -> bool:
        return self.parallax_mode == "network"

    @property
    def machine_onboarding_enabled(self) -> bool:
        return self.parallax_mode in ["network", "local"]

    @property
    def seed_enabled(self) -> bool:
        return self.parallax_mode in ["private", "local"]

    @property
    def simulate_enabled(self) -> bool:
        # network restricts simulate, but it's technically ON (just capped), private/local have it fully ON
        return True

settings = Settings()
