"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepWizard } from "@/components/StepWizard";
import { LocationField } from "@/components/LocationField";
import { ItemGallery, type GalleryItem } from "@/components/ItemGallery";
import { createBooking } from "@/lib/createBooking";
import {
  reserveWhatsAppWindow,
  sendToWhatsAppWindow,
  buildBookingMessage,
  buildGoogleMapsLink,
} from "@/lib/whatsapp";
import type { Location } from "@/lib/types";

const EMPTY_LOCATION: Location = { address_text: "", lat: null, lng: null };

export function EventosWizard({ eventos }: { eventos: GalleryItem[] }) {
  const router = useRouter();
  const [eventoId, setEventoId] = useState("");
  const [zona, setZona] = useState<Location>(EMPTY_LOCATION);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    const waWindow = reserveWhatsAppWindow();
    setSubmitting(true);
    setError(null);
    try {
      const item = eventos.find((e) => e.id === eventoId);
      const booking = await createBooking({
        serviceSlug: "eventos",
        serviceItemId: item?.id || null,
        formData: { evento: item?.name || "" },
        origin: zona.address_text ? zona : null,
      });
      const mensaje = buildBookingMessage({
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        ticketCode: booking.ticket_code,
        lines: [
          { label: "🎫 Evento", value: item?.name || "" },
          {
            label: "📍 Salgo desde",
            value: zona.address_text,
            mapsLink: zona.lat && zona.lng ? buildGoogleMapsLink(zona.lat, zona.lng) : null,
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
      <p className="text-sm font-mono text-muted mb-4">🎫 EVENTOS</p>
      <StepWizard
        submitting={submitting}
        onFinish={handleFinish}
        steps={[
          {
            title: "¿A qué evento vas?",
            canAdvance: !!eventoId,
            content: (
              <ItemGallery items={eventos} selectedId={eventoId} onSelect={setEventoId} />
            ),
          },
          {
            title: "¿De qué zona sales?",
            canAdvance: zona.address_text.trim().length > 0,
            content: (
              <LocationField value={zona} onChange={setZona} placeholder="Ej: San Miguel" />
            ),
          },
        ]}
      />
      {error && <p className="text-sm text-danger mt-3">{error}</p>}
    </div>
  );
}
