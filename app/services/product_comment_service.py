from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product_comment import ProductComment
from app.repositories.product_comment_repository import ProductCommentRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.product_comment import ProductCommentCreate, ProductCommentRead


class ProductCommentService:
    def __init__(self, session: AsyncSession):
        self.repo = ProductCommentRepository(session)
        self.product_repo = ProductRepository(session)

    async def list_for_product(self, product_id: int) -> list[ProductCommentRead]:
        product = await self.product_repo.get(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        comments = await self.repo.list_for_product(product_id)
        return [
            ProductCommentRead(
                id=c.id,
                product_id=c.product_id,
                user_id=c.user_id,
                user_email=c.user.email,
                content=c.content,
                created_at=c.created_at,
            )
            for c in comments
        ]

    async def create(self, product_id: int, user_id: int, payload: ProductCommentCreate) -> ProductCommentRead:
        product = await self.product_repo.get(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        comment = ProductComment(
            product_id=product_id,
            user_id=user_id,
            content=payload.content.strip(),
        )
        created = await self.repo.create(comment)
        return ProductCommentRead(
            id=created.id,
            product_id=created.product_id,
            user_id=created.user_id,
            user_email=created.user.email,
            content=created.content,
            created_at=created.created_at,
        )

    async def delete(self, comment_id: int, is_admin: bool) -> None:
        if not is_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        comment = await self.repo.get(comment_id)
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        await self.repo.delete(comment)
