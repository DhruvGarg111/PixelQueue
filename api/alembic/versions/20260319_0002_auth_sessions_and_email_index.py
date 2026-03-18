"""add auth sessions and case-insensitive email index

Revision ID: 20260319_0002
Revises: 20260224_0001
Create Date: 2026-03-19
"""

from alembic import op


revision = "20260319_0002"
down_revision = "20260224_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE users SET email = LOWER(BTRIM(email));")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS auth_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            refresh_token_hash VARCHAR(128) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ NULL,
            last_used_at TIMESTAMPTZ NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_created ON auth_sessions(user_id, created_at DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (LOWER(email));")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_users_email_lower;")
    op.execute("DROP INDEX IF EXISTS idx_auth_sessions_expires_at;")
    op.execute("DROP INDEX IF EXISTS idx_auth_sessions_user_created;")
    op.execute("DROP TABLE IF EXISTS auth_sessions;")
