from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.order import OrderRead, OrderStatusUpdate
from app.services.order_service import OrderService, serialize_order

router = APIRouter()


@router.post("/", response_model=OrderRead)
async def create_order(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderRead:
    order = await OrderService(db).create_from_cart(current_user.id, background_tasks)
    return serialize_order(order)


@router.get("/", response_model=list[OrderRead])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrderRead]:
    user_id = None if current_user.role == UserRole.admin else current_user.id
    items = await OrderService(db).list_orders(user_id)
    return [serialize_order(item) for item in items]


@router.patch("/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> OrderRead:
    item = await OrderService(db).update_status(order_id, payload.status)
    return serialize_order(item)
