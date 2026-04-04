"""add oauth provider support to users

Revision ID: add_oauth_provider
Revises: <PUT_PREVIOUS_REVISION_ID>
Create Date: 2026-04-04
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers
revision = "add_oauth_provider"
down_revision = "20260319_0002"
branch_labels = None
depends_on = None


# ---- ENUM ----
auth_provider_enum = sa.Enum("local", "google", name="auth_provider_enum")


def upgrade():
    # 1. Create enum type
    auth_provider_enum.create(op.get_bind(), checkfirst=True)

    # 2. Make password_hash nullable
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=True,
    )

    # 3. Add new columns
    op.add_column(
        "users",
        sa.Column("auth_provider", auth_provider_enum, nullable=False, server_default="local"),
    )

    op.add_column(
        "users",
        sa.Column("provider_subject", sa.String(length=255), nullable=True),
    )

    # 4. Backfill existing users
    op.execute("UPDATE users SET auth_provider = 'local'")

    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("users")]

    if "google_sub" in columns:
        op.drop_column("users", "google_sub")

    # 6. Add unique constraint on provider_subject
    op.create_unique_constraint(
        "uq_users_provider_subject",
        "users",
        ["provider_subject"],
    )


def downgrade():
    # 1. Re-add google_sub (optional)
    op.add_column(
        "users",
        sa.Column("google_sub", sa.String(length=255), nullable=True),
    )

    # 2. Drop constraint
    op.drop_constraint("uq_users_provider_subject", "users", type_="unique")

    # 3. Drop new columns
    op.drop_column("users", "provider_subject")
    op.drop_column("users", "auth_provider")

    # 4. Make password_hash NOT NULL again
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=False,
    )

    # 5. Drop enum
    auth_provider_enum.drop(op.get_bind(), checkfirst=True)