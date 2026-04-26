import SettingsClient from "@/components/app/SettingsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — INTEGREAT" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="pill">account</div>
        <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
          Workspace <span className="text-gradient">settings</span>
        </h1>
        <p className="text-[13.5px] text-white/55 mt-2 max-w-[680px]">
          Manage your profile, password and provider credentials. Integration tokens are stored
          server-side and used to call provider APIs on your behalf for ingestion.
        </p>
      </header>
      <SettingsClient />
    </div>
  );
}
