from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import get_current_user
from .db import get_db
from .models import Quest, User, UserQuest
from .schemas import QuestPublic, UserQuestPublic
from .services import credit, update_quest_progress

router = APIRouter(prefix="/api/quests", tags=["quests"])


@router.get("", response_model=list[UserQuestPublic])
def list_my_quests(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[UserQuestPublic]:
    update_quest_progress(db, user)
    db.commit()

    quests = (
        db.execute(select(Quest).where(Quest.active == True))  # noqa: E712
        .scalars()
        .all()
    )
    user_quests = {
        uq.quest_id: uq
        for uq in db.execute(
            select(UserQuest).where(UserQuest.user_id == user.id)
        )
        .scalars()
        .all()
    }
    out: list[UserQuestPublic] = []
    for q in quests:
        uq = user_quests.get(q.id)
        out.append(
            UserQuestPublic(
                quest=QuestPublic.model_validate(q),
                progress=uq.progress if uq else 0,
                completed=bool(uq.completed) if uq else False,
                claimed=bool(uq.claimed) if uq else False,
            )
        )
    return out


@router.post("/{quest_id}/claim", response_model=UserQuestPublic)
def claim_quest(
    quest_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserQuestPublic:
    quest = db.get(Quest, quest_id)
    if not quest or not quest.active:
        raise HTTPException(status_code=404, detail="Quest not found")
    update_quest_progress(db, user)
    uq = (
        db.execute(
            select(UserQuest).where(
                UserQuest.user_id == user.id, UserQuest.quest_id == quest.id
            )
        )
        .scalars()
        .first()
    )
    if not uq or not uq.completed:
        raise HTTPException(status_code=400, detail="Quest not yet completed")
    if uq.claimed and not quest.repeatable:
        raise HTTPException(status_code=400, detail="Reward already claimed")
    credit(
        db,
        user,
        quest.reward,
        type_="quest_reward",
        description=f"Quest: {quest.title}",
    )
    uq.claimed = True
    db.commit()
    db.refresh(user)
    db.refresh(uq)
    return UserQuestPublic(
        quest=QuestPublic.model_validate(quest),
        progress=uq.progress,
        completed=uq.completed,
        claimed=uq.claimed,
    )
