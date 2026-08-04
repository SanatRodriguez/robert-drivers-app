import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallGuide } from "@/components/InstallGuide";
import { NavDrawer } from "@/components/NavDrawer";
import { createClient } from "@/lib/supabase/server";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  return (
    <html lang="es">
      <body className="min-h-screen">
        <div className="max-w-md mx-auto px-5 py-6 min-h-screen flex flex-col">
          {user && <NavDrawer isAdmin={isAdmin} />}
          {children}
        </div>
        <InstallGuide />
      </body>
    </html>
  );
}
