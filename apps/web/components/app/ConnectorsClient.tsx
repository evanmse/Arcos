"use client";
import { useEffect, useState, useRef } from "react";

type SourceKind = "drive" | "github" | "notion" | "slack" | "upload";

type Source = {
  source_id: string;
  kind: SourceKind;
  name: string;
  status: string;
  documents: number;
  chunks: number;
  created_at: string;
};

const KIND_LABEL: Record<SourceKind, string> = {
  drive: "Google Drive",
  github: "GitHub",
  notion: "Notion",
  slack: "Slack",
  upload: "Direct upload",
};

export default function ConnectorsClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [openKind, setOpenKind] = useState<SourceKind | null>(null);
  const [busySource, setBusySource] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/sources", { cache: "no-store" });
      const data = await r.json();
      setSources(data.sources || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const totalDocs = sources.reduce((s, x) => s + (x.documents || 0), 0);
  const totalChunks = sources.reduce((s, x) => s + (x.chunks || 0), 0);
  const lastSync = sources[0]?.created_at;

  return (
    <>
      <div className="card-elevated p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Connected sources" value={sources.length.toString()} tone="emerald" />
          <Stat label="Documents indexed" value={totalDocs.toLocaleString()} tone="sky" />
          <Stat label="Embedding chunks" value={totalChunks.toLocaleString()} tone="violet" />
          <Stat
            label="Last sync"
            value={
              lastSync
                ? new Date(lastSync).toISOString().slice(0, 16).replace("T", " ") + "Z"
                : "—"
            }
            tone="pink"
          />
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] uppercase tracking-[0.14em] text-white/45">
            Available connectors
          </h2>
          <span className="text-[11px] text-white/35">
            All ingest into Cloud SQL pgvector via Vertex text-embedding-005
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(["drive", "github", "notion", "slack", "upload"] as SourceKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setOpenKind(k)}
              className="card p-4 flex items-start gap-3 text-left hover:border-white/20 transition"
            >
              <div className="h-10 w-10 rounded-lg bg-white/[0.04] border border-white/[0.06] grid place-items-center shrink-0">
                <Logo kind={k} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14.5px] font-semibold">{KIND_LABEL[k]}</span>
                  <span className="chip">connect</span>
                </div>
                <div className="text-[12px] text-white/55 mt-1">{descriptionFor(k)}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] uppercase tracking-[0.14em] text-white/45">
            Active sources
          </h2>
          <button
            onClick={refresh}
            className="btn-ghost !py-1.5 !px-3 text-[11.5px]"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {sources.length === 0 ? (
          <div className="card p-5 text-[12.5px] text-white/55">
            No connected source yet. Pick a connector above to start feeding the corpus.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((s) => (
              <div key={s.source_id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Logo kind={s.kind} />
                  <span className="text-[14.5px] font-semibold">{s.name}</span>
                  <span className="chip chip-emerald ml-auto">{s.status}</span>
                </div>
                <div className="text-[11.5px] font-mono text-white/45 truncate">
                  {KIND_LABEL[s.kind]} · {s.source_id}
                </div>
                <div className="text-[12px] text-white/65">
                  {s.documents} document{s.documents > 1 ? "s" : ""} ·{" "}
                  {s.chunks.toLocaleString()} embedding chunks
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <button
                    className="btn-ghost !py-1.5 !px-3 text-[11.5px]"
                    onClick={() => setBusySource(s.source_id)}
                  >
                    Add documents
                  </button>
                  {s.kind !== "upload" && (
                    <button
                      className="btn-primary !py-1.5 !px-3 text-[11.5px]"
                      onClick={async () => {
                        const examples: Record<string, string> = {
                          github: "owner/repo or owner/repo/path",
                          notion: "search query (matches your shared pages)",
                          slack: "channel ID (e.g. C0XXXXXX)",
                          drive: "folder ID (optional, leave blank for all docs)",
                        };
                        const target = prompt(
                          `Sync ${s.name} via ${KIND_LABEL[s.kind]} API\n\n${examples[s.kind] ?? ""}`,
                          "",
                        );
                        if (target === null) return;
                        const res = await fetch("/api/sources/sync", {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            source_id: s.source_id,
                            provider: s.kind,
                            target,
                          }),
                        });
                        const d = await res.json().catch(() => ({}));
                        if (res.ok) {
                          setToast(
                            `Synced ${d.ingested?.length ?? 0} documents · ${
                              d.total_chunks ?? 0
                            } chunks`,
                          );
                          setTimeout(() => setToast(null), 4000);
                          refresh();
                        } else {
                          alert(
                            "Sync failed: " +
                              (d.details ||
                                d.error ||
                                "Make sure you saved a token in Settings."),
                          );
                        }
                      }}
                    >
                      Sync from API
                    </button>
                  )}
                  <button
                    className="btn-ghost !py-1.5 !px-3 text-[11.5px] text-red-300 ml-auto"
                    onClick={async () => {
                      if (!confirm(`Disconnect ${s.name}?`)) return;
                      await fetch(`/api/sources?source_id=${s.source_id}`, {
                        method: "DELETE",
                      });
                      refresh();
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {openKind && (
        <ConnectModal
          kind={openKind}
          onClose={() => {
            setOpenKind(null);
            refresh();
          }}
          onToast={(t) => {
            setToast(t);
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}
      {busySource && (
        <UploadModal
          sourceId={busySource}
          onClose={() => {
            setBusySource(null);
            refresh();
          }}
          onToast={(t) => {
            setToast(t);
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 card-elevated p-3 px-4 text-[12.5px] border border-emerald-500/40">
          {toast}
        </div>
      )}
    </>
  );
}

function descriptionFor(k: SourceKind): string {
  switch (k) {
    case "drive":
      return "Drop policies, DPIAs, model cards, training-data inventories.";
    case "github":
      return "Index repositories: prompts, agent code, model configs.";
    case "notion":
      return "Sync internal AI governance pages, runbooks, decision records.";
    case "slack":
      return "Capture #ai-incidents threads as audit-ready evidence.";
    case "upload":
      return "Direct upload of PDF, Markdown, txt or JSON files (no OAuth).";
  }
}

function ConnectModal({
  kind,
  onClose,
  onToast,
}: {
  kind: SourceKind;
  onClose: () => void;
  onToast: (s: string) => void;
}) {
  const [name, setName] = useState(`${KIND_LABEL[kind]} (workspace)`);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [pasted, setPasted] = useState("");
  const [results, setResults] = useState<any | null>(null);

  const create = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, name }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "failed");
      setCreatedId(data.source_id);
      onToast(`${KIND_LABEL[kind]} connected`);
    } catch (e: any) {
      onToast(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const ingestFiles = async () => {
    if (!createdId) return;
    setBusy(true);
    try {
      if (files && files.length > 0) {
        const fd = new FormData();
        for (let i = 0; i < files.length; i++) fd.append("files", files[i]);
        const r = await fetch(`/api/sources/ingest?source_id=${createdId}`, {
          method: "POST",
          body: fd,
        });
        const data = await r.json();
        setResults(data);
      } else if (pasted.trim().length > 30) {
        const r = await fetch(`/api/sources/ingest?source_id=${createdId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: `${KIND_LABEL[kind]} note`, text: pasted }),
        });
        const data = await r.json();
        setResults(data);
      }
    } catch (e: any) {
      onToast(`Ingest error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={`Connect ${KIND_LABEL[kind]}`} onClose={onClose}>
      {!createdId ? (
        <>
          <p className="text-[12.5px] text-white/55 mb-3">
            {kind === "drive" || kind === "github" || kind === "notion" || kind === "slack" ? (
              <>
                OAuth flows for {KIND_LABEL[kind]} are pending the production setup. For the demo
                we register the source and let you push representative documents directly — they
                land in the same Cloud SQL <code>corp_chunks</code> + Vertex embedding pipeline.
              </>
            ) : (
              <>Upload internal documents (PDF, Markdown, txt, JSON, HTML).</>
            )}
          </p>
          <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">
            Source name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full input"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy} onClick={create}>
              {busy ? "Connecting…" : "Connect"}
            </button>
          </div>
        </>
      ) : (
        <UploadBody
          createdId={createdId}
          files={files}
          setFiles={setFiles}
          pasted={pasted}
          setPasted={setPasted}
          busy={busy}
          ingest={ingestFiles}
          results={results}
          onClose={onClose}
        />
      )}
    </ModalShell>
  );
}

function UploadModal({
  sourceId,
  onClose,
  onToast,
}: {
  sourceId: string;
  onClose: () => void;
  onToast: (s: string) => void;
}) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const ingest = async () => {
    setBusy(true);
    try {
      if (files && files.length > 0) {
        const fd = new FormData();
        for (let i = 0; i < files.length; i++) fd.append("files", files[i]);
        const r = await fetch(`/api/sources/ingest?source_id=${sourceId}`, {
          method: "POST",
          body: fd,
        });
        setResults(await r.json());
      } else if (pasted.trim().length > 30) {
        const r = await fetch(`/api/sources/ingest?source_id=${sourceId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "pasted note", text: pasted }),
        });
        setResults(await r.json());
      }
    } catch (e: any) {
      onToast(`Ingest error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Add documents" onClose={onClose}>
      <UploadBody
        createdId={sourceId}
        files={files}
        setFiles={setFiles}
        pasted={pasted}
        setPasted={setPasted}
        busy={busy}
        ingest={ingest}
        results={results}
        onClose={onClose}
      />
    </ModalShell>
  );
}

function UploadBody(props: {
  createdId: string;
  files: FileList | null;
  setFiles: (f: FileList | null) => void;
  pasted: string;
  setPasted: (s: string) => void;
  busy: boolean;
  ingest: () => void;
  results: any;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-3">
      <div
        className="border border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-white/30 transition"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.md,.txt,.json,.csv,.html,.htm"
          onChange={(e) => props.setFiles(e.target.files)}
        />
        <div className="text-[13px] text-white/75">
          {props.files && props.files.length > 0
            ? `${props.files.length} file(s) selected`
            : "Click to choose files (PDF, MD, TXT, JSON, CSV, HTML)"}
        </div>
        <div className="text-[11px] text-white/40 mt-1">
          Files are chunked, embedded with Vertex text-embedding-005 and persisted in pgvector.
        </div>
      </div>
      <div className="text-[10.5px] uppercase tracking-[0.12em] text-white/45">
        Or paste text
      </div>
      <textarea
        value={props.pasted}
        onChange={(e) => props.setPasted(e.target.value)}
        rows={4}
        placeholder="Paste a policy excerpt, runbook section, model card…"
        className="input"
      />
      <div className="flex justify-end gap-2 mt-1">
        <button className="btn-ghost" onClick={props.onClose}>
          Done
        </button>
        <button
          className="btn-primary"
          disabled={props.busy}
          onClick={props.ingest}
        >
          {props.busy ? "Embedding…" : "Ingest"}
        </button>
      </div>
      {props.results && (
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-[11.5px] mt-1">
          <div className="text-emerald-300">
            ✓ {(props.results.ingested || []).length} document(s) ingested
          </div>
          {(props.results.ingested || []).map((r: any) => (
            <div key={r.document_id} className="text-white/65 mt-1">
              {r.title} → {r.chunks} chunks
            </div>
          ))}
          {(props.results.errors || []).length > 0 && (
            <div className="text-amber-300 mt-2">
              {(props.results.errors as any[]).map((e, i) => (
                <div key={i}>
                  ⚠ {e.name}: {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="card-elevated p-5 w-full max-w-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-white/45 hover:text-white text-xl">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className={`text-[22px] font-semibold tabular mt-1 text-${tone}-300`}>{value}</div>
    </div>
  );
}

function Logo({ kind }: { kind: SourceKind }) {
  if (kind === "drive")
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
        <path d="M7.5 4h9l5.5 9.5L17 22H7L1.5 13.5 7.5 4z" fill="#fbbc04" opacity={0.85} />
        <path d="M7.5 4 1.5 13.5 7 22l5.5-9.5L7.5 4z" fill="#1a73e8" opacity={0.85} />
        <path d="M16.5 4h-9l5 8.5h9L16.5 4z" fill="#34a853" opacity={0.85} />
      </svg>
    );
  if (kind === "github")
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
      </svg>
    );
  if (kind === "notion")
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
        <rect x={3} y={3} width={18} height={18} rx={3} fill="white" opacity={0.9} />
        <text x={12} y={16} textAnchor="middle" fontSize={11} fontWeight={700} fill="black">
          N
        </text>
      </svg>
    );
  if (kind === "slack")
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
        <rect x={2} y={10} width={6} height={4} rx={2} fill="#36c5f0" />
        <rect x={10} y={2} width={4} height={6} rx={2} fill="#2eb67d" />
        <rect x={16} y={10} width={6} height={4} rx={2} fill="#ecb22e" />
        <rect x={10} y={16} width={4} height={6} rx={2} fill="#e01e5a" />
      </svg>
    );
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} fill="none">
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}
