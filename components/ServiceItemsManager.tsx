"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadServiceImage } from "@/lib/storage";
import { limaDateInputToISOString } from "@/lib/limaTime";
import type { ServiceItem } from "@/lib/types";

export function ServiceItemsManager({
  serviceId,
  items,
  showLocation,
  showEventDate,
  nameLabel,
}: {
  serviceId: string;
  items: ServiceItem[];
  showLocation: boolean;
  showEventDate: boolean;
  nameLabel: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) =>
        editingId === item.id ? (
          <ItemForm
            key={item.id}
            serviceId={serviceId}
            initial={item}
            showLocation={showLocation}
            showEventDate={showEventDate}
            nameLabel={nameLabel}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <div
            key={item.id}
            className="p-3 rounded-2xl bg-bg-elevated border border-border flex gap-3"
          >
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-bg-card flex items-center justify-center text-xl shrink-0">
                🖼️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate">{item.name}</span>
                {!item.is_active && (
                  <span className="text-[10px] text-muted border border-border rounded-full px-2 py-0.5 shrink-0">
                    Oculto
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-muted mt-0.5 line-clamp-1">{item.description}</p>
              )}
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(item.id)}
                  className="text-xs text-brand font-semibold"
                >
                  Editar
                </button>
                <ToggleActiveButton item={item} />
                <DeleteButton itemId={item.id} />
              </div>
            </div>
          </div>
        )
      )}

      {!items.length && !adding && (
        <p className="text-sm text-muted">Todavía no hay nada cargado.</p>
      )}

      {adding ? (
        <ItemForm
          serviceId={serviceId}
          showLocation={showLocation}
          showEventDate={showEventDate}
          nameLabel={nameLabel}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="py-3.5 rounded-xl border border-dashed border-border text-sm text-brand font-bold"
        >
          + Agregar
        </button>
      )}
    </div>
  );
}

function ToggleActiveButton({ item }: { item: ServiceItem }) {
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
          .from("service_items")
          .update({ is_active: !item.is_active })
          .eq("id", item.id);
        router.refresh();
      }}
      className="text-xs text-muted font-semibold"
    >
      {item.is_active ? "Ocultar" : "Mostrar"}
    </button>
  );
}

function DeleteButton({ itemId }: { itemId: string }) {
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
          await supabase.from("service_items").delete().eq("id", itemId);
          router.refresh();
        }}
        className="text-xs text-danger font-semibold"
      >
        {saving ? "Eliminando..." : "¿Seguro? Confirmar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs text-danger font-semibold"
    >
      Eliminar
    </button>
  );
}

function ItemForm({
  serviceId,
  initial,
  showLocation,
  showEventDate,
  nameLabel,
  onDone,
}: {
  serviceId: string;
  initial?: ServiceItem;
  showLocation: boolean;
  showEventDate: boolean;
  nameLabel: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [eventDate, setEventDate] = useState(
    initial?.event_date ? initial.event_date.slice(0, 10) : ""
  );
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0;

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadServiceImage(file);
      setImageUrl(url);
    } catch {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      service_id: serviceId,
      name: name.trim(),
      description: description.trim() || null,
      location: showLocation ? location.trim() || null : null,
      price: price.trim() ? Number(price) : null,
      event_date: showEventDate && eventDate ? limaDateInputToISOString(eventDate) : null,
      image_url: imageUrl || null,
    };

    const { error } = initial
      ? await supabase.from("service_items").update(payload).eq("id", initial.id)
      : await supabase.from("service_items").insert(payload);

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
        <label className="block text-[10px] font-mono text-muted mb-2 tracking-wide">
          {nameLabel.toUpperCase()}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-[10px] font-mono text-muted mb-2 tracking-wide">
          DESCRIPCIÓN
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand resize-none"
        />
      </div>

      {showLocation && (
        <div>
          <label className="block text-[10px] font-mono text-muted mb-2 tracking-wide">
            UBICACIÓN
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej: Costa Verde, Barranco"
            className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
          />
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[10px] font-mono text-muted mb-2 tracking-wide">
            COSTO APROX. (S/)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Opcional"
            className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
          />
        </div>
        {showEventDate && (
          <div className="flex-1">
            <label className="block text-[10px] font-mono text-muted mb-2 tracking-wide">
              FECHA
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-mono text-muted mb-2 tracking-wide">
          FOTO
        </label>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={uploading}
          className="w-full text-xs text-muted"
        />
        {uploading && <p className="text-xs text-muted mt-1">Subiendo...</p>}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2.5 rounded-xl border border-border text-xs text-muted"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!canSave || saving || uploading}
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
