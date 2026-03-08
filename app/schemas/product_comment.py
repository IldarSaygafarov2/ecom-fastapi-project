from datetime import datetime

from pydantic import field_validator

from app.schemas.common import ORMModel


class ProductCommentCreate(ORMModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Comment cannot be empty")
        return v.strip()


class ProductCommentRead(ORMModel):
    id: int
    product_id: int
    user_id: int
    user_email: str
    content: str
    created_at: datetime
