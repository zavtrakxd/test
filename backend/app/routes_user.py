from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from .auth import get_current_user
from .config import settings
from .db import get_db
from .models import GameRound, Transaction, User
from .schemas import (
    DailyBonusResponse,
    GameRoundPublic,
    LeaderboardEntry,
    TransactionPublic,
    UserPublic,
)
from .services import credit

router = APIRouter(prefix="/api", tags=["user"])


@router.get("/me", response_model=UserPublic)
def get_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.get("/me/transactions", response_model=list[TransactionPublic])
def my_transactions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 30,
) -> list[Transaction]:
    limit = max(1, min(limit, 200))
    return list(
        db.execute(
            select(Transaction)
            .where(Transaction.user_id == user.id)
            .order_by(desc(Transaction.created_at))
            .limit(limit)
        )
        .scalars()
        .all()
    )


@router.get("/me/rounds", response_model=list[GameRoundPublic])
def my_rounds(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 30,
) -> list[GameRound]:
    limit = max(1, min(limit, 200))
    return list(
        db.execute(
            select(GameRound)
            .where(GameRound.user_id == user.id)
            .order_by(desc(GameRound.created_at))
            .limit(limit)
        )
        .scalars()
        .all()
    )


@router.post("/daily-bonus", response_model=DailyBonusResponse)
def claim_daily_bonus(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> DailyBonusResponse:
    now = datetime.now(timezone.utc)
    cooldown = timedelta(hours=settings.daily_cooldown_hours)
    last = user.last_daily_bonus
    if last is not None:
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        if now - last < cooldown:
            next_at = last + cooldown
            return DailyBonusResponse(
                granted=False,
                amount=0,
                new_balance=user.balance,
                next_available_at=next_at,
                message="Daily bonus already claimed",
            )
    credit(
        db,
        user,
        settings.daily_bonus,
        type_="daily_bonus",
        description="Daily login bonus",
    )
    user.last_daily_bonus = now
    db.commit()
    db.refresh(user)
    return DailyBonusResponse(
        granted=True,
        amount=settings.daily_bonus,
        new_balance=user.balance,
        next_available_at=now + cooldown,
        message="Daily bonus granted",
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(db: Session = Depends(get_db), limit: int = 10) -> list[LeaderboardEntry]:
    limit = max(1, min(limit, 50))
    rows = (
        db.execute(
            select(User)
            .where(User.banned == False)  # noqa: E712
            .order_by(desc(User.balance), desc(User.total_won))
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return [
        LeaderboardEntry(
            rank=i + 1,
            username=u.username,
            balance=u.balance,
            total_won=u.total_won,
            biggest_win=u.biggest_win,
        )
        for i, u in enumerate(rows)
    ]
