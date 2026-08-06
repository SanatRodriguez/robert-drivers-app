import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ServiceToggleList } from "@/components/ServiceToggleList";
import type { Service } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminServiciosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/servicios");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("sort_order")
    .returns<Service[]>();

  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/admin" className="text-sm text-muted mb-4 w-fit">
        ← Volver al panel
      </Link>
      <p className="text-sm font-mono text-muted mb-1">PANEL DE ROBERT</p>
      <h1 className="text-2xl font-extrabold mb-1">Servicios</h1>
      <p className="text-sm text-muted mb-6">
        Desactiva un servicio para que deje de aparecer en el inicio de los clientes,
        sin borrar su configuración.
      </p>

      <ServiceToggleList services={services || []} />
    </div>
  );
}
