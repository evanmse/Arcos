import ReportsClient from "@/components/app/ReportsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — Integreat" };

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <span className="pill">history</span>
        <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
          Analysis reports
        </h1>
        <p className="text-[13.5px] mt-2 max-w-[680px]" style={{ color: "var(--ink-500)" }}>
          Every agent analysis ever run in this workspace, with full findings, risk matrix, matched
          obligations & policies, and the executive report. Exportable as a signed PDF.
        </p>
      </header>
      <ReportsClient />
    </div>
  );
}
