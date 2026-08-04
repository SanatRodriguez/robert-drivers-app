import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AdminBookingActions } from "@/components/AdminBookingActions";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "*, services(name, icon), client:profiles!bookings_client_id_fkey(full_name, phone)"
    )
    .eq("id", params.id)
    .single();

  if (!booking) notFound();

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name, car_model, plate")
    .eq("is_active", true);

  const formData = (booking.form_data || {}) as Record<string, string>;
  const origin = booking.origin_location as { address_text: string } | null;
  const destination = booking.destination_location as { address_text: string } | null;

  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/admin" className="text-sm text-muted mb-4 w-fit">
        ← Todas las reservas
      </Link>

      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-sm font-bold text-brand">{booking.ticket_code}</span>
      </div>
      <h1 className="text-xl font-extrabold mb-1">
        {booking.services?.icon} {booking.services?.name}
      </h1>
      <p className="text-sm text-muted mb-6">
        {booking.client?.full_name || "Cliente"}
        {booking.client?.phone ? ` · ${booking.client.phone}` : ""}
      </p>

      <div className="bg-bg-elevated border border-border rounded-2xl p-5 space-y-3 mb-4 text-sm">
        {origin?.address_text && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">Origen</span>
            <span className="text-right">{origin.address_text}</span>
          </div>
        )}
        {destination?.address_text && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">Destino</span>
            <span className="text-right">{destination.address_text}</span>
          </div>
        )}
        {booking.scheduled_for && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">Fecha</span>
            <span className="text-right">
              {new Date(booking.scheduled_for).toLocaleDateString("es-PE")}
            </span>
          </div>
        )}
        {Object.entries(formData).map(([k, v]) =>
          v ? (
            <div key={k} className="flex justify-between gap-3">
              <span className="text-muted">{k}</span>
              <span className="text-right">{v}</span>
            </div>
          ) : null
        )}
        <div className="flex justify-between gap-3">
          <span className="text-muted">Pedido</span>
          <span className="text-right">
            {new Date(booking.created_at).toLocaleString("es-PE")}
          </span>
        </div>
      </div>

      <AdminBookingActions
        bookingId={booking.id}
        currentStatus={booking.status}
        currentDriverId={booking.driver_id}
        drivers={drivers || []}
      />
    </div>
  );
}
