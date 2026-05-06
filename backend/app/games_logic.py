"""Server-side game RNG and payout logic.

All randomness is generated on the server. Each game returns a tuple of
(payout, won, details_dict). `bet` is debited before the call; `payout` is
credited (0 means full loss).
"""

from __future__ import annotations

import secrets
from typing import Literal

# Slot machine reels: 6 symbols with weighted probabilities.
# Symbol payout multipliers when ALL 3 reels match.
SLOT_SYMBOLS: list[tuple[str, int]] = [
    ("🍒", 5),    # weight 5
    ("🍋", 5),
    ("🍇", 4),
    ("🔔", 3),
    ("⭐", 2),
    ("7️⃣", 1),
]
# Multiplier when all 3 match.
TRIPLE_MULTIPLIERS: dict[str, float] = {
    "🍒": 4,
    "🍋": 5,
    "🍇": 7,
    "🔔": 10,
    "⭐": 15,
    "7️⃣": 50,
}
# Multiplier when any 2 match.
DOUBLE_MULTIPLIER = 1.5


def _spin_reel() -> str:
    pool: list[str] = []
    for sym, weight in SLOT_SYMBOLS:
        pool.extend([sym] * weight)
    return pool[secrets.randbelow(len(pool))]


def play_slots(bet: int) -> tuple[int, bool, dict]:
    reels = [_spin_reel(), _spin_reel(), _spin_reel()]
    if reels[0] == reels[1] == reels[2]:
        mult = TRIPLE_MULTIPLIERS[reels[0]]
        payout = int(bet * mult)
        return payout, True, {"reels": reels, "match": "triple", "multiplier": mult}
    pairs = {sym for sym in reels if reels.count(sym) >= 2}
    if pairs:
        payout = int(bet * DOUBLE_MULTIPLIER)
        return payout, True, {
            "reels": reels,
            "match": "double",
            "multiplier": DOUBLE_MULTIPLIER,
        }
    return 0, False, {"reels": reels, "match": "none", "multiplier": 0}


def play_coinflip(bet: int, side: Literal["heads", "tails"]) -> tuple[int, bool, dict]:
    landed = "heads" if secrets.randbelow(2) == 0 else "tails"
    if side == landed:
        payout = int(bet * 1.95)  # 2.5% house edge
        return payout, True, {
            "side": side,
            "landed": landed,
            "multiplier": 1.95,
        }
    return 0, False, {"side": side, "landed": landed, "multiplier": 0}


def play_dice(bet: int, number: int) -> tuple[int, bool, dict]:
    if not 1 <= number <= 6:
        raise ValueError("number must be 1-6")
    rolled = secrets.randbelow(6) + 1
    if number == rolled:
        payout = int(bet * 5.5)  # ~8% house edge
        return payout, True, {
            "pick": number,
            "rolled": rolled,
            "multiplier": 5.5,
        }
    return 0, False, {"pick": number, "rolled": rolled, "multiplier": 0}
