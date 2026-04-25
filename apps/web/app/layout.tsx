import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export const metadata: Metadata = {
  title: "INTEGREAT — Trust infrastructure for AI agents",
  description:
    "Map AI agents against EU regulations, AI standards and insurance catalogs. Risk graph, trust score, AI liability coverage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="grid-backdrop relative font-sans">
        <div className="relative z-10">
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07090f]/70 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-6 py-3.5 flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 via-sky-400 to-pink-400 text-[12px] font-bold text-white shadow-lg shadow-violet-500/30">I</span>
                <span className="text-[15px]">INTEGREAT</span>
                <span className="pill !py-[2px] !px-2 !text-[9px]">dev</span>
              </Link>
              <nav className="ml-2 hidden md:flex gap-1 text-[13px] text-white/60">
                <NavLink href="/regulations">Regulations</NavLink>
                <NavLink href="/standards">Standards</NavLink>
                <NavLink href="/insurance">Insurance</NavLink>
                <NavLink href="/policies">Policies</NavLink>
                <NavLink href="/evaluate">Evaluate</NavLink>
              </nav>
              <div className="ml-auto flex items-center gap-2">
                <a href="https://github.com/evanmse/integreat" className="btn-ghost" target="_blank" rel="noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
                  </svg>
                  Source
                </a>
                <Link href="/evaluate" className="btn-primary">
                  Evaluate agent
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
          <footer className="mx-auto max-w-7xl px-6 py-10">
            <div className="divider-glow mb-6" />
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-white/40">
              <div>© 2026 Integreat — built on Cloud Run, Cloud SQL pgvector, Vertex AI Vector Search.</div>
              <div className="font-mono">europe-west1 · gemini-2.5-flash · text-embedding-005</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-1.5 hover:bg-white/[0.05] hover:text-white transition">
      {children}
    </Link>
  );
}
