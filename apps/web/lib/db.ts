// Postgres read-only client for the INTEGREAT web frontend.
// Uses pg + Cloud SQL connector (unix socket /cloudsql/<conn>).
import { Pool } from "pg";

let _pool: Pool | null = null;

export function getPool(): Pool {
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
  domain: string[] | string | null;
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
  const params: unknown[] = [regulationId];
  let where = "regulation_id = $1";
  if (articleNumber) {
    params.push(articleNumber);
    where += " AND article_number = $2";
  }
  const { rows } = await getPool().query<ObligationRow>(
    `SELECT id AS obligation_id,
            source_type,
            source_id,
            article_number AS ref,
            text,
            sanction AS sanction_max,
            deadline,
            applicable_to,
            risk_categories,
            COALESCE(dimension, 'LEGAL') AS dimension,
            domain
     FROM risk_obligations
     WHERE ${where}
     ORDER BY article_number, id`,
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

export type RegulationCoverage = {
  regulation_id: string;
  short_name: string;
  articles: number;
  chunks: number;
  obligations: number;
  last_ingest: string | null;
};

export async function listRegulationCoverage(): Promise<RegulationCoverage[]> {
  const pool = getPool();
  try {
    const { rows } = await pool.query<{
      regulation_id: string;
      short_name: string;
      articles: string;
      chunks: string;
      obligations: string;
      last_ingest: string | null;
    }>(
      `SELECT r.regulation_id,
              r.short_name,
              COALESCE(c.articles, 0)::text  AS articles,
              COALESCE(c.chunks,   0)::text  AS chunks,
              COALESCE(o.obligations, 0)::text AS obligations,
              c.last_ingest
       FROM regulations r
       LEFT JOIN (
         SELECT regulation_id,
                COUNT(DISTINCT article_number) AS articles,
                COUNT(*) AS chunks,
                MAX(indexed_at)::text AS last_ingest
         FROM risk_chunks
         WHERE source_type='regulation'
         GROUP BY regulation_id
       ) c ON c.regulation_id = r.regulation_id
       LEFT JOIN (
         SELECT regulation_id, COUNT(*) AS obligations
         FROM risk_obligations
         GROUP BY regulation_id
       ) o ON o.regulation_id = r.regulation_id
       ORDER BY r.regulation_id`,
    );
    return rows.map((r) => ({
      regulation_id: r.regulation_id,
      short_name: r.short_name,
      articles: Number(r.articles),
      chunks: Number(r.chunks),
      obligations: Number(r.obligations),
      last_ingest: r.last_ingest,
    }));
  } catch {
    return [];
  }
}

export type DimensionCount = { dimension: string; count: number };

export async function loadDimensionDistribution(): Promise<DimensionCount[]> {
  try {
    const { rows } = await getPool().query<{ dimension: string; c: string }>(
      `SELECT COALESCE(NULLIF(dimension, ''), 'LEGAL') AS dimension,
              COUNT(*)::text AS c
       FROM risk_obligations
       GROUP BY 1
       ORDER BY 2 DESC NULLS LAST`,
    );
    return rows.map((r) => ({ dimension: r.dimension, count: Number(r.c) }));
  } catch {
    return [];
  }
}

export type RiskCategoryCount = { category: string; count: number };

export async function loadRiskCategoryDistribution(): Promise<RiskCategoryCount[]> {
  try {
    const { rows } = await getPool().query<{ category: string; c: string }>(
      `SELECT category, COUNT(*)::text AS c
       FROM (
         SELECT jsonb_array_elements_text(risk_categories::jsonb) AS category
         FROM risk_obligations
         WHERE risk_categories IS NOT NULL
       ) t
       GROUP BY category
       ORDER BY 2 DESC NULLS LAST
       LIMIT 8`,
    );
    return rows.map((r) => ({ category: r.category, count: Number(r.c) }));
  } catch {
    return [];
  }
}

