// Postgres read-only client for the INTEGREAT web frontend.
// Uses pg + Cloud SQL connector (unix socket /cloudsql/<conn>).
import { Pool } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;
  const cs = process.env.PGSOCKET_PATH; // e.g. /cloudsql/integreat-dev:europe-west1:integreat-dev-pg
  const user = process.env.PGUSER || "app";
  const password = process.env.PGPASSWORD || "";
  const database = process.env.PGDATABASE || "integreat_risk";
  if (cs) {
    _pool = new Pool({
      host: cs,
      user,
      password,
      database,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  } else {
    _pool = new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user,
      password,
      database,
      max: 5,
    });
  }
  return _pool;
}

export type RegulationRow = {
  regulation_id: string;
  celex: string;
  title: string;
  short_name: string;
  publication_date: string | null;
  source_url: string | null;
  lang: string;
};

export type ChunkRow = {
  chunk_id: string;
  source_type: string;
  source_id: string;
  regulation_id: string | null;
  article_number: string;
  paragraph_number: string | null;
  chapter: string | null;
  text: string;
  token_count: number;
  source_url: string | null;
};

export type ObligationRow = {
  obligation_id: string;
  source_type: string;
  source_id: string;
  ref: string;
  text: string;
  sanction_max: string | null;
  deadline: string | null;
  applicable_to: string[];
  risk_categories: string[];
  dimension: string;
  domain: string | null;
};

export async function listRegulations(): Promise<RegulationRow[]> {
  const { rows } = await getPool().query<RegulationRow>(
    "SELECT regulation_id, celex, title, short_name, publication_date, source_url, lang FROM regulations ORDER BY regulation_id",
  );
  return rows;
}

export async function getRegulation(id: string): Promise<RegulationRow | null> {
  const { rows } = await getPool().query<RegulationRow>(
    "SELECT regulation_id, celex, title, short_name, publication_date, source_url, lang FROM regulations WHERE regulation_id = $1",
    [id],
  );
  return rows[0] ?? null;
}

export async function listArticles(regulationId: string): Promise<
  { article_number: string; chapter: string | null; chunks: number }[]
> {
  const { rows } = await getPool().query<{
    article_number: string;
    chapter: string | null;
    chunks: string;
  }>(
    `SELECT article_number, MAX(chapter) AS chapter, COUNT(*)::text AS chunks
     FROM risk_chunks
     WHERE source_type = 'regulation' AND regulation_id = $1
     GROUP BY article_number
     ORDER BY NULLIF(regexp_replace(article_number, '[^0-9]', '', 'g'), '')::int NULLS LAST, article_number`,
    [regulationId],
  );
  return rows.map((r) => ({
    article_number: r.article_number,
    chapter: r.chapter,
    chunks: Number(r.chunks),
  }));
}

export async function listChunks(
  regulationId: string,
  articleNumber: string,
): Promise<ChunkRow[]> {
  const { rows } = await getPool().query<ChunkRow>(
    `SELECT chunk_id, source_type, source_id, regulation_id, article_number,
            paragraph_number, chapter, text, token_count, source_url
     FROM risk_chunks
     WHERE source_type = 'regulation' AND regulation_id = $1 AND article_number = $2
     ORDER BY paragraph_number NULLS FIRST, chunk_id`,
    [regulationId, articleNumber],
  );
  return rows;
}

export async function listObligations(
  regulationId: string,
  articleNumber?: string,
): Promise<ObligationRow[]> {
  const params: unknown[] = ["regulation", regulationId];
  let where = "source_type = $1 AND source_id = $2";
  if (articleNumber) {
    params.push(articleNumber);
    where += " AND ref = $3";
  }
  const { rows } = await getPool().query<ObligationRow>(
    `SELECT obligation_id, source_type, source_id, ref, text, sanction_max, deadline,
            applicable_to, risk_categories, dimension, domain
     FROM risk_obligations
     WHERE ${where}
     ORDER BY ref, obligation_id`,
    params,
  );
  return rows;
}

export type Stats = {
  regulations: number;
  standards: number;
  insurance_clauses: number;
  chunks: number;
  obligations: number;
};

export async function loadStats(): Promise<Stats> {
  const pool = getPool();
  const q = async (sql: string): Promise<number> => {
    try {
      const { rows } = await pool.query<{ c: string }>(sql);
      return Number(rows[0]?.c ?? 0);
    } catch {
      return 0;
    }
  };
  const [regulations, standards, insurance_clauses, chunks, obligations] =
    await Promise.all([
      q("SELECT COUNT(*)::text AS c FROM regulations"),
      q("SELECT COUNT(DISTINCT source_id)::text AS c FROM risk_chunks WHERE source_type='standard'"),
      q("SELECT COUNT(*)::text AS c FROM insurance_clauses"),
      q("SELECT COUNT(*)::text AS c FROM risk_chunks"),
      q("SELECT COUNT(*)::text AS c FROM risk_obligations"),
    ]);
  return { regulations, standards, insurance_clauses, chunks, obligations };
}
