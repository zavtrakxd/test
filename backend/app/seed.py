"""Idempotent seed: ensure default admin and default quest set exist."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import hash_password
from .config import settings
from .models import Quest, User
from .services import credit


DEFAULT_QUESTS: list[dict] = [
    {
        "code": "rookie_player",
        "title": "Новичок",
        "description": "Сыграй 10 раундов в любой игре.",
        "type": "play_count",
        "target": 10,
        "reward": 200,
    },
    {
        "code": "first_winnings",
        "title": "Первые победы",
        "description": "Выиграй 5 раундов.",
        "type": "win_count",
        "target": 5,
        "reward": 300,
    },
    {
        "code": "high_roller",
        "title": "Крупная игра",
        "description": "Поставь в сумме 5 000 монет.",
        "type": "spend_amount",
        "target": 5000,
        "reward": 500,
    },
    {
        "code": "fortune_smile",
        "title": "Улыбка фортуны",
        "description": "Накопи 10 000 монет суммарного выигрыша.",
        "type": "earn_amount",
        "target": 10000,
        "reward": 1000,
    },
    {
        "code": "jackpot_chaser",
        "title": "Охотник за джекпотом",
        "description": "Выиграй за один раунд 2 500 монет.",
        "type": "biggest_win",
        "target": 2500,
        "reward": 1500,
    },
]


def ensure_admin(db: Session) -> None:
    admin = db.execute(
        select(User).where(User.username == settings.admin_username)
    ).scalar_one_or_none()
    if admin is None:
        admin = User(
            username=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
            role="admin",
            balance=0,
        )
        db.add(admin)
        db.flush()
        credit(
            db,
            admin,
            settings.signup_bonus,
            type_="signup_bonus",
            description="Welcome bonus (admin seed)",
        )
        db.commit()
        return
    # Always make sure the seeded account is an admin.
    if admin.role != "admin":
        admin.role = "admin"
        db.commit()


def ensure_quests(db: Session) -> None:
    for spec in DEFAULT_QUESTS:
        existing = db.execute(
            select(Quest).where(Quest.code == spec["code"])
        ).scalar_one_or_none()
        if existing:
            continue
        db.add(Quest(active=True, repeatable=False, **spec))
    db.commit()


def run_seed(db: Session) -> None:
    ensure_admin(db)
    if settings.seed_demo:
        ensure_quests(db)
