from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import CartItem
from app.services.cache import delete_by_prefix
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

        item = await self.cart_repo.get_item(cart.id, product_id)
        current_in_cart = item.quantity if item else 0
        new_total = current_in_cart + quantity
        if new_total > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {product.stock}, requested: {new_total}",
            )

        product.stock -= quantity
        await self.product_repo.update(product)
        await self._invalidate_product_cache(product_id, product.slug)

        if item:
            item.quantity = new_total
            await self.cart_repo.update_item(item)
        else:
            await self.cart_repo.add_item(
                CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
            )
        return await self.get_cart(user_id)

    async def remove_item(self, user_id: int, product_id: int) -> CartRead:
        cart = await self.cart_repo.get_or_create_for_user(user_id)
        item = await self.cart_repo.get_item(cart.id, product_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not in cart",
            )
        product = await self.product_repo.get(product_id)
        if product:
            product.stock += item.quantity
            await self.product_repo.update(product)
            await self._invalidate_product_cache(product_id, product.slug)
        await self.cart_repo.remove_item(cart.id, product_id)
        return await self.get_cart(user_id)

    async def clear_cart(self, user_id: int) -> None:
        cart = await self.cart_repo.get_or_create_for_user(user_id)
        for item in cart.items:
            item.product.stock += item.quantity
            await self.product_repo.update(item.product)
            await self._invalidate_product_cache(item.product_id, item.product.slug)
        await self.cart_repo.clear(cart.id)

    @staticmethod
    async def _invalidate_product_cache(product_id: int, slug: str | None = None) -> None:
        await delete_by_prefix("products:list:")
        await delete_by_prefix(f"products:detail:{product_id}")
        if slug:
            await delete_by_prefix(f"products:slug:{slug}")

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
