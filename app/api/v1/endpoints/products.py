from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.config import settings
from app.models.enums import UserRole
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services.catalog_service import CatalogService

router = APIRouter()


@router.get("/", response_model=list[ProductRead])
@settings.rate_limiter.limit("120/minute")
async def list_products(
    request: Request,
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[ProductRead]:
    _ = request
    items = await CatalogService(db).list_products(search=search, category_id=category_id)
    return [ProductRead.model_validate(item) for item in items]


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)) -> ProductRead:
    item = await CatalogService(db).get_product(product_id)
    return ProductRead.model_validate(item)


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> ProductRead:
    item = await CatalogService(db).create_product(payload)
    return ProductRead.model_validate(item)


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> ProductRead:
    item = await CatalogService(db).update_product(product_id, payload)
    return ProductRead.model_validate(item)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> Response:
    await CatalogService(db).delete_product(product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
