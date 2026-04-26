// Minimal Vertex AI client using Cloud Run's metadata-server identity token.
// Avoids pulling the @google-cloud/* SDK (saves ~30 MB on the image).
const PROJECT = process.env.GCP_PROJECT_ID || "integreat-dev";
const REGION = process.env.GCP_REGION || "europe-west1";
const EMBED_MODEL = process.env.VERTEX_EMBEDDING_MODEL || "text-embedding-005";
const LLM_MODEL = process.env.VERTEX_LLM_MODEL || "gemini-2.5-pro";

let _tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 60_000) {
    return _tokenCache.token;
  }
  const url =
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";
  const r = await fetch(url, {
    headers: { "Metadata-Flavor": "Google" },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`metadata token failed: ${r.status}`);
  const data = (await r.json()) as { access_token: string; expires_in: number };
  _tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const token = await getAccessToken();
  const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/${EMBED_MODEL}:predict`;
  // Vertex caps at ~20K tokens/request; chunk client-side defensively.
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 5) {
    const batch = texts.slice(i, i + 5).map((t) => ({
      content: t.length > 30000 ? t.slice(0, 30000) : t,
    }));
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: batch,
        parameters: { outputDimensionality: 768 },
      }),
    });
    if (!r.ok) {
      const body = await r.text();
      throw new Error(`vertex embed failed ${r.status}: ${body.slice(0, 200)}`);
    }
    const data = (await r.json()) as {
      predictions: Array<{ embeddings: { values: number[] } }>;
    };
    for (const p of data.predictions) out.push(p.embeddings.values);
  }
  return out;
}

export async function generateText(prompt: string, opts?: { jsonMode?: boolean }): Promise<string> {
  const token = await getAccessToken();
  const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/${LLM_MODEL}:generateContent`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        ...(opts?.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`vertex llm failed ${r.status}: ${body.slice(0, 200)}`);
  }
  const data = (await r.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export const VERTEX_LLM_MODEL = LLM_MODEL;
export const VERTEX_EMBED_MODEL = EMBED_MODEL;
