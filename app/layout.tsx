import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Robert's Drivers",
  description: "Transporte privado, solo para los tuyos.",
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
      </body>
    </html>
  );
}
