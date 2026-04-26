// Real provider ingestion. Reads access_token from user_integrations and
// pulls a small batch of documents from the provider API, then chunks +
// embeds via the existing ingestCorpDocument pipeline.
import { Pool } from "pg";
import crypto from "node:crypto";
import { ingestCorpDocument } from "./ingest";

const TENANT = "default";

export type ProviderResult = {
  document_id: string;
  title: string;
  chunks: number;
};

async function getToken(
  pool: Pool,
  userEmail: string,
  provider: string,
): Promise<{ token: string; metadata: Record<string, any> } | null> {
  const { rows } = await pool.query(
    `SELECT access_token, metadata FROM user_integrations
     WHERE user_email=$1 AND provider=$2
     ORDER BY created_at DESC LIMIT 1`,
    [userEmail, provider],
  );
  if (!rows[0]?.access_token) return null;
  return { token: rows[0].access_token, metadata: rows[0].metadata ?? {} };
}

// ---- GitHub ----
// Lists repo contents & ingests text files (.md, .yaml, .py, .ts…)
// `target` is "owner/repo" or "owner/repo/path"
export async function ingestGithub(
  pool: Pool,
  sourceId: string,
  userEmail: string,
  target: string,
  limit = 30,
): Promise<ProviderResult[]> {
  const cred = await getToken(pool, userEmail, "github");
  if (!cred) throw new Error("No GitHub token saved in Settings");
  const [owner, repo, ...rest] = target.split("/").filter(Boolean);
  if (!owner || !repo) throw new Error("Target must be owner/repo[/path]");
  const path = rest.join("/");
  const headers = {
    Authorization: `Bearer ${cred.token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "integreat-ingest",
  };

  // Recursively walk the tree (single API call)
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers },
  );
  if (!treeRes.ok) {
    throw new Error(`GitHub API error ${treeRes.status}: ${await treeRes.text()}`);
  }
  const tree = await treeRes.json();
  const ALLOWED = /\.(md|markdown|txt|yaml|yml|json|py|ts|tsx|js|jsx|go|rb|java|sql)$/i;
  const items: { path: string }[] = (tree.tree || [])
    .filter((t: any) => t.type === "blob")
    .filter((t: any) => (path ? t.path.startsWith(path) : true))
    .filter((t: any) => ALLOWED.test(t.path))
    .filter((t: any) => Number(t.size || 0) < 200_000)
    .slice(0, limit);

  const results: ProviderResult[] = [];
  for (const it of items) {
    const fileRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(it.path)}`,
      { headers },
    );
    if (!fileRes.ok) continue;
    const f = await fileRes.json();
    if (!f.content) continue;
    const text = Buffer.from(f.content, "base64").toString("utf-8");
    if (text.trim().length < 30) continue;
    const docId = "doc-" + crypto.randomBytes(6).toString("hex");
    const ghTitle = `${repo}/${it.path}`;
    const r = await ingestCorpDocument({
      pool,
      sourceId,
      documentId: docId,
      tenantId: TENANT,
      title: ghTitle,
      uri: `https://github.com/${owner}/${repo}/blob/HEAD/${it.path}`,
      mimeType: "text/plain",
      byteSize: text.length,
      text,
    });
    results.push({ document_id: docId, title: ghTitle, chunks: r.chunks });
  }
  return results;
}

// ---- Notion ----
// Lists pages via search endpoint and ingests each page's plain text.
export async function ingestNotion(
  pool: Pool,
  sourceId: string,
  userEmail: string,
  query: string,
  limit = 20,
): Promise<ProviderResult[]> {
  const cred = await getToken(pool, userEmail, "notion");
  if (!cred) throw new Error("No Notion token saved in Settings");
  const headers = {
    Authorization: `Bearer ${cred.token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  const sr = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      filter: { property: "object", value: "page" },
      page_size: Math.min(limit, 50),
    }),
  });
  if (!sr.ok) throw new Error(`Notion API error ${sr.status}: ${await sr.text()}`);
  const data = await sr.json();
  const pages: any[] = (data.results ?? []).slice(0, limit);

  const results: ProviderResult[] = [];
  for (const p of pages) {
    const title =
      Object.values(p.properties || {})
        .map((v: any) => v?.title?.[0]?.plain_text)
        .filter(Boolean)
        .join(" · ") ||
      p.url ||
      p.id;

    // Fetch blocks
    const br = await fetch(
      `https://api.notion.com/v1/blocks/${p.id}/children?page_size=100`,
      { headers },
    );
    if (!br.ok) continue;
    const blocks = await br.json();
    const text = (blocks.results || [])
      .map((b: any) => {
        const arr = b[b.type]?.rich_text || [];
        return arr.map((t: any) => t.plain_text).join("");
      })
      .filter(Boolean)
      .join("\n\n");
    if (text.trim().length < 30) continue;

    const docId = "doc-" + crypto.randomBytes(6).toString("hex");
    const r = await ingestCorpDocument({
      pool,
      sourceId,
      documentId: docId,
      tenantId: TENANT,
      title,
      uri: p.url,
      mimeType: "text/markdown",
      byteSize: text.length,
      text,
    });
    results.push({ document_id: docId, title, chunks: r.chunks });
  }
  return results;
}

// ---- Slack ----
// Pulls recent messages from a channel.
export async function ingestSlack(
  pool: Pool,
  sourceId: string,
  userEmail: string,
  channelId: string,
  limit = 200,
): Promise<ProviderResult[]> {
  const cred = await getToken(pool, userEmail, "slack");
  if (!cred) throw new Error("No Slack token saved in Settings");
  const channel = channelId || cred.metadata.channel_id;
  if (!channel) throw new Error("Channel ID required");
  const headers = { Authorization: `Bearer ${cred.token}` };
  const r = await fetch(
    `https://slack.com/api/conversations.history?channel=${encodeURIComponent(channel)}&limit=${limit}`,
    { headers },
  );
  if (!r.ok) throw new Error(`Slack API error ${r.status}`);
  const data = await r.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  const msgs: any[] = data.messages ?? [];
  if (msgs.length === 0) return [];
  const text = msgs
    .reverse()
    .map(
      (m: any) =>
        `[${new Date(Number(m.ts) * 1000).toISOString()}] ${m.user || "?"}: ${m.text || ""}`,
    )
    .join("\n");
  const docId = "doc-" + crypto.randomBytes(6).toString("hex");
  const res = await ingestCorpDocument({
    pool,
    sourceId,
    documentId: docId,
    tenantId: TENANT,
    title: `Slack #${channel} — ${msgs.length} messages`,
    uri: `slack://channel?id=${channel}`,
    mimeType: "text/plain",
    byteSize: text.length,
    text,
  });
  return [{ document_id: docId, title: `Slack #${channel}`, chunks: res.chunks }];
}

// ---- Google Drive ----
// Lists files in folder (or all) and pulls text/plain export of Google Docs.
export async function ingestDrive(
  pool: Pool,
  sourceId: string,
  userEmail: string,
  folderId: string | null,
  limit = 25,
): Promise<ProviderResult[]> {
  const cred = await getToken(pool, userEmail, "drive");
  if (!cred) throw new Error("No Google Drive token saved in Settings");
  const folder = folderId || cred.metadata.folder_id || null;
  const headers = { Authorization: `Bearer ${cred.token}` };
  const q = folder
    ? `'${folder}' in parents and trashed=false`
    : `mimeType='application/vnd.google-apps.document' and trashed=false`;
  const lr = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=${limit}&q=${encodeURIComponent(
      q,
    )}&fields=files(id,name,mimeType)`,
    { headers },
  );
  if (!lr.ok) throw new Error(`Drive API error ${lr.status}: ${await lr.text()}`);
  const list = await lr.json();
  const files: any[] = list.files ?? [];
  const results: ProviderResult[] = [];
  for (const f of files.slice(0, limit)) {
    let text = "";
    if (f.mimeType === "application/vnd.google-apps.document") {
      const er = await fetch(
        `https://www.googleapis.com/drive/v3/files/${f.id}/export?mimeType=text/plain`,
        { headers },
      );
      if (er.ok) text = await er.text();
    } else if (
      f.mimeType?.startsWith("text/") ||
      f.mimeType === "application/json"
    ) {
      const er = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, {
        headers,
      });
      if (er.ok) text = await er.text();
    } else {
      continue;
    }
    if (text.trim().length < 30) continue;
    const docId = "doc-" + crypto.randomBytes(6).toString("hex");
    const r = await ingestCorpDocument({
      pool,
      sourceId,
      documentId: docId,
      tenantId: TENANT,
      title: f.name,
      uri: `https://drive.google.com/file/d/${f.id}`,
      mimeType: f.mimeType,
      byteSize: text.length,
      text,
    });
    results.push({ document_id: docId, title: f.name, chunks: r.chunks });
  }
  return results;
}
