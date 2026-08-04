import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Robert's Drivers",
    short_name: "Robert's Drivers",
    description: "Transporte privado, solo para los tuyos.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0F1C",
    theme_color: "#1851DD",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
