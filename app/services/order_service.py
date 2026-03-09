import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.repositories.cart_repository import CartRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.order import OrderItemRead, OrderRead
from app.tasks.worker_tasks import (
    generate_order_summary_task,
    notify_admin_new_order_task,
    send_order_email_task,
)

logger = logging.getLogger(__name__)


def write_order_audit_event(order_id: int, user_id: int, total_amount: float) -> None:
    payload = {
        "event": "order_created",
        "order_id": order_id,
        "user_id": user_id,
        "total_amount": total_amount,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        target = Path(settings.ORDER_AUDIT_LOG_PATH)
        if target.parent != Path("."):
            target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("a", encoding="utf-8") as handle:
            handle.write(f"{json.dumps(payload, ensure_ascii=True)}\n")
    except OSError:
        logger.warning("Failed to write order audit event", exc_info=True)


def _dispatch_celery_task_with_fallback(
    background_tasks: BackgroundTasks, task: Any, *args: object
) -> None:
    try:
        task.delay(*args)
    except Exception:
        # Fallback to in-process execution when the broker is unavailable.
        background_tasks.add_task(task, *args)


class OrderService:
    def __init__(self, session: AsyncSession):
        self.order_repo = OrderRepository(session)
        self.cart_repo = CartRepository(session)
        self.product_repo = ProductRepository(session)

    async def create_from_cart(
        self, user_id: int, background_tasks: BackgroundTasks
    ) -> Order:
        cart = await self.cart_repo.get_or_create_for_user(user_id)
        if not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty"
            )

        total = 0
        order_items: list[OrderItem] = []
        for item in cart.items:
            product = await self.product_repo.get(item.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {item.product_id} not found",
                )
            # Stock was already decreased when adding to cart
            line_price = product.price
            total += line_price * item.quantity
            order_items.append(
                OrderItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    price=line_price,
                )
            )

        order = Order(
            user_id=user_id,
            total_amount=total,
            items=order_items,
            status=OrderStatus.pending,
        )
        created = await self.order_repo.create(order)
        await self.cart_repo.clear(cart.id)

        total_amount = float(created.total_amount)
        background_tasks.add_task(
            write_order_audit_event,
            created.id,
            user_id,
            total_amount,
        )
        _dispatch_celery_task_with_fallback(
            background_tasks, send_order_email_task, created.id, user_id
        )
        _dispatch_celery_task_with_fallback(
            background_tasks,
            generate_order_summary_task,
            created.id,
            user_id,
            total_amount,
        )
        _dispatch_celery_task_with_fallback(
            background_tasks,
            notify_admin_new_order_task,
            created.id,
            user_id,
            total_amount,
        )
        return created

    async def list_orders(self, user_id: int | None = None) -> list[Order]:
        if user_id is None:
            return await self.order_repo.list_all()
        return await self.order_repo.list_for_user(user_id)

    async def update_status(self, order_id: int, status_payload: OrderStatus) -> Order:
        order = await self.order_repo.get(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
            )
        if order.status == OrderStatus.cancelled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled order immutable",
            )
        order.status = status_payload
        return await self.order_repo.update(order)


def serialize_order(order: Order) -> OrderRead:
    return OrderRead(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        items=[
            OrderItemRead(
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
            )
            for item in order.items
        ],
    )
