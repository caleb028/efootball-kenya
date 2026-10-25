import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ef: {
          blue: "#00189D", // Exact True Logo Royal Blue rgb(0, 24, 157)
          electric: "#0025D0",
          yellow: "#FFFF00", // Exact True Logo Fluorescent Yellow rgb(255, 255, 0)
          navy: "#001068", // Deep blue surface tone
          dark: "#001582", // Cards & elevated panels
          surface: "#001EAB", // Interactive hover panels
          pitchGreen: "#00D044",
          cyan: "#00D2FF",
          red: "#FF1E27",
          white: "#FFFFFF",
          grey: "#B0C2E8",
          border: "#002BDC",
        },
        brand: {
          royal: "#00189D",
          blue: "#00189D",
          electric: "#0025D0",
          yellow: "#FFFF00",
          yellowAlt: "#FFFF00",
          navy: "#001275",
          darkBlue: "#001582",
          midnight: "#000D54",
          lightBlue: "#EAF0FF",
          grey: "#B0C2E8",
          gold: "#FFFF00",
          success: "#00D044",
          error: "#FF1E27",
        },
      },
      fontFamily: {
        efootball: ["var(--font-efootball)", "var(--font-rajdhani)", "sans-serif"],
        display: ["var(--font-efootball)", "var(--font-rajdhani)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        promo: ["var(--font-space-grotesk)", "sans-serif"],
        condensed: ["var(--font-barlow-condensed)", "sans-serif"],
      },
      boxShadow: {
        "ef-blue": "0 8px 30px -4px rgba(0, 24, 157, 0.6)",
        "ef-yellow": "0 6px 28px -4px rgba(255, 255, 0, 0.45)",
        "ef-green": "0 6px 20px -4px rgba(0, 208, 68, 0.35)",
        "esports-blue": "0 8px 30px -4px rgba(0, 24, 157, 0.6)",
        "esports-yellow": "0 6px 28px -4px rgba(255, 255, 0, 0.45)",
        "esports-card": "0 10px 30px -10px rgba(0, 13, 84, 0.8)",
      },
      backgroundImage: {
        "stadium-glow":
          "radial-gradient(ellipse at top, rgba(0, 37, 208, 0.6) 0%, rgba(0, 24, 157, 0.95) 60%, #001275 100%)",
        "pitch-glow":
          "radial-gradient(circle at 50% 0%, rgba(0, 208, 68, 0.15) 0%, transparent 60%)",
        "pitch-grid":
          "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
