from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart, CartItem


class CartRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_for_user(self, user_id: int) -> Cart:
        stmt = (
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .where(Cart.user_id == user_id)
            .execution_options(populate_existing=True)
        )
        result = await self.session.execute(stmt)
        cart = result.scalar_one_or_none()
        if cart:
            return cart
        cart = Cart(user_id=user_id)
        self.session.add(cart)
        await self.session.commit()
        await self.session.refresh(cart)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_item(self, cart_id: int, product_id: int) -> CartItem | None:
        stmt = select(CartItem).where(CartItem.cart_id == cart_id, CartItem.product_id == product_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add_item(self, item: CartItem) -> CartItem:
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def update_item(self, item: CartItem) -> CartItem:
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def clear(self, cart_id: int) -> None:
        await self.session.execute(delete(CartItem).where(CartItem.cart_id == cart_id))
        await self.session.commit()
