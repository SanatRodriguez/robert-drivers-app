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

export function formatLimaDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: LIMA_TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
