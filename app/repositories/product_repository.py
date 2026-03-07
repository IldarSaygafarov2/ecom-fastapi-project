from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self, search: str | None = None, category_id: int | None = None) -> list[Product]:
        stmt: Select[tuple[Product]] = select(Product).order_by(Product.id)
        if search:
            stmt = stmt.where(Product.name.ilike(f"%{search}%"))
        if category_id:
            stmt = stmt.where(Product.category_id == category_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get(self, product_id: int) -> Product | None:
        result = await self.session.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()

    async def create(self, product: Product) -> Product:
        self.session.add(product)
        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def update(self, product: Product) -> Product:
        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def delete(self, product: Product) -> None:
        await self.session.delete(product)
        await self.session.commit()
