import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatLimaDateTime } from "@/lib/limaTime";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  payment_uploaded: "Pago en revisión",
  confirmed: "Confirmada",
  assigned: "Conductor asignado",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-muted",
  payment_uploaded: "text-brand",
  confirmed: "text-brand",
  assigned: "text-whatsapp",
  completed: "text-whatsapp",
  cancelled: "text-danger",
};

export default async function MisReservasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mis-reservas");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, ticket_code, status, created_at, scheduled_for, services(name, icon)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/" className="text-sm text-muted mb-4 w-fit">
        ← Volver al inicio
      </Link>
      <p className="text-sm font-mono text-muted mb-1">MIS VIAJES</p>
      <h1 className="text-2xl font-extrabold mb-6">Tus reservas</h1>

      <div className="flex flex-col gap-3">
        {bookings?.map((b: any) => (
          <Link
            key={b.id}
            href={`/mis-reservas/${b.id}`}
            className="p-4 rounded-2xl bg-bg-elevated border border-border"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-sm font-bold text-brand">{b.ticket_code}</span>
              <span className={`text-sm font-bold ${STATUS_COLOR[b.status]}`}>
                {STATUS_LABEL[b.status]}
              </span>
            </div>
            <div className="font-bold text-sm mb-1">
              {b.services?.icon} {b.services?.name}
            </div>
            <div className="text-sm text-muted">
              {formatLimaDateTime(b.created_at)}
            </div>
          </Link>
        ))}
        {!bookings?.length && (
          <p className="text-sm text-muted">Todavía no tienes reservas.</p>
        )}
      </div>
    </div>
  );
}
