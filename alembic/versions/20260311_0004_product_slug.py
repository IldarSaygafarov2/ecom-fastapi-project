"""add slug to products

Revision ID: 20260311_0004
Revises: 20260308_0003
Create Date: 2026-03-11 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260311_0004"
down_revision = "20260308_0003"
branch_labels = None
depends_on = None


def slugify_name(name: str) -> str:
    import re
    import unicodedata

    text = unicodedata.normalize("NFKD", name)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-") or "product"


def upgrade() -> None:
    op.add_column("products", sa.Column("slug", sa.String(length=300), nullable=True))
    op.create_index("ix_products_slug", "products", ["slug"], unique=True)

    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT id, name FROM products"))
    rows = result.fetchall()
    slugs_seen: dict[str, int] = {}
    for row in rows:
        product_id, name = row
        base = slugify_name(name) if name else "product"
        if base not in slugs_seen:
            slugs_seen[base] = 0
            slug = base
        else:
            slugs_seen[base] += 1
            slug = f"{base}-{slugs_seen[base]}"
        conn.execute(sa.text("UPDATE products SET slug = :slug WHERE id = :id"), {"slug": slug, "id": product_id})

    op.alter_column(
        "products",
        "slug",
        existing_type=sa.String(length=300),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_index("ix_products_slug", table_name="products")
    op.drop_column("products", "slug")
