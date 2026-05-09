"""Server-side game RNG and payout logic.

All randomness is generated on the server. Each game returns a tuple of
(payout, won, details_dict). `bet` is debited before the call; `payout` is
credited (0 means full loss).
"""

from __future__ import annotations

import secrets
from typing import Literal


# ---------------------------------------------------------------------------
# Slots — 5 reels × 3 rows, 5 paylines, wilds, scatters, free spins.
# ---------------------------------------------------------------------------

SLOT_REELS = 5
SLOT_ROWS = 3

WILD = "⭐"
SCATTER = "💰"

# (symbol, weight) — weights determine how often a symbol shows up.
# Wilds and scatters are intentionally rare so the game has a punchy RTP.
SLOT_SYMBOL_WEIGHTS: list[tuple[str, int]] = [
    ("🍒", 30),
    ("🍋", 24),
    ("🍊", 18),
    ("🔔", 12),
    ("💎", 6),
    ("7️⃣", 2),
    (WILD, 5),
    (SCATTER, 3),
]

# Multipliers applied per line bet (= bet / 5) for matching N consecutive
# symbols starting from the leftmost reel. Tuned for ~95% RTP including
# scatter pays and free-spin contributions.
SLOT_PAYTABLE: dict[str, dict[int, float]] = {
    "🍒":   {3: 2.0,   4: 7.0,    5: 35.0},
    "🍋":   {3: 2.5,   4: 10.0,   5: 50.0},
    "🍊":   {3: 3.5,   4: 16.0,   5: 80.0},
    "🔔":   {3: 7.0,   4: 35.0,   5: 220.0},
    "💎":   {3: 22.0,  4: 110.0,  5: 550.0},
    "7️⃣":   {3: 75.0,  4: 380.0,  5: 2500.0},
    WILD:   {3: 28.0,  4: 140.0,  5: 1100.0},
}

# Scatter pays based on TOTAL bet, regardless of position. 3+ scatters trigger
# free spins on top of an instant payout.
SCATTER_PAYS: dict[int, dict[str, float]] = {
    3: {"mult": 5.0,   "free_spins": 5},
    4: {"mult": 20.0,  "free_spins": 10},
    5: {"mult": 100.0, "free_spins": 20},
}

SLOT_PAYLINES: list[list[int]] = [
    [1, 1, 1, 1, 1],  # 1: middle
    [0, 0, 0, 0, 0],  # 2: top
    [2, 2, 2, 2, 2],  # 3: bottom
    [0, 1, 2, 1, 0],  # 4: V
    [2, 1, 0, 1, 2],  # 5: ^
]
LINE_NAMES = ["Middle", "Top", "Bottom", "V", "^"]

FREE_SPIN_MULTIPLIER = 2.0


def _spin_one_symbol() -> str:
    pool: list[str] = []
    for sym, w in SLOT_SYMBOL_WEIGHTS:
        pool.extend([sym] * w)
    return pool[secrets.randbelow(len(pool))]


def _spin_grid() -> list[list[str]]:
    """Grid indexed as grid[reel][row]; 5 reels × 3 rows."""
    return [
        [_spin_one_symbol() for _ in range(SLOT_ROWS)]
        for _ in range(SLOT_REELS)
    ]


def _evaluate_payline(
    grid: list[list[str]], payline_rows: list[int]
) -> dict | None:
    symbols = [grid[r][payline_rows[r]] for r in range(SLOT_REELS)]
    first = symbols[0]
    if first == SCATTER:
        return None

    # If the leftmost is wild, the line "intends" the first non-wild symbol.
    intended = first
    if first == WILD:
        for s in symbols:
            if s not in (WILD, SCATTER):
                intended = s
                break
        # If the whole line is wilds, intended stays WILD (uses wild paytable).

    count = 0
    for s in symbols:
        if s == SCATTER:
            break
        if s == intended or s == WILD:
            count += 1
        else:
            break

    if count < 3:
        return None

    paytable = SLOT_PAYTABLE.get(intended) or SLOT_PAYTABLE[WILD]
    mult = paytable.get(count, 0.0)
    if mult <= 0:
        return None
    return {
        "symbol": intended,
        "count": count,
        "multiplier": mult,
        "reels": list(range(count)),
    }


def play_slots(
    bet: int,
    *,
    free_spin: bool = False,
) -> tuple[int, bool, dict]:
    """Spin a 5×3 slot grid and evaluate paylines + scatter."""
    grid = _spin_grid()
    line_bet = bet / SLOT_REELS  # 5 paylines = 5 reels here
    win_mult = FREE_SPIN_MULTIPLIER if free_spin else 1.0

    scatter_positions: list[tuple[int, int]] = [
        (r, row)
        for r in range(SLOT_REELS)
        for row in range(SLOT_ROWS)
        if grid[r][row] == SCATTER
    ]
    scatter_count = len(scatter_positions)

    line_wins: list[dict] = []
    line_payout = 0
    for i, payline in enumerate(SLOT_PAYLINES):
        result = _evaluate_payline(grid, payline)
        if result is None:
            continue
        win_int = int(line_bet * result["multiplier"] * win_mult)
        line_wins.append({
            "line_index": i,
            "line_name": LINE_NAMES[i],
            "rows": payline,
            "symbol": result["symbol"],
            "count": result["count"],
            "multiplier": result["multiplier"],
            "payout": win_int,
        })
        line_payout += win_int

    scatter_info: dict | None = None
    scatter_payout = 0
    free_spins_awarded = 0
    if scatter_count >= 3:
        cfg = SCATTER_PAYS[min(scatter_count, 5)]
        scatter_payout = int(bet * cfg["mult"] * win_mult)
        free_spins_awarded = int(cfg["free_spins"])
        scatter_info = {
            "count": scatter_count,
            "positions": scatter_positions,
            "multiplier": cfg["mult"],
            "payout": scatter_payout,
            "free_spins_awarded": free_spins_awarded,
        }

    total_payout = line_payout + scatter_payout
    won = total_payout > 0
    return total_payout, won, {
        "grid": grid,
        "rows": SLOT_ROWS,
        "reels": SLOT_REELS,
        "lines": line_wins,
        "paylines": SLOT_PAYLINES,
        "line_names": LINE_NAMES,
        "scatter": scatter_info,
        "scatter_count": scatter_count,
        "line_payout": line_payout,
        "scatter_payout": scatter_payout,
        "free_spin": free_spin,
        "free_spin_multiplier": FREE_SPIN_MULTIPLIER if free_spin else 1.0,
        "free_spins_awarded": free_spins_awarded,
    }


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
