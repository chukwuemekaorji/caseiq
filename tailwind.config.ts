import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1520",
        film: "#E8ECEF",
        teal: "#1B4F63",
        amber: "#C4703A",
        graphite: "#8A939B",
        coral: "#FF6B6B",
        violet: "#8B5CF6",
        mint: "#2DD4A7",
        sun: "#FFC145",
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "Archivo Condensed", "Impact", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
