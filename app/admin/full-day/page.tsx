import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ServiceItemsManager } from "@/components/ServiceItemsManager";
import type { ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminFullDayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/full-day");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("slug", "full-day")
    .single();

  const { data: items } = await supabase
    .from("service_items")
    .select("*")
    .eq("service_id", service?.id)
    .order("sort_order")
    .returns<ServiceItem[]>();

  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/admin" className="text-sm text-muted mb-4 w-fit">
        ← Panel
      </Link>
      <p className="text-sm font-mono text-muted mb-1">FULL DAY</p>
      <h1 className="text-2xl font-extrabold mb-6">Gestionar paquetes</h1>

      {service ? (
        <ServiceItemsManager
          serviceId={service.id}
          items={items || []}
          showLocation={false}
          showEventDate={false}
          nameLabel="Nombre del paquete"
        />
      ) : (
        <p className="text-sm text-danger">No se encontró el servicio "Full day".</p>
      )}
    </div>
  );
}
