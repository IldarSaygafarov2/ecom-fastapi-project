from decimal import Decimal

from app.models.enums import OrderStatus
from app.schemas.common import ORMModel


class OrderItemRead(ORMModel):
    product_id: int
    quantity: int
    price: Decimal


class OrderRead(ORMModel):
    id: int
    user_id: int
    status: OrderStatus
    total_amount: Decimal
    items: list[OrderItemRead]


class OrderStatusUpdate(ORMModel):
    status: OrderStatus
