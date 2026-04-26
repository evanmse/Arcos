import ConnectorsClient from "@/components/app/ConnectorsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data & Connections — INTEGREAT" };

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
            Bring your enterprise context inside the trust pipeline. Connect Drive, GitHub, Notion
            or Slack — INTEGREAT chunks, embeds with Vertex text-embedding-005 and feeds the
            scoring engine. Every document is searchable from the agent evaluation step.
          </p>
        </div>
      </header>

      <ConnectorsClient />

      <section className="card p-6 mt-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Pipeline</div>
        <h2 className="text-[18px] font-semibold mt-1">What happens after you connect</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
          {[
            {
              t: "Ingest",
              d: "PDFs/MD/HTML are parsed and chunked at ~3.5K chars with overlap.",
              k: "violet",
            },
            {
              t: "Embed",
              d: "Vertex text-embedding-005 (768d) — stored in Cloud SQL pgvector.",
              k: "sky",
            },
            {
              t: "Map",
              d: "Each chunk is RAG-matched against AI Act / DORA / MiCA / GDPR obligations.",
              k: "pink",
            },
            {
              t: "Score",
              d: "Trust score per agent + matching insurance clauses (MunichRe, Hiscox).",
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
