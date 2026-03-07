from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenPair, UserCreate, UserRead
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserRead)
@settings.rate_limiter.limit("20/minute")
async def register(
    request: Request, payload: UserCreate, db: AsyncSession = Depends(get_db)
) -> UserRead:
    _ = request
    user = await AuthService(db).register(payload)
    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenPair)
@settings.rate_limiter.limit("15/minute")
async def login(
    request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)
) -> TokenPair:
    _ = request
    return await AuthService(db).login(payload.email, payload.password)


@router.post("/token", response_model=TokenPair, summary="OAuth2 token endpoint")
@settings.rate_limiter.limit("15/minute")
async def token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    _ = request
    # OAuth2PasswordRequestForm sends username/password; we use email as username.
    return await AuthService(db).login(form_data.username, form_data.password)


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
