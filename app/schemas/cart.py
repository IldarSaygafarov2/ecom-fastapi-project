from decimal import Decimal

from app.schemas.common import ORMModel


class CartItemUpsert(ORMModel):
    product_id: int
    quantity: int


class CartItemRead(ORMModel):
    id: int
    product_id: int
    quantity: int
    price: Decimal
    line_total: Decimal


class CartRead(ORMModel):
    id: int
    user_id: int
    items: list[CartItemRead]
    total_amount: Decimal
