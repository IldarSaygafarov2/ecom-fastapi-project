from pydantic import EmailStr

from app.models.enums import UserRole
from app.schemas.common import ORMModel


class UserCreate(ORMModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class UserRead(ORMModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    role: UserRole


class TokenPair(ORMModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(ORMModel):
    email: EmailStr
    password: str
