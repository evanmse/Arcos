"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
        <path d="M3 12 12 4l9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: "/data",
    label: "Data & Connections",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
        <ellipse cx={12} cy={5} rx={8} ry={3} />
        <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
      </svg>
    ),
    badge: "new",
  },
  {
    href: "/policies",
    label: "Policies",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
        <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      </svg>
    ),
  },
  {
    href: "/regulations",
    label: "Regulations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
        <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" />
        <path d="M4 4v12a4 4 0 0 0 4 4" />
        <path d="M8 8h8M8 12h6" />
      </svg>
    ),
  },
  {
    href: "/agents",
    label: "Agents",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
        <rect x={5} y={4} width={14} height={16} rx={3} />
        <circle cx={9} cy={10} r={1.2} fill="currentColor" />
        <circle cx={15} cy={10} r={1.2} fill="currentColor" />
        <path d="M9 15c1 1 4 1 6 0" />
        <path d="M12 1v3" />
      </svg>
    ),
    badge: "PDF",
  },
];

export function Sidebar({ user }: { user?: { email?: string | null } }) {
  const pathname = usePathname() || "";
  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col px-3 py-4 lg:flex">
      <Link href="/" className="flex items-center gap-2 px-2 pb-5">
        <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-sky-400 to-pink-400 text-[13px] font-bold text-white shadow-lg shadow-violet-500/30">
          I
        </span>
        <span className="font-semibold tracking-tight text-[15px]">INTEGREAT</span>
        <span className="pill !py-[1px] !px-2 !text-[9px] ml-1">app</span>
      </Link>

      <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
        Workspace
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active ? "active" : ""}`}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="text-[9px] uppercase tracking-wider rounded-md px-1.5 py-[1px] bg-white/[0.06] text-white/55 border border-white/[0.07]">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
        Resources
      </div>
      <nav className="flex flex-col gap-1 mt-1">
        <Link className="sidebar-link" href="/standards">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          Standards
        </Link>
        <Link className="sidebar-link" href="/insurance">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
            <path d="M12 3 4 6v6c0 4.5 3 8 8 9 5-1 8-4.5 8-9V6l-8-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          Insurance
        </Link>
        <Link className="sidebar-link" href="/evaluate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
            <path d="M11 4a7 7 0 1 0 7 7" />
            <path d="m15 9 6-6" />
            <path d="M21 9V3h-6" />
          </svg>
          Evaluate
        </Link>
      </nav>

      <div className="mt-auto pt-6">
        <div className="card p-3 text-[12px]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-sky-400 grid place-items-center text-[11px] font-semibold">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-white/80">{user?.email || "guest"}</div>
              <div className="text-white/40 text-[10.5px]">free · dev tier</div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button title="Sign out" className="text-white/40 hover:text-white text-[11px]">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.7}>
                  <path d="M15 12H3m0 0 4-4m-4 4 4 4" />
                  <path d="M9 4h8a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07090f]/70 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-5">
        <div className="flex items-center gap-2 text-[13px] text-white/55">
          <span className="text-white/35">workspace</span>
          <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="m9 6 6 6-6 6" />
          </svg>
          <span className="text-white">acme-corp</span>
        </div>
        <div className="ml-4 hidden md:flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-white/45 w-[280px]">
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.7}>
            <circle cx={11} cy={11} r={7} />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span>Search obligations, agents, policies…</span>
          <span className="ml-auto kbd">⌘K</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <button className="btn-ghost !py-1.5 !px-2.5 text-[12px]" aria-label="Notifications">
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
              <path d="M10 21a2 2 0 0 0 4 0" />
            </svg>
          </button>
          <a className="btn-primary !py-1.5 !px-3 text-[12px]" href="/agents">
            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            New report
          </a>
        </div>
      </div>
    </header>
  );
}
