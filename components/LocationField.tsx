"use client";

import { useEffect, useState } from "react";
import { fetchMyLocations, saveLocation, type SavedLocation } from "@/lib/locations";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { Location } from "@/lib/types";

export function LocationField({
  value,
  onChange,
  placeholder,
}: {
  value: Location;
  onChange: (v: Location) => void;
  placeholder?: string;
}) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyLocations().then(setLocations);
  }, []);

  async function handleSave() {
    if (!value.address_text.trim() || !saveLabel.trim()) return;
    await saveLocation(saveLabel.trim(), value);
    setSaved(true);
    setShowSave(false);
    fetchMyLocations().then(setLocations);
  }

  return (
    <div>
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() =>
                onChange({ address_text: loc.address_text, lat: loc.lat, lng: loc.lng })
              }
              className="px-3 py-1.5 rounded-full text-xs border border-border bg-bg-elevated text-muted"
            >
              📍 {loc.label}
            </button>
          ))}
        </div>
      )}

      <AddressAutocomplete
        value={value.address_text}
        onChange={(loc) => {
          onChange(loc);
          setSaved(false);
        }}
        placeholder={placeholder}
      />

      {value.address_text.trim().length > 0 && !showSave && !saved && (
        <button
          type="button"
          onClick={() => setShowSave(true)}
          className="text-xs text-brand mt-2"
        >
          + Guardar esta dirección
        </button>
      )}

      {showSave && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={saveLabel}
            onChange={(e) => setSaveLabel(e.target.value)}
            placeholder="Ej: Casa, Trabajo"
            className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated border border-border text-xs"
          />
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-2 rounded-lg bg-brand text-xs font-bold shrink-0"
          >
            Guardar
          </button>
        </div>
      )}

      {saved && <p className="text-xs text-whatsapp mt-2">✓ Dirección guardada</p>}
    </div>
  );
}
