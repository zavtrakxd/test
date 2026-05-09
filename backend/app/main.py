from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import Base, SessionLocal, engine
from .routes_admin import router as admin_router
from .routes_auth import router as auth_router
from .routes_games import router as games_router
from .routes_quests import router as quests_router
from .routes_user import router as user_router
from .seed import run_seed


def _migrate_add_columns() -> None:
    """Best-effort SQLite ALTER TABLE for newly added User columns.

    `Base.metadata.create_all` only creates missing tables; it doesn't add
    new columns. For our small play-money DB we just shim a simple migration
    that adds known columns when they don't exist yet.
    """
    from sqlalchemy import text

    expected: dict[str, list[tuple[str, str]]] = {
        "users": [
            ("free_spins_remaining", "INTEGER NOT NULL DEFAULT 0"),
            ("free_spin_bet", "INTEGER NOT NULL DEFAULT 0"),
        ],
    }
    with engine.connect() as conn:
        for table, cols in expected.items():
            try:
                rows = conn.execute(
                    text(f"PRAGMA table_info({table})")
                ).fetchall()
            except Exception:
                continue
            existing = {row[1] for row in rows}
            for name, ddl in cols:
                if name in existing:
                    continue
                try:
                    conn.execute(
                        text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")
                    )
                except Exception:
                    pass
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _migrate_add_columns()
    with SessionLocal() as db:
        run_seed(db)
    yield


app = FastAPI(
    title="Coin Casino API",
    version="0.1.0",
    description=(
        "Play-money casino backend. No real money involved — all coins are "
        "purely virtual and used as in-game currency."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api", tags=["meta"])
def root() -> dict:
    return {
        "name": "Coin Casino API",
        "ok": True,
        "docs": "/docs",
    }


@app.get("/api/health", tags=["meta"])
def health() -> dict:
    return {"ok": True}


@app.get("/api/config", tags=["meta"])
def public_config() -> dict:
    """Static configuration the frontend reads to render bet limits etc."""
    return {
        "min_bet": settings.min_bet,
        "max_bet": settings.max_bet,
        "signup_bonus": settings.signup_bonus,
        "daily_bonus": settings.daily_bonus,
        "daily_cooldown_hours": settings.daily_cooldown_hours,
    }


app.include_router(auth_router)
app.include_router(user_router)
app.include_router(games_router)
app.include_router(quests_router)
app.include_router(admin_router)


# ---- Static frontend ----------------------------------------------------
# When the frontend is colocated, serve it from the same origin so that we
# avoid CORS preflights (which can't pass HTTP Basic auth at the edge).
_static_dir = Path(
    os.environ.get("STATIC_DIR")
    or Path(__file__).resolve().parent.parent / "static"
)
if _static_dir.is_dir():
    # Mount everything under /assets/* for the SPA's static files.
    app.mount(
        "/assets",
        StaticFiles(directory=str(_static_dir)),
        name="assets",
    )

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str = "") -> FileResponse:
        # Serve index.html for any non-API path so the SPA router can take over.
        if full_path.startswith("api/") or full_path == "api":
            from fastapi import HTTPException

            raise HTTPException(status_code=404)
        candidate = _static_dir / full_path
        if full_path and candidate.is_file():
            # Long-cache versioned/hashed assets, but always re-validate raw
            # JS/CSS/HTML so the SPA picks up new code instantly.
            if candidate.suffix in {".js", ".css", ".html"}:
                return FileResponse(
                    candidate,
                    headers={"Cache-Control": "no-cache, must-revalidate"},
                )
            return FileResponse(candidate)
        return FileResponse(
            _static_dir / "index.html",
            headers={"Cache-Control": "no-cache, must-revalidate"},
        )
