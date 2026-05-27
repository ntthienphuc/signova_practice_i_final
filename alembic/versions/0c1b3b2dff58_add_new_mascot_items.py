"""add_new_mascot_items

Revision ID: 0c1b3b2dff58
Revises: aa6a66213a45
Create Date: 2026-05-26 21:54:31.197072

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c1b3b2dff58'
down_revision: Union[str, Sequence[str], None] = 'aa6a66213a45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix existing items: preview_filename should be the composed mascot image
    op.execute("UPDATE mascot_items SET preview_filename = 'mascot_cape.png' WHERE item_key = 'cape'")
    op.execute("UPDATE mascot_items SET preview_filename = 'mascot_hat.png' WHERE item_key = 'hat'")

    # Add new composed mascot items
    mascot_items_table = sa.table(
        "mascot_items",
        sa.column("item_key", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("preview_filename", sa.String),
        sa.column("mascot_filename", sa.String),
        sa.column("xp_cost", sa.Integer),
        sa.column("is_available", sa.Boolean),
    )
    op.bulk_insert(mascot_items_table, [
        {
            "item_key": "mascot_helicopter",
            "name": "Mascot Trực thăng",
            "description": "Bay cao với chiếc trực thăng!",
            "preview_filename": "mascot_helicopter.png",
            "mascot_filename": "mascot_helicopter.png",
            "xp_cost": 350,
            "is_available": True,
        },
        {
            "item_key": "mascot_gold_car",
            "name": "Mascot Xe vàng",
            "description": "Lái xe siêu sang màu vàng!",
            "preview_filename": "mascot_gold_car.png",
            "mascot_filename": "mascot_gold_car.png",
            "xp_cost": 500,
            "is_available": True,
        },
        {
            "item_key": "pink_mascot_car",
            "name": "Mascot Xe hồng",
            "description": "Phóng xe màu hồng thật dễ thương!",
            "preview_filename": "pink_mascot_car.png",
            "mascot_filename": "pink_mascot_car.png",
            "xp_cost": 500,
            "is_available": True,
        },
        {
            "item_key": "pink_mascot",
            "name": "Mascot Hồng",
            "description": "Phiên bản đặc biệt màu hồng siêu cute!",
            "preview_filename": "pink_mascot.png",
            "mascot_filename": "pink_mascot.png",
            "xp_cost": 300,
            "is_available": True,
        },
    ])


def downgrade() -> None:
    op.execute("DELETE FROM mascot_items WHERE item_key IN ('mascot_helicopter', 'mascot_gold_car', 'pink_mascot_car', 'pink_mascot')")
    op.execute("UPDATE mascot_items SET preview_filename = 'cape.png' WHERE item_key = 'cape'")
    op.execute("UPDATE mascot_items SET preview_filename = 'hat.png' WHERE item_key = 'hat'")
