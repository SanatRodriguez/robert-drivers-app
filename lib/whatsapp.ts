export const WHATSAPP_NUMBER = "51955377609"; // Asunción: número de Robert. Confirmar/reemplazar.

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildBookingMessage(params: {
  clientName: string;
  serviceName: string;
  ticketCode: string;
  lines: { label: string; value: string }[];
}) {
  let msg = `Hola Robert's Drivers 👋\nSoy ${params.clientName}.\nQuiero pedir *${params.serviceName}*.\n🎫 Ticket: ${params.ticketCode}`;
  for (const l of params.lines) {
    if (l.value) msg += `\n${l.label}: ${l.value}`;
  }
  return msg;
}

// Se llama de forma SÍNCRONA, apenas la persona toca "Enviar" — antes de cualquier
// await — para que el navegador no bloquee la pestaña como pop-up. Se le asigna
// la URL real recién cuando la reserva ya se creó.
export function reserveWhatsAppWindow(): Window | null {
  if (typeof window === "undefined") return null;
  try {
    return window.open("", "_blank");
  } catch {
    return null;
  }
}

export function sendToWhatsAppWindow(win: Window | null, message: string) {
  const url = buildWhatsAppUrl(message);
  if (win && !win.closed) {
    win.location.href = url;
  } else {
    // Si el navegador bloqueó la pestaña reservada, se intenta igual —
    // el botón de respaldo en la pantalla de confirmación cubre el resto.
    window.open(url, "_blank");
  }
}
