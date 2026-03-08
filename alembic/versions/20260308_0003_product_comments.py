"""add product_comments table

Revision ID: 20260308_0003
Revises: 20260308_0002
Create Date: 2026-03-08 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260308_0003"
down_revision = "20260308_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_product_comments_product_id", "product_comments", ["product_id"], unique=False)
    op.create_index("ix_product_comments_user_id", "product_comments", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_product_comments_user_id", table_name="product_comments")
    op.drop_index("ix_product_comments_product_id", table_name="product_comments")
    op.drop_table("product_comments")
