import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    customer = "customer"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    shipped = "shipped"
    cancelled = "cancelled"
