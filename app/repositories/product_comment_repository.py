from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product_comment import ProductComment
from app.models.user import User


class ProductCommentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_for_product(self, product_id: int) -> list[ProductComment]:
        result = await self.session.execute(
            select(ProductComment)
            .where(ProductComment.product_id == product_id)
            .options(selectinload(ProductComment.user))
            .order_by(ProductComment.created_at.desc())
        )
        return list(result.scalars().all())

    async def get(self, comment_id: int) -> ProductComment | None:
        result = await self.session.execute(
            select(ProductComment)
            .where(ProductComment.id == comment_id)
            .options(selectinload(ProductComment.user))
        )
        return result.scalar_one_or_none()

    async def create(self, comment: ProductComment) -> ProductComment:
        self.session.add(comment)
        await self.session.commit()
        await self.session.refresh(comment)
        await self.session.refresh(comment, ["user"])
        return comment

    async def delete(self, comment: ProductComment) -> None:
        await self.session.delete(comment)
        await self.session.commit()
