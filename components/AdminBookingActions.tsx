"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = [
  "pending",
  "payment_uploaded",
  "confirmed",
  "assigned",
  "completed",
  "cancelled",
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  payment_uploaded: "Pago en revisión",
  confirmed: "Confirmada",
  assigned: "Asignada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export function AdminBookingActions({
  bookingId,
  currentStatus,
  currentDriverId,
  drivers,
}: {
  bookingId: string;
  currentStatus: string;
  currentDriverId: string | null;
  drivers: { id: string; full_name: string; car_model: string | null; plate: string | null }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [driverId, setDriverId] = useState(currentDriverId || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("bookings")
      .update({
        status,
        driver_id: driverId || null,
      })
      .eq("id", bookingId);

    if (!error) {
      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: `status:${status}`,
      });
      setSaved(true);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-2xl p-5 space-y-4">
      <div>
        <label className="block text-[12px] font-mono text-muted mb-2 tracking-wide">
          ESTADO
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-3 rounded-xl bg-bg border border-border text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[12px] font-mono text-muted mb-2 tracking-wide">
          CONDUCTOR ASIGNADO
        </label>
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="w-full px-3 py-3 rounded-xl bg-bg border border-border text-sm"
        >
          <option value="">Sin asignar</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name} {d.car_model ? `· ${d.car_model}` : ""} {d.plate ? `· ${d.plate}` : ""}
            </option>
          ))}
        </select>
        {!drivers.length && (
          <p className="text-sm text-muted mt-2">
            Todavía no hay conductores cargados en la base de datos.
          </p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-60"
      >
        {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
      </button>
    </div>
  );
}
