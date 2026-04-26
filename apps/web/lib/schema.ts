// Idempotent schema bootstrap for new web-side features (corp knowledge,
// regulation uploads, policies CRUD, agent registrations + analyses).
// Run once per cold start; safe to call repeatedly.
import { Pool } from "pg";

let _ensured = false;

const DDL = `
CREATE TABLE IF NOT EXISTS corp_sources (
  source_id   VARCHAR(64) PRIMARY KEY,
  tenant_id   VARCHAR(64) NOT NULL DEFAULT 'default',
  kind        VARCHAR(32) NOT NULL,
  name        TEXT NOT NULL,
  status      VARCHAR(32) NOT NULL DEFAULT 'connected',
  config      JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_corp_sources_tenant ON corp_sources (tenant_id);

CREATE TABLE IF NOT EXISTS corp_documents (
  document_id VARCHAR(64) PRIMARY KEY,
  source_id   VARCHAR(64) NOT NULL REFERENCES corp_sources(source_id) ON DELETE CASCADE,
  tenant_id   VARCHAR(64) NOT NULL DEFAULT 'default',
  title       TEXT NOT NULL,
  uri         TEXT,
  mime_type   VARCHAR(128),
  byte_size   BIGINT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_corp_documents_source ON corp_documents (source_id);
CREATE INDEX IF NOT EXISTS ix_corp_documents_tenant ON corp_documents (tenant_id);

CREATE TABLE IF NOT EXISTS corp_chunks (
  chunk_id    VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(64) NOT NULL REFERENCES corp_documents(document_id) ON DELETE CASCADE,
  tenant_id   VARCHAR(64) NOT NULL DEFAULT 'default',
  ord         INTEGER NOT NULL,
  text        TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  embedding   vector(768),
  indexed_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_corp_chunks_document ON corp_chunks (document_id);
CREATE INDEX IF NOT EXISTS ix_corp_chunks_tenant ON corp_chunks (tenant_id);

CREATE TABLE IF NOT EXISTS regulation_uploads (
  upload_id     VARCHAR(64) PRIMARY KEY,
  regulation_id VARCHAR(64) NOT NULL REFERENCES regulations(regulation_id) ON DELETE CASCADE,
  tenant_id     VARCHAR(64) NOT NULL DEFAULT 'default',
  title         TEXT NOT NULL,
  mime_type     VARCHAR(128),
  byte_size     BIGINT,
  text          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_regulation_uploads_reg ON regulation_uploads (regulation_id);

CREATE TABLE IF NOT EXISTS tenant_policies (
  policy_id          VARCHAR(64) PRIMARY KEY,
  tenant_id          VARCHAR(64) NOT NULL DEFAULT 'default',
  label              TEXT NOT NULL,
  description        TEXT,
  parent_id          VARCHAR(64),
  enabled            BOOLEAN NOT NULL DEFAULT true,
  mandatory          BOOLEAN NOT NULL DEFAULT false,
  risk_categories    JSONB DEFAULT '[]'::jsonb,
  mapped_obligations JSONB DEFAULT '[]'::jsonb,
  assigned_agents    JSONB DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tenant_policies_tenant ON tenant_policies (tenant_id);

CREATE TABLE IF NOT EXISTS agent_registrations (
  agent_id    VARCHAR(64) PRIMARY KEY,
  tenant_id   VARCHAR(64) NOT NULL DEFAULT 'default',
  name        TEXT NOT NULL,
  repo_url    TEXT NOT NULL,
  path        TEXT,
  description TEXT,
  status      VARCHAR(32) NOT NULL DEFAULT 'registered',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_agent_registrations_tenant ON agent_registrations (tenant_id);

CREATE TABLE IF NOT EXISTS agent_analyses (
  analysis_id         VARCHAR(64) PRIMARY KEY,
  agent_id            VARCHAR(64) NOT NULL REFERENCES agent_registrations(agent_id) ON DELETE CASCADE,
  tenant_id           VARCHAR(64) NOT NULL DEFAULT 'default',
  trust_score         INTEGER NOT NULL DEFAULT 0,
  grade               VARCHAR(2),
  risk_class          VARCHAR(32),
  premium_estimate    NUMERIC(12,2) DEFAULT 0,
  findings            JSONB DEFAULT '[]'::jsonb,
  matched_obligations JSONB DEFAULT '[]'::jsonb,
  matched_policies    JSONB DEFAULT '[]'::jsonb,
  insurance_eligible  BOOLEAN NOT NULL DEFAULT false,
  certificate_url     TEXT,
  report_md           TEXT,
  model               VARCHAR(64),
  created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_agent_analyses_agent ON agent_analyses (agent_id);

-- Forward-compatible additions (no-op if columns already exist)
ALTER TABLE agent_registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE agent_analyses ADD COLUMN IF NOT EXISTS premium_estimate NUMERIC(12,2) DEFAULT 0;
ALTER TABLE agent_analyses ADD COLUMN IF NOT EXISTS risk_matrix JSONB DEFAULT '{}'::jsonb;
ALTER TABLE agent_registrations ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE agent_registrations ADD COLUMN IF NOT EXISTS deployment TEXT;
ALTER TABLE tenant_policies ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 5;
ALTER TABLE tenant_policies ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE corp_sources ADD COLUMN IF NOT EXISTS auth_mode VARCHAR(32) DEFAULT 'manual';
ALTER TABLE corp_sources ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE regulation_uploads ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE regulation_uploads ADD COLUMN IF NOT EXISTS kind VARCHAR(32) DEFAULT 'upload';

CREATE TABLE IF NOT EXISTS users (
  user_id      VARCHAR(64) PRIMARY KEY,
  tenant_id    VARCHAR(64) NOT NULL DEFAULT 'default',
  email        TEXT UNIQUE NOT NULL,
  display_name TEXT,
  password_hash TEXT,
  role         VARCHAR(32) NOT NULL DEFAULT 'admin',
  preferences  JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_tenant ON users (tenant_id);

CREATE TABLE IF NOT EXISTS user_integrations (
  integration_id VARCHAR(64) PRIMARY KEY,
  tenant_id      VARCHAR(64) NOT NULL DEFAULT 'default',
  user_email     TEXT NOT NULL,
  provider       VARCHAR(32) NOT NULL,
  label          TEXT,
  access_token   TEXT,
  refresh_token  TEXT,
  metadata       JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_user_integrations_tenant ON user_integrations (tenant_id);

CREATE TABLE IF NOT EXISTS insurance_contracts (
  contract_id     VARCHAR(64) PRIMARY KEY,
  tenant_id       VARCHAR(64) NOT NULL DEFAULT 'default',
  agent_id        VARCHAR(64) REFERENCES agent_registrations(agent_id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  carrier         TEXT,
  status          VARCHAR(32) NOT NULL DEFAULT 'quoted',
  coverage        JSONB DEFAULT '{}'::jsonb,
  exclusions      JSONB DEFAULT '[]'::jsonb,
  premium_eur     NUMERIC(12,2) NOT NULL DEFAULT 0,
  liability_cap_eur NUMERIC(14,2) NOT NULL DEFAULT 0,
  deductible_eur  NUMERIC(12,2) NOT NULL DEFAULT 0,
  effective_date  DATE,
  expiry_date     DATE,
  certificate_url TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_insurance_contracts_tenant ON insurance_contracts (tenant_id);
CREATE INDEX IF NOT EXISTS ix_insurance_contracts_agent ON insurance_contracts (agent_id);
`;

export async function ensureSchema(pool: Pool): Promise<void> {
  if (_ensured) return;
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  } catch {
    // pgvector may already be enabled or require admin role; ignore.
  }
  await pool.query(DDL);
  _ensured = true;
}
