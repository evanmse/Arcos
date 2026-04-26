"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "en" | "fr" | "de" | "es";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readCookie("integreat_lang") as Lang | null;
    if (stored && LANGS.some((l) => l.code === stored)) setLang(stored);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(code: Lang) {
    setLang(code);
    document.cookie = `integreat_lang=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setOpen(false);
  }

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost !py-1.5 !px-2.5 text-[12px] flex items-center gap-1.5"
        aria-label="Change language"
        aria-expanded={open}
      >
        <span className="text-[14px] leading-none">{current.flag}</span>
        <span className="hidden sm:inline uppercase tracking-wide text-white/65">
          {current.code}
        </span>
        <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 mt-1.5 w-44 rounded-lg border border-white/10 bg-[#0b0e15]/95 backdrop-blur-xl shadow-xl shadow-black/40 py-1 z-50">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-white/[0.05] ${
                l.code === lang ? "text-white" : "text-white/70"
              }`}
            >
              <span className="text-[14px] leading-none">{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang ? (
                <svg
                  className="ml-auto text-violet-300"
                  viewBox="0 0 24 24"
                  width={12}
                  height={12}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              ) : null}
            </button>
          ))}
          <div className="border-t border-white/[0.06] mt-1 pt-1.5 px-3 pb-1.5 text-[10.5px] text-white/40 leading-relaxed">
            Translation rolling out — UI strings are progressively localized.
          </div>
        </div>
      ) : null}
    </div>
  );
}
