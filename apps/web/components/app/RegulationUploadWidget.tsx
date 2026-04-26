"use client";
import { useEffect, useRef, useState } from "react";

type Upload = {
  upload_id: string;
  title: string;
  mime_type: string | null;
  byte_size: number | null;
  chunks: number;
  created_at: string;
};

export default function RegulationUploadWidget({
  regulationId,
}: {
  regulationId: string;
}) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/regulations/${regulationId}/uploads`, {
        cache: "no-store",
      });
      const data = await r.json();
      setUploads(data.uploads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [regulationId]);

  const onPick = () => inputRef.current?.click();

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) fd.append("files", files[i]);
      const r = await fetch(`/api/regulations/${regulationId}/uploads`, {
        method: "POST",
        body: fd,
      });
      const data = await r.json();
      setResults(data);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const onUrlIngest = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/regulations/${regulationId}/uploads`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await r.json();
      setResults(data);
      setUrl("");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="pill">Train on your context</span>
          <h3 className="mt-2 text-[16px] font-semibold">
            Upload supplementary PDFs / texts
          </h3>
          <p className="text-[12.5px] text-white/55 mt-1 max-w-xl">
            Add internal interpretations, regulator Q&amp;A, ESMA/EBA Level 2 RTS, or your own
            compliance memos. They are chunked, embedded with Vertex text-embedding-005 and
            queried alongside the official text during agent evaluation.
          </p>
        </div>
        <button
          onClick={onPick}
          disabled={busy}
          className="btn-primary !py-2 !px-3.5 text-[12.5px] shrink-0"
        >
          {busy ? "Embedding…" : "+ Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.md,.txt,.html,.htm,.json"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-2">
        <input
          className="input flex-1"
          placeholder="Add a juridical link (EUR-Lex, ESMA, EBA, ANSSI, EUR-OPS Q&A, RTS PDF…) https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="btn-ghost !py-2 !px-3.5 text-[12.5px]"
          onClick={onUrlIngest}
          disabled={busy || !url.trim()}
        >
          {busy ? "Fetching…" : "Ingest URL"}
        </button>
      </div>

      {loading ? (
        <div className="text-[12px] text-white/45">Loading…</div>
      ) : uploads.length === 0 ? (
        <div className="text-[12.5px] text-white/55">
          No supplementary document yet for this regulation.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {uploads.map((u) => (
            <div
              key={u.upload_id}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium truncate">{u.title}</span>
                <span className="chip ml-auto">{u.chunks} chunks</span>
              </div>
              <div className="text-[11px] text-white/45 mt-1 font-mono">
                {u.mime_type || "—"} · {u.byte_size ? Math.round(u.byte_size / 1024) + " KB" : "?"} ·{" "}
                {new Date(u.created_at).toISOString().slice(0, 10)}
              </div>
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-[11.5px] mt-3">
          <div className="text-emerald-300">
            ✓ {(results.ingested || []).length} document(s) ingested
          </div>
          {(results.errors || []).map((e: any, i: number) => (
            <div key={i} className="text-amber-300">
              ⚠ {e.name}: {e.error}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
