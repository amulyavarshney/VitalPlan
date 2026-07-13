"""Add payment fields to orders

Revision ID: 0003_payments
Revises: 0002_marketplace
Create Date: 2026-07-13 19:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_payments"
down_revision: Union[str, None] = "0002_marketplace"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.add_column(sa.Column("payment_status", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("payment_intent_id", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("payment_provider", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.drop_column("paid_at")
        batch_op.drop_column("payment_provider")
        batch_op.drop_column("payment_intent_id")
        batch_op.drop_column("payment_status")
