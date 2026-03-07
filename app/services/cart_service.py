from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import CartItem
from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.cart import CartRead


class CartService:
    def __init__(self, session: AsyncSession):
        self.cart_repo = CartRepository(session)
        self.product_repo = ProductRepository(session)

    async def get_cart(self, user_id: int) -> CartRead:
        cart = await self.cart_repo.get_or_create_for_user(user_id)
        return self._to_schema(cart)

    async def upsert_item(self, user_id: int, product_id: int, quantity: int) -> CartRead:
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be > 0")
        cart = await self.cart_repo.get_or_create_for_user(user_id)
        product = await self.product_repo.get(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if product.stock < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

        item = await self.cart_repo.get_item(cart.id, product_id)
        if item:
            item.quantity = quantity
            await self.cart_repo.update_item(item)
        else:
            await self.cart_repo.add_item(CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))
        return await self.get_cart(user_id)

    async def clear_cart(self, user_id: int) -> None:
        cart = await self.cart_repo.get_or_create_for_user(user_id)
        await self.cart_repo.clear(cart.id)

    @staticmethod
    def _to_schema(cart) -> CartRead:
        items = []
        total = Decimal("0")
        for item in cart.items:
            price = item.product.price
            line_total = price * item.quantity
            total += line_total
            items.append(
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "price": price,
                    "line_total": line_total,
                }
            )
        return CartRead(id=cart.id, user_id=cart.user_id, items=items, total_amount=total)
