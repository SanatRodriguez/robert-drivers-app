"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadServiceImage } from "@/lib/storage";

export type Driver = {
  id: string;
  full_name: string;
  car_model: string | null;
  car_color: string | null;
  plate: string | null;
  phone: string | null;
  photo_url: string | null;
  is_active: boolean;
};

export function DriversManager({ drivers }: { drivers: Driver[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {drivers.map((driver) =>
        editingId === driver.id ? (
          <DriverForm
            key={driver.id}
            initial={driver}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <div
            key={driver.id}
            className="p-3 rounded-2xl bg-bg-elevated border border-border flex gap-3"
          >
            {driver.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={driver.photo_url}
                alt={driver.full_name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-bg-card flex items-center justify-center text-xl shrink-0">
                🧑‍✈️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate">{driver.full_name}</span>
                {!driver.is_active && (
                  <span className="text-[12px] text-muted border border-border rounded-full px-2 py-0.5 shrink-0">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mt-0.5 truncate">
                {[driver.car_model, driver.car_color, driver.plate].filter(Boolean).join(" · ") ||
                  "Sin datos del auto"}
              </p>
              {driver.phone && <p className="text-sm text-muted mt-0.5">📞 {driver.phone}</p>}
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(driver.id)}
                  className="text-sm text-brand font-semibold"
                >
                  Editar
                </button>
                <ToggleActiveButton driver={driver} />
                <DeleteButton driverId={driver.id} />
              </div>
            </div>
          </div>
        )
      )}

      {!drivers.length && !adding && (
        <p className="text-sm text-muted">Todavía no hay conductores cargados.</p>
      )}

      {adding ? (
        <DriverForm onDone={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="py-3.5 rounded-xl border border-dashed border-border text-sm text-brand font-bold"
        >
          + Agregar conductor
        </button>
      )}
    </div>
  );
}

function ToggleActiveButton({ driver }: { driver: Driver }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  return (
    <button
      type="button"
      disabled={saving}
      onClick={async () => {
        setSaving(true);
        const supabase = createClient();
        await supabase
          .from("drivers")
          .update({ is_active: !driver.is_active })
          .eq("id", driver.id);
        router.refresh();
      }}
      className="text-sm text-muted font-semibold"
    >
      {driver.is_active ? "Desactivar" : "Activar"}
    </button>
  );
}

function DeleteButton({ driverId }: { driverId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  if (confirming) {
    return (
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          const supabase = createClient();
          await supabase.from("drivers").delete().eq("id", driverId);
          router.refresh();
        }}
        className="text-sm text-danger font-semibold"
      >
        {saving ? "Eliminando..." : "¿Seguro? Confirmar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm text-danger font-semibold"
    >
      Eliminar
    </button>
  );
}

function DriverForm({ initial, onDone }: { initial?: Driver; onDone: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [carModel, setCarModel] = useState(initial?.car_model || "");
  const [carColor, setCarColor] = useState(initial?.car_color || "");
  const [plate, setPlate] = useState(initial?.plate || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = fullName.trim().length > 0;

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadServiceImage(file);
      setPhotoUrl(url);
    } catch {
      setError("No se pudo subir la foto. Intenta de nuevo.");
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      full_name: fullName.trim(),
      car_model: carModel.trim() || null,
      car_color: carColor.trim() || null,
      plate: plate.trim() || null,
      phone: phone.trim() || null,
      photo_url: photoUrl || null,
    };

    const { error } = initial
      ? await supabase.from("drivers").update(payload).eq("id", initial.id)
      : await supabase.from("drivers").insert(payload);

    setSaving(false);
    if (error) {
      setError("No se pudo guardar. Intenta de nuevo.");
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <div className="p-4 rounded-2xl bg-bg-elevated border border-border space-y-3">
      <div>
        <label className="block text-[12px] font-mono text-muted mb-2 tracking-wide">
          NOMBRE COMPLETO
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[12px] font-mono text-muted mb-2 tracking-wide">
            MODELO DE AUTO
          </label>
          <input
            type="text"
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            placeholder="Ej: Toyota Yaris"
            className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[12px] font-mono text-muted mb-2 tracking-wide">
            COLOR
          </label>
          <input
            type="text"
            value={carColor}
            onChange={(e) => setCarColor(e.target.value)}
            placeholder="Ej: Blanco"
            className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[12px] font-mono text-muted mb-2 tracking-wide">
            PLACA
          </label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Ej: ABC-123"
            className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[12px] font-mono text-muted mb-2 tracking-wide">
            CELULAR
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+51 987 654 321"
            className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-mono text-muted mb-2 tracking-wide">
          FOTO
        </label>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="w-24 h-24 object-cover rounded-xl mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={uploading}
          className="w-full text-sm text-muted"
        />
        {uploading && <p className="text-sm text-muted mt-1">Subiendo...</p>}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!canSave || saving || uploading}
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
