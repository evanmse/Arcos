import Link from "next/link";
import { listRegulations } from "@/lib/db";
import RegulationGraph from "@/components/app/RegulationGraph";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Regulations — INTEGREAT" };

const FALLBACK = [
  {
    regulation_id: "ai_act",
    celex: "32024R1689",
    short_name: "EU AI Act",
    title: "Regulation laying down harmonised rules on artificial intelligence",
    lang: "en",
    publication_date: "2024-07-12",
    source_url: null,
  },
  {
    regulation_id: "dora",
    celex: "32022R2554",
    short_name: "DORA",
    title: "Digital Operational Resilience Act for the financial sector",
    lang: "en",
    publication_date: "2022-12-27",
    source_url: null,
  },
  {
    regulation_id: "mica",
    celex: "32023R1114",
    short_name: "MiCA",
    title: "Markets in Crypto-Assets Regulation",
    lang: "en",
    publication_date: "2023-06-09",
    source_url: null,
  },
  {
    regulation_id: "rgpd",
    celex: "32016R0679",
    short_name: "GDPR",
    title: "General Data Protection Regulation",
    lang: "en",
    publication_date: "2016-04-27",
    source_url: null,
  },
];

export default async function RegulationsPage() {
  let rows = FALLBACK as Awaited<ReturnType<typeof listRegulations>>;
  try {
    const live = await listRegulations();
    if (live.length) rows = live;
  } catch {}
  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="pill">step 3 of 3 · ground truth</div>
        <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
          <span className="text-gradient">Regulatory</span> knowledge graph
        </h1>
        <p className="text-[13.5px] text-white/55 mt-2 max-w-[680px]">
          Each regulation is fetched live from EUR-Lex Cellar, chunked at 512 tokens, embedded with
          text-embedding-005 and decomposed by Gemini 2.5 Flash into atomic obligations. Below: a
          live visualization of how rules, obligations and standards interconnect.
        </p>
      </header>

      <RegulationGraph />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold">Browse the corpus</h2>
          <span className="text-[11.5px] text-white/45">live · EUR-Lex Cellar XHTML</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {rows.map((r) => (
            <Link
              key={r.regulation_id}
              href={`/regulations/${r.regulation_id}`}
              className="card glass-hover p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="pill">{r.celex || r.regulation_id}</span>
                <span className="text-[11px] font-mono text-white/40">{r.lang || "en"}</span>
              </div>
              <div>
                <div className="text-[16px] font-semibold tracking-tight">{r.short_name}</div>
                <div className="text-[12.5px] text-white/55 mt-1 line-clamp-3">{r.title}</div>
              </div>
              <div className="mt-auto flex items-center justify-between text-[12px] text-white/45">
                <span>
                  {r.publication_date ? new Date(r.publication_date).toLocaleDateString() : "—"}
                </span>
                <span className="text-white/65">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
