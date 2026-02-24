"""initial schema

Revision ID: 20260224_0001
Revises:
Create Date: 2026-02-24
"""

from alembic import op


revision = "20260224_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'global_role_enum') THEN
                CREATE TYPE global_role_enum AS ENUM ('annotator','reviewer','admin');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_role_enum') THEN
                CREATE TYPE project_role_enum AS ENUM ('annotator','reviewer','admin');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
                CREATE TYPE task_status_enum AS ENUM ('open','in_progress','in_review','done');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'annotation_status_enum') THEN
                CREATE TYPE annotation_status_enum AS ENUM ('draft','approved','rejected');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'annotation_source_enum') THEN
                CREATE TYPE annotation_source_enum AS ENUM ('manual','auto');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'annotation_source_version_enum') THEN
                CREATE TYPE annotation_source_version_enum AS ENUM ('manual','auto');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'annotation_status_version_enum') THEN
                CREATE TYPE annotation_status_version_enum AS ENUM ('draft','approved','rejected');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auto_label_job_status_enum') THEN
                CREATE TYPE auto_label_job_status_enum AS ENUM ('queued','running','completed','failed');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_format_enum') THEN
                CREATE TYPE export_format_enum AS ENUM ('coco','yolo');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_job_status_enum') THEN
                CREATE TYPE export_job_status_enum AS ENUM ('queued','running','completed','failed');
            END IF;
        END$$;
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            global_role global_role_enum NOT NULL DEFAULT 'annotator',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS project_memberships (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            role project_role_enum NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_membership_user_project UNIQUE (user_id, project_id)
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            object_key VARCHAR(512) NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            checksum VARCHAR(128) NULL,
            annotation_revision INTEGER NOT NULL DEFAULT 0,
            uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
            status task_status_enum NOT NULL DEFAULT 'open',
            assigned_to UUID NULL REFERENCES users(id) ON DELETE SET NULL,
            due_at TIMESTAMPTZ NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS annotations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
            label VARCHAR(255) NOT NULL,
            geometry_jsonb JSONB NOT NULL,
            source annotation_source_enum NOT NULL,
            status annotation_status_enum NOT NULL DEFAULT 'draft',
            confidence DOUBLE PRECISION NULL,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            updated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            revision INTEGER NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS annotation_versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
            revision INTEGER NOT NULL,
            geometry_jsonb JSONB NOT NULL,
            label VARCHAR(255) NOT NULL,
            source annotation_source_version_enum NOT NULL,
            status annotation_status_version_enum NOT NULL,
            changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS review_actions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
            reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            action VARCHAR(32) NOT NULL,
            comment TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ml_models (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            version VARCHAR(128) NOT NULL,
            provider VARCHAR(64) NOT NULL,
            object_key VARCHAR(512) NULL,
            is_active BOOLEAN NOT NULL DEFAULT FALSE,
            metrics_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS auto_label_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
            model_id UUID NULL REFERENCES ml_models(id) ON DELETE SET NULL,
            status auto_label_job_status_enum NOT NULL DEFAULT 'queued',
            error_text TEXT NULL,
            result_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            started_at TIMESTAMPTZ NULL,
            finished_at TIMESTAMPTZ NULL
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS export_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            format export_format_enum NOT NULL,
            status export_job_status_enum NOT NULL DEFAULT 'queued',
            object_key VARCHAR(512) NULL,
            summary_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
            error_text TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            finished_at TIMESTAMPTZ NULL
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            actor_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
            project_id UUID NULL REFERENCES projects(id) ON DELETE SET NULL,
            entity_type VARCHAR(64) NOT NULL,
            entity_id UUID NULL,
            action VARCHAR(64) NOT NULL,
            payload_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_auto_jobs_project_status ON auto_label_jobs(project_id, status);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_export_jobs_project_status ON export_jobs(project_id, status);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_annotations_image ON annotations(image_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_annotations_geometry_gin ON annotations USING GIN (geometry_jsonb);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_project_memberships_project ON project_memberships(project_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id, created_at DESC);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS audit_logs;")
    op.execute("DROP TABLE IF EXISTS export_jobs;")
    op.execute("DROP TABLE IF EXISTS auto_label_jobs;")
    op.execute("DROP TABLE IF EXISTS ml_models;")
    op.execute("DROP TABLE IF EXISTS review_actions;")
    op.execute("DROP TABLE IF EXISTS annotation_versions;")
    op.execute("DROP TABLE IF EXISTS annotations;")
    op.execute("DROP TABLE IF EXISTS tasks;")
    op.execute("DROP TABLE IF EXISTS images;")
    op.execute("DROP TABLE IF EXISTS project_memberships;")
    op.execute("DROP TABLE IF EXISTS projects;")
    op.execute("DROP TABLE IF EXISTS users;")
    op.execute("DROP TYPE IF EXISTS export_job_status_enum;")
    op.execute("DROP TYPE IF EXISTS export_format_enum;")
    op.execute("DROP TYPE IF EXISTS auto_label_job_status_enum;")
    op.execute("DROP TYPE IF EXISTS annotation_status_version_enum;")
    op.execute("DROP TYPE IF EXISTS annotation_source_version_enum;")
    op.execute("DROP TYPE IF EXISTS annotation_source_enum;")
    op.execute("DROP TYPE IF EXISTS annotation_status_enum;")
    op.execute("DROP TYPE IF EXISTS task_status_enum;")
    op.execute("DROP TYPE IF EXISTS project_role_enum;")
    op.execute("DROP TYPE IF EXISTS global_role_enum;")

