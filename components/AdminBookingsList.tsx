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
  services: { name: string; icon: string | null } | null;
  client: { full_name: string | null } | null;
};

export function AdminBookingsList({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialBookings.length === PAGE_SIZE);

  async function loadMore() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, ticket_code, status, created_at, services(name, icon), client:profiles!bookings_client_id_fkey(full_name)"
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

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((b) => (
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
            {b.client?.full_name || "Cliente"} · {formatLimaDateTime(b.created_at)}
          </div>
        </Link>
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
