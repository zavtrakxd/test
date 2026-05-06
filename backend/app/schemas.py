from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=24, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=6, max_length=72)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    balance: int
    banned: bool
    last_daily_bonus: datetime | None
    total_games_played: int
    total_games_won: int
    total_bet: int
    total_won: int
    biggest_win: int
    created_at: datetime


class TransactionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: int
    type: str
    description: str
    balance_after: int
    created_at: datetime


class GameRoundPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    game: str
    bet: int
    payout: int
    won: bool
    details: str
    created_at: datetime


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    balance: int
    total_won: int
    biggest_win: int


class BetRequest(BaseModel):
    bet: int = Field(ge=1)


class CoinflipBet(BetRequest):
    side: Literal["heads", "tails"]


class DiceBet(BetRequest):
    number: int = Field(ge=1, le=6)


class GameResult(BaseModel):
    game: str
    bet: int
    payout: int
    won: bool
    new_balance: int
    details: dict


class QuestPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    title: str
    description: str
    type: str
    target: int
    reward: int
    active: bool
    repeatable: bool


class UserQuestPublic(BaseModel):
    quest: QuestPublic
    progress: int
    completed: bool
    claimed: bool


class DailyBonusResponse(BaseModel):
    granted: bool
    amount: int
    new_balance: int
    next_available_at: datetime
    message: str


class AdminStats(BaseModel):
    total_users: int
    total_admins: int
    banned_users: int
    coins_in_circulation: int
    total_rounds: int
    total_bet: int
    total_payout: int
    house_balance: int
    active_quests: int
    new_users_24h: int


class AdminUserUpdate(BaseModel):
    balance_delta: int | None = None
    set_balance: int | None = None
    role: Literal["user", "admin"] | None = None
    banned: bool | None = None
    reason: str = ""


class QuestUpsert(BaseModel):
    code: str = Field(min_length=2, max_length=48, pattern=r"^[a-z0-9_]+$")
    title: str = Field(min_length=1, max_length=80)
    description: str = ""
    type: Literal[
        "play_count", "win_count", "earn_amount", "spend_amount", "biggest_win"
    ]
    target: int = Field(ge=1)
    reward: int = Field(ge=0)
    repeatable: bool = False
    active: bool = True
