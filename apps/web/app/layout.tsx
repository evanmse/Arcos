import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export const metadata: Metadata = {
  title: "INTEGREAT — Trust infrastructure for AI agents",
  description:
    "Map AI agents against EU regulations, AI standards and insurance catalogs. Risk graph, trust score, AI liability coverage.",
  metadataBase: new URL("https://integreat.ai"),
  openGraph: {
    title: "INTEGREAT — Trust infrastructure for AI agents",
    description:
      "Three pipelines, one trust score. Map AI agents against EU regulations, standards and insurance.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
