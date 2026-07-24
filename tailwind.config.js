export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1520",
        film: "#E8ECEF",
        teal: "#1B4F63",
        amber: "#C4703A",
        graphite: "#8A939B",
      },
      fontFamily: {
        display: ["Archivo Condensed", "Impact", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};