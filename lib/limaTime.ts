// La app es solo para Perú — todo se muestra y se guarda en hora de Lima
// (UTC-5, sin horario de verano), sin importar la zona horaria del server
// o del dispositivo de quien lo mire.
const LIMA_TZ = "America/Lima";

// Convierte una fecha "YYYY-MM-DD" (tal como la da <input type="date">) al
// instante UTC que corresponde a medianoche en Lima — si se usara
// new Date(str).toISOString() directo, JS la toma como medianoche UTC,
// que en Lima es el día anterior a las 7pm.
export function limaDateInputToISOString(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00-05:00`).toISOString();
}

export function formatLimaDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    timeZone: LIMA_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Hora actual de Lima + 1 hora, como "HH:MM" — para precargar el campo de
// hora cuando el cliente pide el servicio para "Hoy".
export function nowPlusOneHourLima(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LIMA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

export function formatLimaDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: LIMA_TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
