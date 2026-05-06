from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .auth import get_current_user
from .config import settings
from .db import get_db
from .games_logic import play_coinflip, play_dice, play_slots
from .models import GameRound, User
from .schemas import BetRequest, CoinflipBet, DiceBet, GameResult
from .services import credit, update_quest_progress

router = APIRouter(prefix="/api/games", tags=["games"])


def _validate_bet(user: User, bet: int) -> None:
    if bet < settings.min_bet:
        raise HTTPException(
            status_code=400, detail=f"Minimum bet is {settings.min_bet}"
        )
    if bet > settings.max_bet:
        raise HTTPException(
            status_code=400, detail=f"Maximum bet is {settings.max_bet}"
        )
    if bet > user.balance:
        raise HTTPException(status_code=400, detail="Insufficient balance")


def _record_round(
    db: Session,
    user: User,
    game: str,
    bet: int,
    payout: int,
    won: bool,
    details: dict,
) -> GameResult:
    # Debit the bet first.
    credit(db, user, -bet, type_=f"{game}_bet", description=f"{game} bet")
    user.total_bet += bet
    user.total_games_played += 1
    if won:
        credit(db, user, payout, type_=f"{game}_win", description=f"{game} win")
        user.total_won += payout
        user.total_games_won += 1
        if payout > user.biggest_win:
            user.biggest_win = payout
    db.add(
        GameRound(
            user_id=user.id,
            game=game,
            bet=bet,
            payout=payout,
            won=won,
            details=json.dumps(details),
        )
    )
    update_quest_progress(db, user)
    db.commit()
    db.refresh(user)
    return GameResult(
        game=game,
        bet=bet,
        payout=payout,
        won=won,
        new_balance=user.balance,
        details=details,
    )


@router.post("/slots", response_model=GameResult)
def slots(
    body: BetRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GameResult:
    _validate_bet(user, body.bet)
    payout, won, details = play_slots(body.bet)
    return _record_round(db, user, "slots", body.bet, payout, won, details)


@router.post("/coinflip", response_model=GameResult)
def coinflip(
    body: CoinflipBet,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GameResult:
    _validate_bet(user, body.bet)
    payout, won, details = play_coinflip(body.bet, body.side)
    return _record_round(db, user, "coinflip", body.bet, payout, won, details)


@router.post("/dice", response_model=GameResult)
def dice(
    body: DiceBet,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GameResult:
    _validate_bet(user, body.bet)
    payout, won, details = play_dice(body.bet, body.number)
    return _record_round(db, user, "dice", body.bet, payout, won, details)
