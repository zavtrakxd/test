from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from .config import settings
from .db import get_db
from .models import User
from .schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from .services import credit

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.execute(
        select(User).where(User.username == data.username)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Username is already taken")
    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        role="user",
        balance=0,
    )
    db.add(user)
    db.flush()  # populate user.id
    credit(
        db,
        user,
        settings.signup_bonus,
        type_="signup_bonus",
        description="Welcome bonus",
    )
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user))


@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> TokenResponse:
    """OAuth2 password flow — used by the frontend and Swagger UI alike."""
    user = db.execute(
        select(User).where(User.username == form.username)
    ).scalar_one_or_none()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if user.banned:
        raise HTTPException(status_code=403, detail="Account is banned")
    return TokenResponse(access_token=create_access_token(user))


@router.post("/login-json", response_model=TokenResponse)
def login_json(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """JSON variant of login for clients that don't use form-encoded bodies."""
    user = db.execute(
        select(User).where(User.username == data.username)
    ).scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if user.banned:
        raise HTTPException(status_code=403, detail="Account is banned")
    return TokenResponse(access_token=create_access_token(user))


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)) -> User:
    return user
