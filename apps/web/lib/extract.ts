// Best-effort text extraction for ingest endpoints.
// Supported natively: text/plain, text/markdown, text/html, application/json.
// PDF: real extraction via `pdf-parse` (handles FlateDecode, multi-page,
// embedded fonts). Falls back to a regex-based scrape if pdf-parse fails.

function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function naivePdfText(buffer: Buffer): string {
  // Last-resort regex extractor for trivial uncompressed PDFs.
  const raw = buffer.toString("latin1");
  const out: string[] = [];
  const re = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    out.push(
      m[1]
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t"),
    );
  }
  const re2 = /\[((?:\\.|[^\]])*)\]\s*TJ/g;
  while ((m = re2.exec(raw))) {
    const inside = m[1];
    const re3 = /\(((?:\\.|[^\\)])*)\)/g;
    let m3: RegExpExecArray | null;
    while ((m3 = re3.exec(inside))) {
      out.push(m3[1]);
    }
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    // Lazy require to avoid pulling pdf-parse's debug-mode test loader.
    const mod = await import("pdf-parse");
    const pdf = (mod as any).default ?? (mod as any);
    const data = await pdf(buffer, { max: 0 });
    const text = String(data?.text ?? "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text && text.length >= 30) return text;
  } catch {
    // fall through to naive
  }
  return naivePdfText(buffer);
}

export async function extractText(
  file: { buffer: Buffer; mimeType: string; name: string },
): Promise<string> {
  const { buffer, mimeType, name } = file;
  const lowerName = name.toLowerCase();

  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".csv")
  ) {
    return buffer.toString("utf-8");
  }
  if (mimeType === "text/html" || lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
    return stripHtml(buffer.toString("utf-8"));
  }
  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return extractPdf(buffer);
  }
  return buffer.toString("utf-8");
}
