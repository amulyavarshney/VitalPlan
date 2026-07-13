"""Add marketplace_items table

Revision ID: 0002_marketplace
Revises: 0001_initial
Create Date: 2026-07-13 19:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_marketplace"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "marketplace_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sku", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("original_price", sa.Float(), nullable=True),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("brand", sa.String(), nullable=False),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("reviews", sa.Integer(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("in_stock", sa.Boolean(), nullable=True),
        sa.Column("features", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketplace_items_id"), "marketplace_items", ["id"], unique=False)
    op.create_index(op.f("ix_marketplace_items_sku"), "marketplace_items", ["sku"], unique=True)
    op.create_index(op.f("ix_marketplace_items_category"), "marketplace_items", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_marketplace_items_category"), table_name="marketplace_items")
    op.drop_index(op.f("ix_marketplace_items_sku"), table_name="marketplace_items")
    op.drop_index(op.f("ix_marketplace_items_id"), table_name="marketplace_items")
    op.drop_table("marketplace_items")
