# Coin Casino — play-money web casino

A complete play-money casino web app. **No real money** — every "coin" is in-game
currency awarded on signup, daily bonuses, quests, and game wins.

* Backend: FastAPI + SQLAlchemy + SQLite
* Frontend: vanilla HTML / CSS / JS SPA (no build step)
* Auth: JWT + bcrypt
* Admin panel for moderating users, quests, transactions, and rounds

## Default credentials

| Role  | Username | Password    |
|-------|----------|-------------|
| Admin | `admin`  | `admin12345` |
| Demo  | `demo`   | `demo12345`  |

The admin user is auto-created on first startup. Demo player is seeded only when
`SEED_DEMO=1` (default).

## Local run

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open http://localhost:8000 — the SPA is served from the same origin.

## Deploy

The repo ships with three production deploy paths — all free and persistent:

### Render.com (one-click Blueprint, easiest)

1. Push this repo to GitHub.
2. On https://dashboard.render.com → **New + → Blueprint** → connect this repo.
3. Render reads `render.yaml`, provisions a free Docker web service with a 1 GB
   persistent disk for the SQLite DB, and gives you a public URL.

### Fly.io (best free-tier persistence)

```bash
cd backend
fly launch --copy-config --no-deploy --name <your-app-name>
fly volumes create casino_data --size 1 --region fra
fly secrets set JWT_SECRET=$(python -c 'import secrets;print(secrets.token_urlsafe(48))') \
                ADMIN_PASSWORD=admin12345
fly deploy
```

### Hugging Face Spaces (free, Docker SDK)

1. Create a new Space (SDK = Docker).
2. Push this repo. The top-level `Dockerfile` is auto-detected.
3. Optional: enable persistent storage so the SQLite DB survives restarts.

## Environment variables

| Var                    | Default                      | Notes                          |
|------------------------|------------------------------|--------------------------------|
| `DATABASE_URL`         | `sqlite:///./casino.db`      | Use `/data/casino.db` in prod  |
| `JWT_SECRET`           | random per process           | Set in prod for stable tokens  |
| `JWT_EXPIRES_MINUTES`  | `60`                         |                                |
| `SIGNUP_BONUS`         | `1000`                       |                                |
| `DAILY_BONUS`          | `250`                        |                                |
| `MIN_BET` / `MAX_BET`  | `10` / `10000`               |                                |
| `ADMIN_USERNAME`       | `admin`                      |                                |
| `ADMIN_PASSWORD`       | `admin12345`                 | **Change in prod!**            |
| `CORS_ORIGINS`         | `*`                          | comma-separated                |
