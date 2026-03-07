import pytest
from fastapi import HTTPException

from app.schemas.auth import UserCreate
from app.services.auth_service import AuthService
from app.services.cart_service import CartService


@pytest.mark.asyncio
async def test_register_duplicate_email(db_session):
    service = AuthService(db_session)
    payload = UserCreate(
        email="dup@example.com", password="secret123", full_name="Duplicate"
    )
    await service.register(payload)

    with pytest.raises(HTTPException) as exc:
        await service.register(payload)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_cart_quantity_validation(db_session):
    service = CartService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.upsert_item(user_id=1, product_id=1, quantity=0)
    assert exc.value.status_code == 400
