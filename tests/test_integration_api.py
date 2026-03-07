import pytest
from sqlalchemy import select

from app.models.enums import UserRole
from app.models.user import User
from app.services import order_service as order_service_module


async def _register_and_login(client, email: str, password: str) -> str:
    register_resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    assert register_resp.status_code in (200, 201)
    login_resp = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_catalog_cart_order_flow(client, db_session):
    admin_token = await _register_and_login(client, "admin@example.com", "secret123")
    customer_token = await _register_and_login(client, "customer@example.com", "secret123")

    # Promote first user to admin role for protected catalog endpoints.
    result = await db_session.execute(select(User).where(User.email == "admin@example.com"))
    admin_user = result.scalar_one()
    admin_user.role = UserRole.admin
    await db_session.commit()

    category_resp = await client.post(
        "/api/v1/categories/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Books", "description": "Book category"},
    )
    assert category_resp.status_code == 201
    category_id = category_resp.json()["id"]

    product_resp = await client.post(
        "/api/v1/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "FastAPI Book",
            "description": "Async backend guide",
            "price": "19.99",
            "stock": 5,
            "category_id": category_id,
        },
    )
    assert product_resp.status_code == 201
    product_id = product_resp.json()["id"]

    cart_resp = await client.put(
        "/api/v1/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_id": product_id, "quantity": 2},
    )
    assert cart_resp.status_code == 200
    assert len(cart_resp.json()["items"]) == 1

    order_resp = await client.post(
        "/api/v1/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert order_resp.status_code == 200
    assert order_resp.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_order_flow_survives_celery_delay_failures(client, db_session, monkeypatch):
    delay_calls: list[str] = []

    def _fail_delay(task_name: str):
        def _inner(*args, **kwargs):
            delay_calls.append(task_name)
            raise RuntimeError("broker is unavailable")

        return _inner

    monkeypatch.setattr(
        order_service_module.send_order_email_task,
        "delay",
        _fail_delay("send_order_email_task"),
    )
    monkeypatch.setattr(
        order_service_module.generate_order_summary_task,
        "delay",
        _fail_delay("generate_order_summary_task"),
    )
    monkeypatch.setattr(
        order_service_module.notify_admin_new_order_task,
        "delay",
        _fail_delay("notify_admin_new_order_task"),
    )

    admin_token = await _register_and_login(client, "admin2@example.com", "secret123")
    customer_token = await _register_and_login(client, "customer2@example.com", "secret123")

    result = await db_session.execute(select(User).where(User.email == "admin2@example.com"))
    admin_user = result.scalar_one()
    admin_user.role = UserRole.admin
    await db_session.commit()

    category_resp = await client.post(
        "/api/v1/categories/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Gadgets", "description": "Gadget category"},
    )
    assert category_resp.status_code == 201
    category_id = category_resp.json()["id"]

    product_resp = await client.post(
        "/api/v1/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Task Device",
            "description": "Workflow helper",
            "price": "29.99",
            "stock": 3,
            "category_id": category_id,
        },
    )
    assert product_resp.status_code == 201
    product_id = product_resp.json()["id"]

    cart_resp = await client.put(
        "/api/v1/cart/items",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"product_id": product_id, "quantity": 1},
    )
    assert cart_resp.status_code == 200

    order_resp = await client.post(
        "/api/v1/orders/",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert order_resp.status_code == 200
    assert order_resp.json()["status"] == "pending"
    assert sorted(delay_calls) == [
        "generate_order_summary_task",
        "notify_admin_new_order_task",
        "send_order_email_task",
    ]
