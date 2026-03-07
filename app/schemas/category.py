from app.schemas.common import ORMModel


class CategoryBase(ORMModel):
    name: str
    description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(ORMModel):
    name: str | None = None
    description: str | None = None


class CategoryRead(CategoryBase):
    id: int
