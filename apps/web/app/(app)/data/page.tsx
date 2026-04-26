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
    </div>
  );
}
