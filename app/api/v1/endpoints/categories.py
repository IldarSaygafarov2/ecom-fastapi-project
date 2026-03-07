from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.models.enums import UserRole
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.services.catalog_service import CatalogService

router = APIRouter()


@router.get("/", response_model=list[CategoryRead])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[CategoryRead]:
    items = await CatalogService(db).list_categories()
    return [CategoryRead.model_validate(item) for item in items]


@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> CategoryRead:
    item = await CatalogService(db).create_category(payload)
    return CategoryRead.model_validate(item)


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> CategoryRead:
    item = await CatalogService(db).update_category(category_id, payload)
    return CategoryRead.model_validate(item)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> Response:
    await CatalogService(db).delete_category(category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
