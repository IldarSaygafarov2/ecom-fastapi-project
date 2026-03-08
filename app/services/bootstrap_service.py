from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository


class BootstrapService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def ensure_admin_user(self) -> None:
        admin = await self.user_repo.get_by_email(settings.ADMIN_EMAIL)
        if admin is None:
            user = User(
                email=settings.ADMIN_EMAIL,
                full_name=settings.ADMIN_FULL_NAME,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.admin,
            )
            await self.user_repo.create(user)
            return

        if admin.role != UserRole.admin:
            admin.role = UserRole.admin
            await self.session.commit()
