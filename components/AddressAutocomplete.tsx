"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { Location } from "@/lib/types";

const LIMA_CENTER = { lat: -12.0464, lng: -77.0428 };

// Estilo oscuro para que el mapa combine con el resto de la app.
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#16213A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0F1C" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8993AD" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1F2E4D" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8993AD" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0A0F1C" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111A2E" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1F2E4D" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export function AddressAutocomplete({
  location,
  onChange,
  placeholder,
  className,
}: {
  location: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    let autocompleteListener: google.maps.MapsEventListener | undefined;
    let mapClickListener: google.maps.MapsEventListener | undefined;
    let cancelled = false;

    loadGoogleMaps().then((g) => {
      if (cancelled || !g || !inputRef.current || !mapDivRef.current) return;

      const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "name", "geometry"],
        componentRestrictions: { country: "pe" },
      });
      autocompleteListener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const address_text =
          place.formatted_address || place.name || inputRef.current?.value || "";
        const lat = place.geometry?.location?.lat() ?? null;
        const lng = place.geometry?.location?.lng() ?? null;
        onChangeRef.current({ address_text, lat, lng });
      });

      const start = locationRef.current;
      const map = new g.maps.Map(mapDivRef.current, {
        center: start.lat && start.lng ? { lat: start.lat, lng: start.lng } : LIMA_CENTER,
        zoom: start.lat && start.lng ? 16 : 12,
        disableDefaultUI: true,
        zoomControl: true,
        styles: DARK_MAP_STYLE,
      });
      mapRef.current = map;

      const placeMarker = (pos: google.maps.LatLng | google.maps.LatLngLiteral) => {
        if (!markerRef.current) {
          markerRef.current = new g.maps.Marker({ map, position: pos, draggable: true });
          markerRef.current.addListener("dragend", () => {
            const p = markerRef.current!.getPosition();
            if (!p) return;
            onChangeRef.current({
              address_text: locationRef.current.address_text,
              lat: p.lat(),
              lng: p.lng(),
            });
          });
        } else {
          markerRef.current.setPosition(pos);
        }
      };

      if (start.lat && start.lng) {
        placeMarker({ lat: start.lat, lng: start.lng });
      }

      mapClickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        placeMarker(e.latLng);
        onChangeRef.current({
          address_text: locationRef.current.address_text,
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
      });
    });

    return () => {
      cancelled = true;
      autocompleteListener?.remove();
      mapClickListener?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza el input cuando el valor cambia desde afuera (ej: click en dirección guardada).
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== location.address_text) {
      inputRef.current.value = location.address_text;
    }
  }, [location.address_text]);

  // Sincroniza el mapa/pin cuando las coordenadas cambian desde afuera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || location.lat === null || location.lng === null) return;
    const pos = { lat: location.lat, lng: location.lng };
    map.panTo(pos);
    map.setZoom(16);
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else if (typeof google !== "undefined") {
      markerRef.current = new google.maps.Marker({ map, position: pos, draggable: true });
      markerRef.current.addListener("dragend", () => {
        const p = markerRef.current!.getPosition();
        if (!p) return;
        onChangeRef.current({
          address_text: locationRef.current.address_text,
          lat: p.lat(),
          lng: p.lng(),
        });
      });
    }
  }, [location.lat, location.lng]);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        defaultValue={location.address_text}
        onChange={(e) =>
          onChangeRef.current({ address_text: e.target.value, lat: null, lng: null })
        }
        placeholder={placeholder}
        className={
          className ||
          "w-full px-4 py-3.5 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
        }
      />
      <div
        ref={mapDivRef}
        className="w-full h-44 rounded-xl border border-border mt-2 overflow-hidden bg-bg-elevated"
      />
      {location.lat && location.lng && (
        <p className="text-[11px] text-muted mt-1.5">
          📍 Arrastra el pin o toca el mapa para ajustar el punto exacto
        </p>
      )}
    </div>
  );
}
