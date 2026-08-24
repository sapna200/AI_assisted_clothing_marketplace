"""rename image_url to image_urls and add detected_tag_price

Revision ID: b78fa97f727b
Revises: 79564b7ff285
Create Date: 2026-08-24 20:08:09.550534

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b78fa97f727b'
down_revision: Union[str, Sequence[str], None] = '79564b7ff285'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename (not drop+add) so existing image_url data is preserved.
    op.alter_column(
        'products', 'image_url', new_column_name='image_urls',
        existing_type=sa.String(), nullable=True,
    )
    op.add_column('products', sa.Column('detected_tag_price', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'detected_tag_price')
    op.alter_column(
        'products', 'image_urls', new_column_name='image_url',
        existing_type=sa.String(), nullable=True,
    )
