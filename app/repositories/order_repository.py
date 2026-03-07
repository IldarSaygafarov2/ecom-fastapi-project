from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order


class OrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, order: Order) -> Order:
        self.session.add(order)
        await self.session.commit()
        await self.session.refresh(order)
        return await self.get(order.id)  # type: ignore[arg-type]

    async def get(self, order_id: int) -> Order | None:
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: int) -> list[Order]:
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.user_id == user_id)
            .order_by(Order.id.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, order: Order) -> Order:
        await self.session.commit()
        await self.session.refresh(order)
        return order
