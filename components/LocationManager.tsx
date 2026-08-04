"use client";

import { useEffect, useState } from "react";
import {
  fetchMyLocations,
  saveLocation,
  updateLocation,
  deleteLocation,
  setDefaultLocation,
  type SavedLocation,
} from "@/lib/locations";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { Location } from "@/lib/types";

const EMPTY_LOCATION: Location = { address_text: "", lat: null, lng: null };

export function LocationManager() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function refresh() {
    return fetchMyLocations().then((data) => {
      setLocations(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {loading && <p className="text-sm text-muted">Cargando...</p>}

      {!loading &&
        locations.map((loc) =>
          editingId === loc.id ? (
            <LocationForm
              key={loc.id}
              initialLabel={loc.label}
              initialLocation={{ address_text: loc.address_text, lat: loc.lat, lng: loc.lng }}
              onCancel={() => setEditingId(null)}
              onSubmit={async (label, location) => {
                await updateLocation(loc.id, {
                  label,
                  address_text: location.address_text,
                  lat: location.lat,
                  lng: location.lng,
                });
                setEditingId(null);
                await refresh();
              }}
            />
          ) : (
            <div
              key={loc.id}
              className="p-4 rounded-2xl bg-bg-elevated border border-border"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">📍 {loc.label}</span>
                    {loc.is_default && (
                      <span className="text-[10px] font-bold text-brand border border-brand/40 rounded-full px-2 py-0.5">
                        Por defecto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1 truncate">{loc.address_text}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                {!loc.is_default && (
                  <button
                    type="button"
                    onClick={async () => {
                      await setDefaultLocation(loc.id);
                      await refresh();
                    }}
                    className="text-xs text-brand font-semibold"
                  >
                    Marcar por defecto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingId(loc.id)}
                  className="text-xs text-muted font-semibold"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteLocation(loc.id);
                    await refresh();
                  }}
                  className="text-xs text-red-400 font-semibold"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}

      {!loading && !locations.length && !adding && (
        <p className="text-sm text-muted">Todavía no tienes direcciones guardadas.</p>
      )}

      {adding ? (
        <LocationForm
          initialLabel=""
          initialLocation={EMPTY_LOCATION}
          onCancel={() => setAdding(false)}
          onSubmit={async (label, location) => {
            await saveLocation(label, location, locations.length === 0);
            setAdding(false);
            await refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="py-3.5 rounded-xl border border-dashed border-border text-sm text-brand font-bold"
        >
          + Agregar dirección
        </button>
      )}
    </div>
  );
}

function LocationForm({
  initialLabel,
  initialLocation,
  onSubmit,
  onCancel,
}: {
  initialLabel: string;
  initialLocation: Location;
  onSubmit: (label: string, location: Location) => Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [location, setLocation] = useState<Location>(initialLocation);
  const [saving, setSaving] = useState(false);

  const canSave = label.trim().length > 0 && location.address_text.trim().length > 0;

  return (
    <div className="p-4 rounded-2xl bg-bg-elevated border border-border space-y-3">
      <div>
        <label className="block text-[10px] font-mono text-muted mb-2 tracking-wide">
          ETIQUETA
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ej: Casa, Trabajo"
          className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="block text-[10px] font-mono text-muted mb-2 tracking-wide">
          DIRECCIÓN
        </label>
        <AddressAutocomplete
          value={location.address_text}
          onChange={setLocation}
          placeholder="Busca tu dirección"
          className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-border text-xs text-muted"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!canSave || saving}
          onClick={async () => {
            setSaving(true);
            await onSubmit(label.trim(), location);
            setSaving(false);
          }}
          className="flex-1 py-2.5 rounded-xl bg-brand text-xs font-bold disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
