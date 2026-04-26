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
    href: "/policies",
    label: "Policies",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
        <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
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
  },
  {
    href: "/reports",
    label: "Reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M9 14h6M9 17h4" />
      </svg>
    ),
  },
  {
    href: "/insurance",
    label: "Insurance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="icon">
        <path d="M12 3 4 6v6c0 4.5 3 8 8 9 5-1 8-4.5 8-9V6l-8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

export function Sidebar({ user }: { user?: { email?: string | null } }) {
  const pathname = usePathname() || "";
  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col px-3 py-4 lg:flex">
      <Link href="/" className="wm flex items-center gap-2 px-2 pb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <rect x={3.5} y={3.5} width={17} height={17} rx={3.2} />
          <path d="M8 12.2 L11 15.2 L16.5 8.8" />
        </svg>
        <span className="text-[16px] font-semibold tracking-tight">
          inte<span className="great">great</span>
        </span>
      </Link>

      <div className="px-2 pb-2 t-eyebrow">
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

      <div className="mt-6 px-2 t-eyebrow">
        Account
      </div>
      <nav className="flex flex-col gap-1 mt-1">
        <Link className="sidebar-link" href="/settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="icon">
            <circle cx={12} cy={12} r={3} />
            <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M6.7 6.7 5.3 5.3M18.7 18.7l-1.4-1.4M6.7 17.3l-1.4 1.4M18.7 5.3l-1.4 1.4" />
          </svg>
          Settings
        </Link>
      </nav>

      <div className="mt-auto pt-6">
        <div className="card p-3 text-[12px]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[var(--ink-900)] grid place-items-center text-[11px] font-semibold text-[var(--bone-50)]">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[var(--ink-800)]">{user?.email || "guest"}</div>
              <div className="text-[var(--ink-500)] text-[10.5px] t-mono">free · dev tier</div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button title="Sign out" className="text-[var(--ink-400)] hover:text-[var(--ink-900)] text-[11px]">
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
    <header className="sticky top-0 z-30 border-b border-[var(--bone-300)] bg-[rgba(250,248,244,0.78)] backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-5">
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-600)]">
          <span className="text-[var(--ink-400)]">workspace</span>
          <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="m9 6 6 6-6 6" />
          </svg>
          <span className="text-[var(--ink-900)] font-medium">acme-corp</span>
        </div>
        <div className="ml-4 hidden md:flex items-center gap-2 rounded-md border border-[var(--bone-300)] bg-[var(--bone-50)] px-2.5 py-1.5 text-[12px] text-[var(--ink-500)] w-[280px]">
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
