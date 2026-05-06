"""Domain services: balance changes, transactions, quest progress."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Quest, Transaction, User, UserQuest


QUEST_PROGRESS_FIELDS = {
    "play_count": "total_games_played",
    "win_count": "total_games_won",
    "earn_amount": "total_won",
    "spend_amount": "total_bet",
    "biggest_win": "biggest_win",
}


def credit(
    db: Session,
    user: User,
    amount: int,
    type_: str,
    description: str = "",
) -> Transaction:
    """Apply a balance change (positive credit or negative debit) and log it."""
    if amount == 0:
        # Still log zero-value events (e.g. a losing spin's bet handled separately).
        pass
    user.balance += amount
    if user.balance < 0:
        user.balance = 0
    tx = Transaction(
        user_id=user.id,
        amount=amount,
        type=type_,
        description=description[:255],
        balance_after=user.balance,
    )
    db.add(tx)
    return tx


def update_quest_progress(db: Session, user: User) -> list[UserQuest]:
    """Refresh progress for all active quests based on the user's lifetime stats.

    Returns the list of quest rows that just became completed (newly).
    """
    quests = db.execute(select(Quest).where(Quest.active == True)).scalars().all()  # noqa: E712
    newly_completed: list[UserQuest] = []
    for quest in quests:
        field = QUEST_PROGRESS_FIELDS.get(quest.type)
        if not field:
            continue
        progress_value = int(getattr(user, field, 0))
        uq = (
            db.execute(
                select(UserQuest).where(
                    UserQuest.user_id == user.id, UserQuest.quest_id == quest.id
                )
            )
            .scalars()
            .first()
        )
        if not uq:
            uq = UserQuest(user_id=user.id, quest_id=quest.id, progress=0)
            db.add(uq)
        was_completed = uq.completed
        capped = min(progress_value, quest.target)
        uq.progress = capped
        if capped >= quest.target:
            uq.completed = True
            if not was_completed:
                newly_completed.append(uq)
    return newly_completed
