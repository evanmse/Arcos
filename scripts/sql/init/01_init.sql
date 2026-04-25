-- ARCOS — Postgres dev bootstrap
-- This script runs once on container init (mounted in docker-entrypoint-initdb.d).

-- pgvector for local embedding fallback (mirrors Cloud SQL prod)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Roles mirroring Cloud SQL setup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'arcos_app') THEN
    CREATE ROLE arcos_app LOGIN PASSWORD 'arcos_app';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'arcos_migrator') THEN
    CREATE ROLE arcos_migrator LOGIN PASSWORD 'arcos_migrator';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE arcos TO arcos_app, arcos_migrator;
GRANT USAGE, CREATE ON SCHEMA public TO arcos_migrator;
GRANT USAGE ON SCHEMA public TO arcos_app;
ALTER DEFAULT PRIVILEGES FOR ROLE arcos_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO arcos_app;
ALTER DEFAULT PRIVILEGES FOR ROLE arcos_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO arcos_app;
