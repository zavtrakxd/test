from __future__ import annotations

import os
import secrets


def _bool(env: str | None, default: bool) -> bool:
    if env is None:
        return default
    return env.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    """Runtime configuration. Reads from environment variables."""

    def __init__(self) -> None:
        self.database_url: str = os.environ.get(
            "DATABASE_URL", "sqlite:///./casino.db"
        )
        self.jwt_secret: str = os.environ.get("JWT_SECRET", "")
        if not self.jwt_secret:
            # Generate an ephemeral secret for local/dev runs.
            # On Fly.io we set JWT_SECRET via fly secrets so tokens survive restarts.
            self.jwt_secret = secrets.token_urlsafe(48)
        self.jwt_algorithm: str = os.environ.get("JWT_ALGORITHM", "HS256")
        self.jwt_expires_minutes: int = int(
            os.environ.get("JWT_EXPIRES_MINUTES", "60")
        )

        self.signup_bonus: int = int(os.environ.get("SIGNUP_BONUS", "1000"))
        self.daily_bonus: int = int(os.environ.get("DAILY_BONUS", "250"))
        self.daily_cooldown_hours: int = int(
            os.environ.get("DAILY_COOLDOWN_HOURS", "24")
        )
        self.min_bet: int = int(os.environ.get("MIN_BET", "10"))
        self.max_bet: int = int(os.environ.get("MAX_BET", "10000"))

        self.admin_username: str = os.environ.get("ADMIN_USERNAME", "admin")
        self.admin_password: str = os.environ.get("ADMIN_PASSWORD", "admin12345")
        self.cors_origins: list[str] = [
            o.strip()
            for o in os.environ.get("CORS_ORIGINS", "*").split(",")
            if o.strip()
        ]
        self.seed_demo: bool = _bool(os.environ.get("SEED_DEMO"), default=True)


settings = Settings()
