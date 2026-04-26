import { ReactNode } from "react";
import { cookies } from "next/headers";
import { Sidebar, Topbar } from "@/components/app/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  const session = cookies().get("integreat_session")?.value;
  const email = session ? decodeURIComponent(session.split(":")[0] || "") : null;
  return (
    <div className="app-bg min-h-screen">
      <Sidebar user={{ email }} />
      <div className="lg:pl-[248px]">
        <Topbar />
        <main className="px-5 py-6 lg:px-8 lg:py-8 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
