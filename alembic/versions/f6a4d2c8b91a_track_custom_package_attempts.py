"""track_custom_package_attempts

Revision ID: f6a4d2c8b91a
Revises: de56b8151b77
Create Date: 2026-05-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op, context
import sqlalchemy as sa


revision: str = "f6a4d2c8b91a"
down_revision: Union[str, Sequence[str], None] = "de56b8151b77"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("practice_attempts", sa.Column("custom_package_id", sa.Uuid(), nullable=True))
    op.create_index(
        op.f("ix_practice_attempts_custom_package_id"),
        "practice_attempts",
        ["custom_package_id"],
        unique=False,
    )
    if context.get_bind().dialect.name != "sqlite":
        op.create_foreign_key(
            "fk_practice_attempts_custom_package_id_custom_packages",
            "practice_attempts",
            "custom_packages",
            ["custom_package_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    if context.get_bind().dialect.name != "sqlite":
        op.drop_constraint(
            "fk_practice_attempts_custom_package_id_custom_packages",
            "practice_attempts",
            type_="foreignkey",
        )
    op.drop_index(op.f("ix_practice_attempts_custom_package_id"), table_name="practice_attempts")
    op.drop_column("practice_attempts", "custom_package_id")
