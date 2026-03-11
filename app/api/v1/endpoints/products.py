from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, Query, Request, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.core.config import settings
from app.core.media import save_product_image
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.schemas.product_comment import ProductCommentCreate, ProductCommentRead
from app.services.catalog_service import CatalogService
from app.services.product_comment_service import ProductCommentService

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


@router.get("/slug/{slug}", response_model=ProductRead)
async def get_product_by_slug(slug: str, db: AsyncSession = Depends(get_db)) -> ProductRead:
    item = await CatalogService(db).get_product_by_slug(slug)
    return ProductRead.model_validate(item)


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)) -> ProductRead:
    item = await CatalogService(db).get_product(product_id)
    return ProductRead.model_validate(item)


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    price: Decimal = Form(...),
    stock: int = Form(...),
    category_id: int = Form(...),
    description: str | None = Form(default=None),
    image: UploadFile | None = File(default=None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> ProductRead:
    image_url = await save_product_image(image) if image else None
    payload = ProductCreate(
        name=name,
        description=description,
        image_url=image_url,
        price=price,
        stock=stock,
        category_id=category_id,
    )
    item = await CatalogService(db).create_product(payload)
    return ProductRead.model_validate(item)


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    name: str | None = Form(default=None),
    description: str | None = Form(default=None),
    price: Decimal | None = Form(default=None),
    stock: int | None = Form(default=None),
    category_id: int | None = Form(default=None),
    image: UploadFile | None = File(default=None),
    remove_image: bool = Form(default=False),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_role(UserRole.admin)),
) -> ProductRead:
    payload_data: dict[str, str | Decimal | int | None] = {}
    if name is not None:
        payload_data["name"] = name
    if description is not None:
        payload_data["description"] = description
    if price is not None:
        payload_data["price"] = price
    if stock is not None:
        payload_data["stock"] = stock
    if category_id is not None:
        payload_data["category_id"] = category_id
    if image:
        payload_data["image_url"] = await save_product_image(image)
    elif remove_image:
        payload_data["image_url"] = None
    payload = ProductUpdate(**payload_data)
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


@router.get("/{product_id}/comments", response_model=list[ProductCommentRead])
async def list_product_comments(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[ProductCommentRead]:
    return await ProductCommentService(db).list_for_product(product_id)


@router.post("/{product_id}/comments", response_model=ProductCommentRead, status_code=status.HTTP_201_CREATED)
async def create_product_comment(
    product_id: int,
    payload: ProductCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductCommentRead:
    return await ProductCommentService(db).create(product_id, current_user.id, payload)


@router.delete("/{product_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_comment(
    product_id: int,
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    is_admin = current_user.role == UserRole.admin
    await ProductCommentService(db).delete(comment_id, is_admin)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
