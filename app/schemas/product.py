from decimal import Decimal

from app.schemas.common import ORMModel


class ProductBase(ORMModel):
    name: str
    description: str | None = None
    image_url: str | None = None
    price: Decimal
    stock: int
    category_id: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ORMModel):
    name: str | None = None
    description: str | None = None
    image_url: str | None = None
    price: Decimal | None = None
    stock: int | None = None
    category_id: int | None = None


class ProductRead(ProductBase):
    id: int
    slug: str
