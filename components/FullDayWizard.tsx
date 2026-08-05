"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWizard, TextField } from "@/components/StepWizard";
import { ItemGallery, type GalleryItem } from "@/components/ItemGallery";
import { createBooking } from "@/lib/createBooking";
import { reserveWhatsAppWindow, sendToWhatsAppWindow, buildBookingMessage } from "@/lib/whatsapp";
import { limaDateInputToISOString } from "@/lib/limaTime";

export function FullDayWizard({ paquetes }: { paquetes: GalleryItem[] }) {
  const router = useRouter();
  const [plan, setPlan] = useState("");
  const [paqueteId, setPaqueteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    const waWindow = reserveWhatsAppWindow();
    setSubmitting(true);
    setError(null);
    try {
      const seleccionado = paquetes.find((p) => p.id === paqueteId);
      const booking = await createBooking({
        serviceSlug: "full-day",
        serviceItemId: seleccionado?.id || null,
        formData: { plan },
        scheduledFor: fecha ? limaDateInputToISOString(fecha) : null,
      });
      const mensaje = buildBookingMessage({
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        ticketCode: booking.ticket_code,
        lines: [
          { label: "📝 Plan", value: plan },
          { label: "📦 Paquete", value: seleccionado?.name || "" },
          { label: "📅 Fecha", value: fecha },
        ],
      });
      sendToWhatsAppWindow(waWindow, mensaje);
      router.push(`/mis-reservas/${booking.id}`);
    } catch {
      waWindow?.close();
      setError("No se pudo crear la reserva. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col py-4">
      <p className="text-sm font-mono text-muted mb-4">☀️ FULL DAY</p>
      <StepWizard
        submitting={submitting}
        onFinish={handleFinish}
        steps={[
          {
            title: "¿Qué tienes en mente?",
            canAdvance: paquetes.length
              ? plan.trim().length > 0 || !!paqueteId
              : plan.trim().length > 0,
            content: (
              <div className="space-y-4">
                <TextField
                  value={plan}
                  onChange={setPlan}
                  placeholder="Ej: Recorrido playas, cumpleaños, visita familiar"
                />
                {paquetes.length > 0 && (
                  <div>
                    <p className="text-[12px] font-mono text-muted mb-2 tracking-wide">
                      O ELIGE UN PAQUETE
                    </p>
                    <ItemGallery
                      items={paquetes}
                      selectedId={paqueteId}
                      onSelect={setPaqueteId}
                    />
                  </div>
                )}
              </div>
            ),
          },
          {
            title: "¿Qué fecha?",
            canAdvance: fecha.trim().length > 0,
            content: (
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-bg-elevated border border-border text-sm"
              />
            ),
          },
        ]}
      />
      {error && <p className="text-sm text-danger mt-3">{error}</p>}
    </div>
  );
}
