"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatLimaDateTime } from "@/lib/limaTime";

const PAGE_SIZE = 10;

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
  cancelled: "text-danger",
};

type Booking = {
  id: string;
  ticket_code: string;
  status: string;
  created_at: string;
  driver_id: string | null;
  services: { name: string; icon: string | null } | null;
  client: { full_name: string | null } | null;
  drivers: { full_name: string } | null;
};

type Driver = { id: string; full_name: string };

export function AdminBookingsList({
  initialBookings,
  drivers,
}: {
  initialBookings: Booking[];
  drivers: Driver[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialBookings.length === PAGE_SIZE);

  async function loadMore() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, ticket_code, status, created_at, driver_id, services(name, icon), client:profiles!bookings_client_id_fkey(full_name), drivers(full_name)"
      )
      .order("created_at", { ascending: false })
      .range(bookings.length, bookings.length + PAGE_SIZE - 1)
      .returns<Booking[]>();
    setLoading(false);
    if (data) {
      setBookings((prev) => [...prev, ...data]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    }
  }

  function updateLocal(id: string, patch: Partial<Booking>) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} drivers={drivers} onUpdate={updateLocal} />
      ))}
      {!bookings.length && <p className="text-sm text-muted">Todavía no hay reservas.</p>}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="py-3 rounded-xl border border-border text-sm text-brand font-bold disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Ver 10 más"}
        </button>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  drivers,
  onUpdate,
}: {
  booking: Booking;
  drivers: Driver[];
  onUpdate: (id: string, patch: Partial<Booking>) => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);

  async function setStatus(status: string) {
    setSaving(status);
    const supabase = createClient();
    const { error } = await supabase.from("bookings").update({ status }).eq("id", booking.id);
    if (!error) {
      await supabase
        .from("booking_events")
        .insert({ booking_id: booking.id, event_type: `status:${status}` });
      onUpdate(booking.id, { status });
    }
    setSaving(null);
  }

  async function reassignDriver(driverId: string) {
    setSaving("driver");
    const supabase = createClient();
    const { error } = await supabase
      .from("bookings")
      .update({ driver_id: driverId || null, status: driverId ? "assigned" : booking.status })
      .eq("id", booking.id);
    if (!error) {
      const driver = drivers.find((d) => d.id === driverId);
      onUpdate(booking.id, {
        driver_id: driverId || null,
        drivers: driver ? { full_name: driver.full_name } : null,
        status: driverId ? "assigned" : booking.status,
      });
    }
    setSaving(null);
  }

  return (
    <div className="p-4 rounded-2xl bg-bg-elevated border border-border">
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-xs font-bold text-brand">{booking.ticket_code}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${STATUS_COLOR[booking.status]}`}>
            {STATUS_LABEL[booking.status]}
          </span>
          <Link href={`/admin/reservas/${booking.id}`} className="text-muted text-lg leading-none">
            ›
          </Link>
        </div>
      </div>
      <div className="font-bold text-sm mb-1">
        {booking.services?.icon} {booking.services?.name}
      </div>
      <div className="text-xs text-muted mb-1">
        {booking.client?.full_name || "Cliente"} · {formatLimaDateTime(booking.created_at)}
      </div>
      {booking.drivers && (
        <div className="text-xs text-muted mb-2">🧑‍✈️ {booking.drivers.full_name}</div>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <button
          type="button"
          disabled={saving === "cancelled"}
          onClick={() => setStatus("cancelled")}
          title="Cancelar"
          className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm disabled:opacity-40 ${
            booking.status === "cancelled"
              ? "bg-danger border-danger text-white"
              : "border-border text-danger"
          }`}
        >
          ✕
        </button>
        <button
          type="button"
          disabled={saving === "confirmed"}
          onClick={() => setStatus("confirmed")}
          title="Confirmar"
          className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm disabled:opacity-40 ${
            booking.status === "confirmed"
              ? "bg-brand border-brand text-white"
              : "border-border text-brand"
          }`}
        >
          ✓
        </button>
        <button
          type="button"
          disabled={saving === "completed"}
          onClick={() => setStatus("completed")}
          title="Completar"
          className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm disabled:opacity-40 ${
            booking.status === "completed"
              ? "bg-[#25D366] border-[#25D366] text-[#04310f]"
              : "border-border text-whatsapp"
          }`}
        >
          🏁
        </button>
        <select
          value={booking.driver_id || ""}
          disabled={saving === "driver"}
          onChange={(e) => reassignDriver(e.target.value)}
          title="Reasignar conductor"
          className="flex-1 h-9 px-2 rounded-lg border border-border bg-bg text-xs disabled:opacity-40"
        >
          <option value="">🧑‍✈️ Sin asignar</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
