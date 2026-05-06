from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from .auth import require_admin
from .db import get_db
from .models import GameRound, Quest, Transaction, User
from .schemas import (
    AdminStats,
    AdminUserUpdate,
    GameRoundPublic,
    QuestPublic,
    QuestUpsert,
    TransactionPublic,
    UserPublic,
)
from .services import credit

router = APIRouter(
    prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)]
)


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)) -> AdminStats:
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    total_admins = (
        db.scalar(select(func.count()).select_from(User).where(User.role == "admin"))
        or 0
    )
    banned_users = (
        db.scalar(select(func.count()).select_from(User).where(User.banned == True))  # noqa: E712
        or 0
    )
    coins = db.scalar(select(func.coalesce(func.sum(User.balance), 0))) or 0
    total_rounds = db.scalar(select(func.count()).select_from(GameRound)) or 0
    total_bet = db.scalar(select(func.coalesce(func.sum(GameRound.bet), 0))) or 0
    total_payout = (
        db.scalar(select(func.coalesce(func.sum(GameRound.payout), 0))) or 0
    )
    active_quests = (
        db.scalar(select(func.count()).select_from(Quest).where(Quest.active == True))  # noqa: E712
        or 0
    )
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    new_users_24h = (
        db.scalar(
            select(func.count()).select_from(User).where(User.created_at >= cutoff)
        )
        or 0
    )
    return AdminStats(
        total_users=int(total_users),
        total_admins=int(total_admins),
        banned_users=int(banned_users),
        coins_in_circulation=int(coins),
        total_rounds=int(total_rounds),
        total_bet=int(total_bet),
        total_payout=int(total_payout),
        house_balance=int(total_bet) - int(total_payout),
        active_quests=int(active_quests),
        new_users_24h=int(new_users_24h),
    )


@router.get("/users", response_model=list[UserPublic])
def list_users(
    db: Session = Depends(get_db),
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[User]:
    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    stmt = select(User)
    if q:
        stmt = stmt.where(User.username.ilike(f"%{q}%"))
    stmt = stmt.order_by(desc(User.created_at)).offset(offset).limit(limit)
    return list(db.execute(stmt).scalars().all())


@router.get("/users/{user_id}", response_model=UserPublic)
def get_user(user_id: int, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    update: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notes: list[str] = []
    if update.set_balance is not None:
        if update.set_balance < 0:
            raise HTTPException(status_code=400, detail="Balance cannot be negative")
        delta = update.set_balance - user.balance
        if delta != 0:
            credit(
                db,
                user,
                delta,
                type_="admin_set",
                description=f"Admin {admin.username}: set balance {update.reason}".strip(),
            )
        notes.append(f"set balance to {update.set_balance}")
    elif update.balance_delta is not None and update.balance_delta != 0:
        credit(
            db,
            user,
            update.balance_delta,
            type_="admin_grant" if update.balance_delta > 0 else "admin_deduct",
            description=f"Admin {admin.username}: {update.reason}".strip(),
        )
        notes.append(f"balance {update.balance_delta:+d}")
    if update.role is not None and update.role != user.role:
        # Prevent admins from demoting themselves into a no-admin state by accident.
        if user.id == admin.id and update.role != "admin":
            raise HTTPException(
                status_code=400, detail="You cannot demote yourself"
            )
        user.role = update.role
        notes.append(f"role -> {update.role}")
    if update.banned is not None and update.banned != user.banned:
        if user.id == admin.id and update.banned:
            raise HTTPException(status_code=400, detail="You cannot ban yourself")
        user.banned = update.banned
        notes.append("banned" if update.banned else "unbanned")
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    db.delete(user)
    db.commit()
    return None


@router.get("/users/{user_id}/transactions", response_model=list[TransactionPublic])
def user_transactions(
    user_id: int, db: Session = Depends(get_db), limit: int = 100
) -> list[Transaction]:
    if not db.get(User, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    limit = max(1, min(limit, 500))
    return list(
        db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(desc(Transaction.created_at))
            .limit(limit)
        )
        .scalars()
        .all()
    )


@router.get("/transactions", response_model=list[TransactionPublic])
def all_transactions(
    db: Session = Depends(get_db), limit: int = 100, offset: int = 0
) -> list[Transaction]:
    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    return list(
        db.execute(
            select(Transaction)
            .order_by(desc(Transaction.created_at))
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )


@router.get("/rounds", response_model=list[GameRoundPublic])
def all_rounds(
    db: Session = Depends(get_db), limit: int = 100, offset: int = 0
) -> list[GameRound]:
    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    return list(
        db.execute(
            select(GameRound)
            .order_by(desc(GameRound.created_at))
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )


@router.get("/quests", response_model=list[QuestPublic])
def list_all_quests(db: Session = Depends(get_db)) -> list[Quest]:
    return list(
        db.execute(select(Quest).order_by(Quest.id.asc())).scalars().all()
    )


@router.post("/quests", response_model=QuestPublic, status_code=201)
def create_quest(data: QuestUpsert, db: Session = Depends(get_db)) -> Quest:
    if db.execute(select(Quest).where(Quest.code == data.code)).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Quest code already exists")
    quest = Quest(**data.model_dump())
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return quest


@router.put("/quests/{quest_id}", response_model=QuestPublic)
def update_quest(
    quest_id: int, data: QuestUpsert, db: Session = Depends(get_db)
) -> Quest:
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    other = db.execute(
        select(Quest).where(Quest.code == data.code, Quest.id != quest_id)
    ).scalar_one_or_none()
    if other:
        raise HTTPException(status_code=409, detail="Quest code already exists")
    for field, value in data.model_dump().items():
        setattr(quest, field, value)
    db.commit()
    db.refresh(quest)
    return quest


@router.delete("/quests/{quest_id}", status_code=204)
def delete_quest(quest_id: int, db: Session = Depends(get_db)):
    quest = db.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    db.delete(quest)
    db.commit()
    return None
