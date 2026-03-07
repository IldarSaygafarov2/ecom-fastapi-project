from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.cart import CartItemUpsert, CartRead
from app.services.cart_service import CartService

router = APIRouter()


@router.get("/", response_model=CartRead)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartRead:
    return await CartService(db).get_cart(current_user.id)


@router.put("/items", response_model=CartRead)
async def upsert_cart_item(
    payload: CartItemUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartRead:
    return await CartService(db).upsert_item(current_user.id, payload.product_id, payload.quantity)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    await CartService(db).clear_cart(current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
