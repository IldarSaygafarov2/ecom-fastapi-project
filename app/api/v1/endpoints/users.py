from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.models.enums import UserRole
from app.schemas.auth import UserRead
from app.schemas.user import UserRoleUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get("/", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> list[UserRead]:
    users = await UserService(db).list_users()
    return [UserRead.model_validate(user) for user in users]


@router.patch("/{user_id}/role", response_model=UserRead)
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> UserRead:
    user = await UserService(db).update_role(user_id, payload.role)
    return UserRead.model_validate(user)
