from fastapi import APIRouter

from app.api.v1.endpoints import auth, cart, categories, health, orders, products

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
