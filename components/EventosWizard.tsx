"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWizard, PillGroup, TextField } from "@/components/StepWizard";
import { createBooking } from "@/lib/createBooking";
import { reserveWhatsAppWindow, sendToWhatsAppWindow, buildBookingMessage } from "@/lib/whatsapp";

export function EventosWizard({
  eventos,
}: {
  eventos: { id: string; name: string }[];
}) {
  const router = useRouter();
  const opciones = [...eventos.map((e) => e.name), "Otro"];
  const [evento, setEvento] = useState("");
  const [eventoOtro, setEventoOtro] = useState("");
  const [zona, setZona] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    const waWindow = reserveWhatsAppWindow();
    setSubmitting(true);
    setError(null);
    try {
      const nombreEvento = evento === "Otro" ? eventoOtro : evento;
      const item = eventos.find((e) => e.name === evento);
      const booking = await createBooking({
        serviceSlug: "eventos",
        serviceItemId: item?.id || null,
        formData: { evento: nombreEvento, zona_salida: zona },
      });
      const mensaje = buildBookingMessage({
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        ticketCode: booking.ticket_code,
        lines: [
          { label: "🎫 Evento", value: nombreEvento },
          { label: "📍 Salgo desde", value: zona },
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
      <p className="text-xs font-mono text-muted mb-4">🎫 EVENTOS</p>
      <StepWizard
        submitting={submitting}
        onFinish={handleFinish}
        steps={[
          {
            title: "¿A qué evento vas?",
            canAdvance: !!evento && (evento !== "Otro" || eventoOtro.trim().length > 0),
            content: (
              <div className="space-y-4">
                <PillGroup options={opciones} value={evento} onChange={setEvento} />
                {evento === "Otro" && (
                  <TextField
                    value={eventoOtro}
                    onChange={setEventoOtro}
                    placeholder="Nombre del evento"
                  />
                )}
              </div>
            ),
          },
          {
            title: "¿De qué zona sales?",
            canAdvance: zona.trim().length > 0,
            content: <TextField value={zona} onChange={setZona} placeholder="Ej: San Miguel" />,
          },
        ]}
      />
      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </div>
  );
}
