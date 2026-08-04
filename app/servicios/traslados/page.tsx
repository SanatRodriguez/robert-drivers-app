"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWizard, PillGroup, TextField } from "@/components/StepWizard";
import { LocationField } from "@/components/LocationField";
import { createBooking } from "@/lib/createBooking";
import { reserveWhatsAppWindow, sendToWhatsAppWindow, buildBookingMessage } from "@/lib/whatsapp";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function mananaLabel() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return `Mañana ${DIAS[t.getDay()]}`;
}

export default function TrasladosPage() {
  const router = useRouter();
  const cuandoOpciones = ["Hoy", mananaLabel(), "Otro día"];
  const [cuando, setCuando] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    const waWindow = reserveWhatsAppWindow();
    setSubmitting(true);
    setError(null);
    try {
      const cuandoTexto =
        cuando === "Otro día" ? `${fecha} ${hora}`.trim() : `${cuando} ${hora}`.trim();
      const booking = await createBooking({
        serviceSlug: "traslados",
        formData: { cuando: cuandoTexto, hora_exacta: hora },
        origin: origen ? { address_text: origen, lat: null, lng: null } : null,
        destination: destino ? { address_text: destino, lat: null, lng: null } : null,
      });
      const mensaje = buildBookingMessage({
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        ticketCode: booking.ticket_code,
        lines: [
          { label: "🕐 Cuándo", value: cuandoTexto },
          { label: "📍 Desde", value: origen },
          { label: "🏁 Hasta", value: destino },
        ],
      });
      sendToWhatsAppWindow(waWindow, mensaje);
      router.push(`/mis-reservas/${booking.id}`);
    } catch (e) {
      waWindow?.close();
      setError("No se pudo crear la reserva. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col py-4">
      <p className="text-xs font-mono text-muted mb-4">📍 TRASLADOS</p>
      <StepWizard
        submitting={submitting}
        onFinish={handleFinish}
        steps={[
          {
            title: "¿Cuándo lo necesitas?",
            canAdvance: !!cuando && (cuando !== "Otro día" || !!fecha) && !!hora,
            content: (
              <div className="space-y-4">
                <PillGroup options={cuandoOpciones} value={cuando} onChange={setCuando} />
                {cuando === "Otro día" && (
                  <div>
                    <label className="block text-[10px] font-mono text-muted mb-2">
                      FECHA
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-bg-elevated border border-border text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-mono text-muted mb-2">
                    HORA
                  </label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-bg-elevated border border-border text-sm"
                  />
                </div>
              </div>
            ),
          },
          {
            title: "¿De dónde sales?",
            canAdvance: origen.trim().length > 0,
            content: (
              <LocationField
                value={origen}
                onChange={setOrigen}
                placeholder="Ej: Miraflores, Av. Larco 123"
              />
            ),
          },
          {
            title: "¿A dónde vas?",
            canAdvance: destino.trim().length > 0,
            content: (
              <LocationField value={destino} onChange={setDestino} placeholder="Ej: Playa Asia" />
            ),
          },
        ]}
      />
      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </div>
  );
}
