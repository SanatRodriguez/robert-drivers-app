import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallGuide } from "@/components/InstallGuide";

export const metadata: Metadata = {
  title: "Robert's Drivers",
  description: "Transporte privado, solo para los tuyos.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Robert's Drivers",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1851DD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <div className="max-w-md mx-auto px-5 py-6 min-h-screen flex flex-col">
          {children}
        </div>
        <InstallGuide />
      </body>
    </html>
  );
}
