import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#1851DD",
        "brand-dark": "#123EA8",
        bg: "#0A0F1C",
        "bg-elevated": "#111A2E",
        "bg-card": "#16213A",
        border: "#1F2E4D",
        muted: "#8993AD",
        whatsapp: "#25D366",
      },
    },
  },
  plugins: [],
};
export default config;
