let loadPromise: Promise<typeof google | null> | null = null;

// Si no hay API key configurada, resuelve a null — los campos de dirección
// siguen funcionando como texto libre, sin autocompletado.
export function loadGoogleMaps(): Promise<typeof google | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  const existing = (window as any).google;
  if (existing?.maps?.places) return Promise.resolve(existing);

  if (loadPromise) return loadPromise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.resolve(null);

  loadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es&region=PE`;
    script.async = true;
    script.onload = () => resolve((window as any).google || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return loadPromise;
}
