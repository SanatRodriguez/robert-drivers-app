"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWizard, PillGroup, TextField } from "@/components/StepWizard";
import { LocationField } from "@/components/LocationField";
import { createBooking } from "@/lib/createBooking";
import {
  reserveWhatsAppWindow,
  sendToWhatsAppWindow,
  buildBookingMessage,
  buildGoogleMapsLink,
} from "@/lib/whatsapp";
import type { Location } from "@/lib/types";

const EMPTY_LOCATION: Location = { address_text: "", lat: null, lng: null };

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function mananaLabel() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return `Mañana ${DIAS[t.getDay()]}`;
}

export default function ChoferReemplazoPage() {
  const router = useRouter();
  const cuandoOpciones = ["Hoy", mananaLabel(), "Otro día"];
  const [origen, setOrigen] = useState<Location>(EMPTY_LOCATION);
  const [destino, setDestino] = useState<Location>(EMPTY_LOCATION);
  const [cuando, setCuando] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
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
        serviceSlug: "chofer-reemplazo",
        formData: { cuando: cuandoTexto },
        origin: origen.address_text ? origen : null,
        destination: destino.address_text ? destino : null,
      });
      const mensaje = buildBookingMessage({
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        ticketCode: booking.ticket_code,
        lines: [
          { label: "🕐 Cuándo", value: cuandoTexto },
          {
            label: "📍 Te recojo en",
            value: origen.address_text,
            mapsLink: origen.lat && origen.lng ? buildGoogleMapsLink(origen.lat, origen.lng) : null,
          },
          {
            label: "🏁 Voy a",
            value: destino.address_text,
            mapsLink: destino.lat && destino.lng ? buildGoogleMapsLink(destino.lat, destino.lng) : null,
          },
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
      <p className="text-xs font-mono text-muted mb-4">🔑 CHOFER DE REEMPLAZO</p>
      <StepWizard
        submitting={submitting}
        onFinish={handleFinish}
        steps={[
          {
            title: "¿Cuándo?",
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
            title: "¿Dónde te recojo?",
            canAdvance: origen.address_text.trim().length > 0,
            content: (
              <LocationField
                value={origen}
                onChange={setOrigen}
                placeholder="Ej: Barranco, restaurante X"
                excludeAddressText={destino.address_text || undefined}
              />
            ),
          },
          {
            title: "¿A dónde vas?",
            canAdvance: destino.address_text.trim().length > 0,
            content: (
              <LocationField
                value={destino}
                onChange={setDestino}
                placeholder="Ej: Surco"
                excludeAddressText={origen.address_text || undefined}
              />
            ),
          },
        ]}
      />
      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </div>
  );
}
