from app.models.enums import UserRole
from app.schemas.common import ORMModel


class UserRoleUpdate(ORMModel):
    role: UserRole
