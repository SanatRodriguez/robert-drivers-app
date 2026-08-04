import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  payment_uploaded: "Pago en revisión",
  confirmed: "Confirmada",
  assigned: "Asignada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-muted",
  payment_uploaded: "text-brand",
  confirmed: "text-brand",
  assigned: "text-whatsapp",
  completed: "text-whatsapp",
  cancelled: "text-red-400",
};

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, ticket_code, status, created_at, scheduled_for, services(name, icon), client:profiles!bookings_client_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 flex flex-col py-4">
      <p className="text-xs font-mono text-muted mb-1">PANEL DE ROBERT</p>
      <h1 className="text-2xl font-extrabold mb-6">Reservas</h1>

      <div className="flex flex-col gap-3">
        {bookings?.map((b: any) => (
          <Link
            key={b.id}
            href={`/admin/reservas/${b.id}`}
            className="p-4 rounded-2xl bg-bg-elevated border border-border"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-bold text-brand">{b.ticket_code}</span>
              <span className={`text-xs font-bold ${STATUS_COLOR[b.status]}`}>
                {STATUS_LABEL[b.status]}
              </span>
            </div>
            <div className="font-bold text-sm mb-1">
              {b.services?.icon} {b.services?.name}
            </div>
            <div className="text-xs text-muted">
              {b.client?.full_name || "Cliente"} ·{" "}
              {new Date(b.created_at).toLocaleString("es-PE", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </Link>
        ))}
        {!bookings?.length && (
          <p className="text-sm text-muted">Todavía no hay reservas.</p>
        )}
      </div>
    </div>
  );
}
