export const metadata = { title: "Data & Connections — INTEGREAT" };

type Connector = {
  id: string;
  name: string;
  desc: string;
  status: "connected" | "available" | "soon";
  count?: string;
  category: "docs" | "code" | "ops" | "data";
  logo: React.ReactNode;
};

const CONNECTORS: Connector[] = [
  {
    id: "gdrive",
    name: "Google Drive",
    desc: "Index policies, DPIAs, model cards from your shared drives.",
    status: "available",
    category: "docs",
    logo: <DriveLogo />,
  },
  {
    id: "github",
    name: "GitHub",
    desc: "Scan repositories for AI model code, prompts and configs.",
    status: "available",
    category: "code",
    logo: <GitHubLogo />,
  },
  {
    id: "jira",
    name: "Jira",
    desc: "Pull risk tickets, audit findings and remediation plans.",
    status: "available",
    category: "ops",
    logo: <JiraLogo />,
  },
  {
    id: "slack",
    name: "Slack",
    desc: "Capture #ai-incidents and route alerts to the right channel.",
    status: "available",
    category: "ops",
    logo: <SlackLogo />,
  },
  {
    id: "notion",
    name: "Notion",
    desc: "Sync internal AI policies, governance pages and runbooks.",
    status: "available",
    category: "docs",
    logo: <NotionLogo />,
  },
  {
    id: "snowflake",
    name: "Snowflake",
    desc: "Read-only role over training-data catalogs and lineage.",
    status: "soon",
    category: "data",
    logo: <SnowflakeLogo />,
  },
  {
    id: "bigquery",
    name: "BigQuery",
    desc: "Audit logs, embeddings, evaluation metrics datasets.",
    status: "available",
    category: "data",
    logo: <BqLogo />,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    desc: "Detect open-source models, licenses, model cards.",
    status: "available",
    category: "code",
    logo: <HfLogo />,
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "Track API usage, fine-tunes and assistant configs.",
    status: "available",
    category: "code",
    logo: <OpenAiLogo />,
  },
];

const CATEGORIES: { id: Connector["category"]; label: string }[] = [
  { id: "docs", label: "Documents" },
  { id: "code", label: "Code & models" },
  { id: "ops", label: "Operations" },
  { id: "data", label: "Data warehouse" },
];

export default function DataPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="pill">step 1 of 3 · ingest</div>
          <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
            Data &amp; <span className="text-gradient">Connections</span>
          </h1>
          <p className="text-[13.5px] text-white/55 mt-2 max-w-[640px]">
            Bring your enterprise context inside the trust pipeline. Connect documents, code and
            operational tools — INTEGREAT will fingerprint AI usage, extract assets and feed the
            scoring engine.
          </p>
        </div>
        <button className="btn-primary !py-2 !px-4">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          New connection
        </button>
      </header>

      {/* live state strip */}
      <div className="card-elevated p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Connected sources" value="2" tone="emerald" />
          <Stat label="Assets indexed" value="3 412" tone="sky" />
          <Stat label="Agents detected" value="7" tone="violet" />
          <Stat label="Last sync" value="2m ago" tone="pink" />
        </div>
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat.id}>
          <h2 className="text-[12px] uppercase tracking-[0.14em] text-white/45 mb-3">{cat.label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {CONNECTORS.filter((c) => c.category === cat.id).map((c) => (
              <ConnectorCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      ))}

      {/* Pipeline visual */}
      <section className="card p-6 mt-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Pipeline</div>
        <h2 className="text-[18px] font-semibold mt-1">What happens after you connect</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
          {[
            {
              t: "Ingest",
              d: "Pulled via OAuth, hashed and chunked at 512 tokens with paragraph anchors.",
              k: "violet",
            },
            {
              t: "Embed",
              d: "Vertex text-embedding-005 (768d) — stored in Cloud SQL pgvector.",
              k: "sky",
            },
            {
              t: "Extract",
              d: "Gemini 2.5 Flash detects AI assets, prompts, models, sensitive flows.",
              k: "pink",
            },
            {
              t: "Score",
              d: "RAG against regulations + standards → trust score per agent.",
              k: "amber",
            },
          ].map((s, i) => (
            <div key={s.t} className="card p-4 relative">
              <div className="text-[10.5px] font-mono text-white/40">step {i + 1}</div>
              <div className="text-[15px] font-semibold mt-1">{s.t}</div>
              <div className="text-[12.5px] text-white/55 mt-1.5">{s.d}</div>
              <div className={`mt-3 h-[3px] rounded-full bg-gradient-to-r from-${s.k}-400 to-transparent`} />
            </div>
          ))}
        </div>
      </section>
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

function ConnectorCard({ c }: { c: Connector }) {
  const isConn = c.status === "connected";
  const isSoon = c.status === "soon";
  return (
    <div className={`card p-4 flex flex-col gap-3 ${isConn ? "border-emerald-500/30" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-white/[0.04] border border-white/[0.06] grid place-items-center shrink-0">
          {c.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14.5px] font-semibold">{c.name}</span>
            {isConn ? <span className="chip chip-emerald">connected</span> : null}
            {isSoon ? <span className="chip chip-amber">soon</span> : null}
          </div>
          <div className="text-[12px] text-white/55 mt-1">{c.desc}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-white/40 font-mono">{c.count ?? "—"}</span>
        {isConn ? (
          <button className="btn-ghost !py-1.5 !px-3 text-[11.5px]">Manage</button>
        ) : isSoon ? (
          <button className="btn-ghost !py-1.5 !px-3 text-[11.5px] opacity-60" disabled>
            Notify me
          </button>
        ) : (
          <button className="btn-primary !py-1.5 !px-3 text-[11.5px]">Connect</button>
        )}
      </div>
    </div>
  );
}

/* =========== Brand-ish logos (simplified, no copyright marks) =========== */
function DriveLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path d="M7.5 4h9l5.5 9.5L17 22H7L1.5 13.5 7.5 4z" fill="#fbbc04" opacity={0.85} />
      <path d="M7.5 4 1.5 13.5 7 22l5.5-9.5L7.5 4z" fill="#1a73e8" opacity={0.85} />
      <path d="M16.5 4h-9l5 8.5h9L16.5 4z" fill="#34a853" opacity={0.85} />
    </svg>
  );
}
function GitHubLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
function JiraLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path d="M11.5 2 4 9.5l3 3 4.5-4.5 4.5 4.5 3-3L11.5 2z" fill="#2684ff" />
      <path d="M11.5 22 19 14.5l-3-3-4.5 4.5L7 11.5l-3 3L11.5 22z" fill="#2684ff" opacity={0.6} />
    </svg>
  );
}
function SlackLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <rect x={2} y={10} width={6} height={4} rx={2} fill="#36c5f0" />
      <rect x={10} y={2} width={4} height={6} rx={2} fill="#2eb67d" />
      <rect x={16} y={10} width={6} height={4} rx={2} fill="#ecb22e" />
      <rect x={10} y={16} width={4} height={6} rx={2} fill="#e01e5a" />
    </svg>
  );
}
function NotionLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x={3} y={3} width={18} height={18} rx={3} fill="white" opacity={0.9} />
      <text x={12} y={16} textAnchor="middle" fontSize={11} fontWeight={700} fill="black">N</text>
    </svg>
  );
}
function SnowflakeLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" stroke="#29b5e8" strokeWidth={1.5} fill="none">
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
    </svg>
  );
}
function BqLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <circle cx={12} cy={12} r={8} fill="#4285f4" opacity={0.85} />
      <path d="M11 8v5l3.5 2" stroke="white" strokeWidth={1.6} fill="none" />
    </svg>
  );
}
function HfLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <circle cx={12} cy={13} r={8} fill="#ffd21e" />
      <circle cx={9} cy={12} r={1.2} fill="#222" />
      <circle cx={15} cy={12} r={1.2} fill="#222" />
      <path d="M9 16c1 1 4 1 6 0" stroke="#222" strokeWidth={1.4} fill="none" />
    </svg>
  );
}
function OpenAiLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" stroke="#10a37f" strokeWidth={1.5} fill="none">
      <path d="M12 3a4 4 0 0 1 4 4v3l-4 2-4-2V7a4 4 0 0 1 4-4z" />
      <path d="M5 9.5a4 4 0 0 1 2-3.5l3 1.5v4l-3.5 2L5 11.5z" />
      <path d="M5 14.5 8.5 13l3.5 2v4l-3 1.5a4 4 0 0 1-4-3.5z" />
      <path d="M19 14.5a4 4 0 0 1-2 3.5l-3-1.5v-4l3.5-2z" />
      <path d="M19 9.5 15.5 11 12 9V5l3-1.5a4 4 0 0 1 4 3.5z" />
    </svg>
  );
}
