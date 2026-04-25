import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "INTEGREAT — Workflow tester",
  description:
    "Local UI to exercise the INTEGREAT pipeline: Policies Tree, Risk Graph, AI agent evaluation, insurance match.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <header className="border-b border-white/10 bg-ink/60 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg tracking-tight">
              INTEGREAT
              <span className="ml-2 text-xs uppercase text-white/40">
                workflow tester
              </span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/policies">Policies</Link>
              <Link href="/standards">Standards</Link>
              <Link href="/insurance">Insurance</Link>
              <Link href="/evaluate">Evaluate agent</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-white/40">
          Mock workflow — Trust Score, AI Assurance Report et AI liability
          coverage via partenaire assureur agréé. Pas de production data.
        </footer>
      </body>
    </html>
  );
}
