import type { Config } from "tailwindcss";

const COLORS = ["violet", "sky", "pink", "amber", "emerald", "rose", "cyan", "fuchsia", "orange"];
const SHADES = ["300", "400", "500"];
const safelist: string[] = [];
for (const c of COLORS) {
  for (const s of SHADES) {
    safelist.push(`bg-${c}-${s}`);
    safelist.push(`text-${c}-${s}`);
    safelist.push(`border-${c}-${s}`);
    safelist.push(`from-${c}-${s}`);
    safelist.push(`to-${c}-${s}`);
    safelist.push(`bg-${c}-${s}/10`);
    safelist.push(`bg-${c}-${s}/20`);
    safelist.push(`bg-${c}-${s}/25`);
    safelist.push(`bg-${c}-${s}/30`);
    safelist.push(`bg-${c}-${s}/40`);
    safelist.push(`border-${c}-${s}/30`);
    safelist.push(`border-${c}-${s}/35`);
    safelist.push(`border-${c}-${s}/40`);
    safelist.push(`from-${c}-${s}/30`);
    safelist.push(`from-${c}-${s}/40`);
  }
}

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  safelist,
  theme: {
    extend: {
      colors: {
        ink: "#07090f",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular"],
      },
      keyframes: {
        shine: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shine: "shine 4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
