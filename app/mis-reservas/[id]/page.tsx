import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildWhatsAppUrl, buildBookingMessage, buildGoogleMapsLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  payment_uploaded: "Pago en revisión",
  confirmed: "Confirmada",
  assigned: "Conductor asignado",
  completed: "Completada",
  cancelled: "Cancelada",
};

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, services(name, icon)")
    .eq("id", params.id)
    .single();

  if (!booking) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let clientName = "un cliente";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    clientName = profile?.full_name || clientName;
  }

  const formData = (booking.form_data || {}) as Record<string, string>;
  const origin = booking.origin_location as
    | { address_text: string; lat: number | null; lng: number | null }
    | null;
  const destination = booking.destination_location as
    | { address_text: string; lat: number | null; lng: number | null }
    | null;
  const waMessage = buildBookingMessage({
    clientName,
    serviceName: booking.services?.name || "",
    ticketCode: booking.ticket_code,
    lines: Object.entries(formData).map(([k, v]) => ({ label: k, value: v })),
  });
  const waUrl = buildWhatsAppUrl(waMessage);

  return (
    <div className="flex-1 flex flex-col justify-center text-center py-8">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-xl font-extrabold mb-1">¡Pedido recibido!</h1>
      <p className="text-sm text-muted mb-6">
        Robert ya tiene el detalle. Te va a contactar por WhatsApp apenas lo confirme.
      </p>

      <div className="bg-bg-elevated border border-border rounded-2xl p-5 text-left space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-muted">TICKET</span>
          <span className="font-mono font-bold text-brand">{booking.ticket_code}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-muted">SERVICIO</span>
          <span className="text-sm font-semibold">
            {booking.services?.icon} {booking.services?.name}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-muted">ESTADO</span>
          <span className="text-sm font-semibold">{STATUS_LABEL[booking.status]}</span>
        </div>
        {origin?.address_text && (
          <div className="flex justify-between items-start gap-3">
            <span className="text-xs font-mono text-muted shrink-0">ORIGEN</span>
            <span className="text-sm text-right">
              {origin.address_text}
              {origin.lat && origin.lng && (
                <a
                  href={buildGoogleMapsLink(origin.lat, origin.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-brand font-semibold mt-0.5"
                >
                  🗺️ Ver en el mapa
                </a>
              )}
            </span>
          </div>
        )}
        {destination?.address_text && (
          <div className="flex justify-between items-start gap-3">
            <span className="text-xs font-mono text-muted shrink-0">DESTINO</span>
            <span className="text-sm text-right">
              {destination.address_text}
              {destination.lat && destination.lng && (
                <a
                  href={buildGoogleMapsLink(destination.lat, destination.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-brand font-semibold mt-0.5"
                >
                  🗺️ Ver en el mapa
                </a>
              )}
            </span>
          </div>
        )}
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 w-full py-3.5 rounded-xl bg-[#25D366] text-[#04310f] font-bold text-sm"
      >
        💬 Abrir WhatsApp de nuevo
      </a>

      <p className="text-xs text-muted mt-5">
        Guarda este código de ticket — cuando un conductor te escriba, va a mencionarlo
        para que sepas que es de confianza.
      </p>

      <Link href="/" className="text-brand font-semibold text-sm mt-8">
        ← Volver al inicio
      </Link>
    </div>
  );
}
