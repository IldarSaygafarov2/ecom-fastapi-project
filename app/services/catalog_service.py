from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.media import remove_local_media_file
from app.models.category import Category
from app.models.product import Product
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.slug import make_unique_slug, slugify
from app.services.cache import delete_by_prefix, get_json, set_json


class CatalogService:
    def __init__(self, session: AsyncSession):
        self.categories = CategoryRepository(session)
        self.products = ProductRepository(session)

    async def list_categories(self) -> list[Category]:
        return await self.categories.list()

    async def create_category(self, payload: CategoryCreate) -> Category:
        category = Category(name=payload.name, description=payload.description)
        created = await self.categories.create(category)
        await delete_by_prefix("categories:")
        return created

    async def update_category(self, category_id: int, payload: CategoryUpdate) -> Category:
        category = await self.categories.get(category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        if payload.name is not None:
            category.name = payload.name
        if payload.description is not None:
            category.description = payload.description
        updated = await self.categories.update(category)
        await delete_by_prefix("categories:")
        return updated

    async def delete_category(self, category_id: int) -> None:
        category = await self.categories.get(category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        await self.categories.delete(category)
        await delete_by_prefix("categories:")

    async def list_products(self, search: str | None, category_id: int | None) -> list[Product]:
        cache_key = f"products:list:{search or ''}:{category_id or 0}"
        cached = await get_json(cache_key)
        if cached:
            return [Product(**item) for item in cached]
        items = await self.products.list(search=search, category_id=category_id)
        await set_json(cache_key, [self._product_to_dict(item) for item in items])
        return items

    async def get_product(self, product_id: int) -> Product:
        cache_key = f"products:detail:{product_id}"
        cached = await get_json(cache_key)
        if cached:
            return Product(**cached)
        product = await self.products.get(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        await set_json(cache_key, self._product_to_dict(product))
        return product

    async def get_product_by_slug(self, slug: str) -> Product:
        cache_key = f"products:slug:{slug}"
        cached = await get_json(cache_key)
        if cached:
            return Product(**cached)
        product = await self.products.get_by_slug(slug)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        await set_json(cache_key, self._product_to_dict(product))
        return product

    async def create_product(self, payload: ProductCreate) -> Product:
        existing = await self.products.get_existing_slugs()
        base_slug = slugify(payload.name)
        slug = make_unique_slug(base_slug, existing)
        data = payload.model_dump()
        data["slug"] = slug
        product = Product(**data)
        created = await self.products.create(product)
        await self._invalidate_product_cache(created.id, created.slug)
        return created

    async def update_product(self, product_id: int, payload: ProductUpdate) -> Product:
        product = await self.products.get(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        old_image_url = product.image_url
        update_data = payload.model_dump(exclude_unset=True)
        if "name" in update_data:
            existing = await self.products.get_existing_slugs()
            base_slug = slugify(update_data["name"])
            update_data["slug"] = make_unique_slug(base_slug, [s for s in existing if s != product.slug])
        for key, value in update_data.items():
            setattr(product, key, value)
        updated = await self.products.update(product)
        if old_image_url != updated.image_url:
            remove_local_media_file(old_image_url)
        await self._invalidate_product_cache(product_id, getattr(updated, "slug", None))
        return updated

    async def delete_product(self, product_id: int) -> None:
        product = await self.products.get(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        remove_local_media_file(product.image_url)
        await self.products.delete(product)
        await self._invalidate_product_cache(product_id, getattr(product, "slug", None))

    async def _invalidate_product_cache(self, product_id: int, slug: str | None = None) -> None:
        await delete_by_prefix("products:list:")
        await delete_by_prefix(f"products:detail:{product_id}")
        if slug:
            await delete_by_prefix(f"products:slug:{slug}")

    @staticmethod
    def _product_to_dict(product: Product) -> dict:
        return {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "image_url": product.image_url,
            "price": product.price,
            "stock": product.stock,
            "category_id": product.category_id,
        }
