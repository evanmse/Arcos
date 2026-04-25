-- INTEGREAT — Postgres dev bootstrap
-- This script runs once on container init (mounted in docker-entrypoint-initdb.d).

-- pgvector for local embedding fallback (mirrors Cloud SQL prod)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Roles mirroring Cloud SQL setup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'integreat_app') THEN
    CREATE ROLE integreat_app LOGIN PASSWORD 'integreat_app';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'integreat_migrator') THEN
    CREATE ROLE integreat_migrator LOGIN PASSWORD 'integreat_migrator';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE integreat TO integreat_app, integreat_migrator;
GRANT USAGE, CREATE ON SCHEMA public TO integreat_migrator;
GRANT USAGE ON SCHEMA public TO integreat_app;
ALTER DEFAULT PRIVILEGES FOR ROLE integreat_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO integreat_app;
ALTER DEFAULT PRIVILEGES FOR ROLE integreat_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO integreat_app;
