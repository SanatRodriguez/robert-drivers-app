import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#1851DD",
        "brand-dark": "#123EA8",
        bg: "var(--color-bg)",
        "bg-elevated": "var(--color-bg-elevated)",
        "bg-card": "var(--color-bg-card)",
        border: "var(--color-border)",
        muted: "var(--color-muted)",
        ink: "var(--color-ink)",
        danger: "var(--color-danger)",
        // texto de estado (ej: "Completada") — el boton fijo de WhatsApp usa su
        // propio verde fijo, no este token, porque su fondo no cambia con el tema.
        whatsapp: "var(--color-whatsapp-text)",
      },
    },
  },
  plugins: [],
};
export default config;
