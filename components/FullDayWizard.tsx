"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWizard, PillGroup, TextField } from "@/components/StepWizard";
import { createBooking } from "@/lib/createBooking";
import { reserveWhatsAppWindow, sendToWhatsAppWindow, buildBookingMessage } from "@/lib/whatsapp";

export function FullDayWizard({
  paquetes,
}: {
  paquetes: { id: string; name: string; price: number | null }[];
}) {
  const router = useRouter();
  const [plan, setPlan] = useState("");
  const [paqueteId, setPaqueteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opciones = paquetes.map(
    (p) => `${p.name}${p.price ? ` · S/${p.price}` : ""}`
  );

  async function handleFinish() {
    const waWindow = reserveWhatsAppWindow();
    setSubmitting(true);
    setError(null);
    try {
      const seleccionado = paquetes.find(
        (p) => `${p.name}${p.price ? ` · S/${p.price}` : ""}` === paqueteId
      );
      const booking = await createBooking({
        serviceSlug: "full-day",
        serviceItemId: seleccionado?.id || null,
        formData: { plan },
        scheduledFor: fecha || null,
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
      <p className="text-xs font-mono text-muted mb-4">☀️ FULL DAY</p>
      <StepWizard
        submitting={submitting}
        onFinish={handleFinish}
        steps={[
          {
            title: "¿Qué tienes en mente?",
            canAdvance: plan.trim().length > 0,
            content: (
              <TextField
                value={plan}
                onChange={setPlan}
                placeholder="Ej: Recorrido playas, cumpleaños, visita familiar"
              />
            ),
          },
          ...(opciones.length
            ? [
                {
                  title: "¿Qué paquete te interesa?",
                  canAdvance: !!paqueteId,
                  content: (
                    <PillGroup options={opciones} value={paqueteId} onChange={setPaqueteId} />
                  ),
                },
              ]
            : []),
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
