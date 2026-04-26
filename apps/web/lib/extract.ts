// Best-effort text extraction for ingest endpoints.
// Supported natively: text/plain, text/markdown, text/html, application/json.
// PDF: we try to pull plain ASCII strings out of the PDF; if extraction yields
// less than 200 chars we ask the user to provide text instead.

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
  // Extract literal strings inside `( ... )` PDF text objects.
  // Works for un-encrypted, non-CID PDFs (most reports/forms).
  const raw = buffer.toString("latin1");
  const out: string[] = [];
  const re = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const s = m[1]
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t");
    out.push(s);
  }
  // TJ arrays: `[ (foo) -200 (bar) ] TJ`
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
    return naivePdfText(buffer);
  }
  // Fallback: treat as utf-8 text.
  return buffer.toString("utf-8");
}
