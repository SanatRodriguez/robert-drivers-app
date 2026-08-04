"use client";

import { formatLimaDateTime } from "@/lib/limaTime";

export type GalleryItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  location: string | null;
  event_date: string | null;
  image_url: string | null;
};

export function ItemGallery({
  items,
  selectedId,
  onSelect,
  emptyLabel,
}: {
  items: GalleryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted">
        {emptyLabel || "Todavía no hay opciones cargadas — Robert las agrega desde su panel."}
      </p>
    );
  }

  const selected = items.find((i) => i.id === selectedId);

  if (selected) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-bg-elevated">
        {selected.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.image_url}
            alt={selected.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-bg-card flex items-center justify-center text-3xl">
            🖼️
          </div>
        )}
        <div className="p-4 space-y-2">
          <h3 className="font-extrabold text-base">{selected.name}</h3>
          {selected.description && (
            <p className="text-sm text-muted">{selected.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted pt-1">
            {selected.location && <span>📍 {selected.location}</span>}
            {selected.price !== null && (
              <span className="text-brand font-bold">💵 S/{selected.price}</span>
            )}
            {selected.event_date && <span>📅 {formatLimaDateTime(selected.event_date)}</span>}
          </div>
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-xs text-brand font-semibold pt-2"
          >
            ← Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className="text-left rounded-2xl overflow-hidden border border-border bg-bg-elevated"
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-bg-card flex items-center justify-center text-3xl">
              🖼️
            </div>
          )}
          <div className="p-3.5">
            <div className="font-bold text-sm leading-tight">{item.name}</div>
            {item.description && (
              <div className="text-xs text-muted mt-1 line-clamp-2">{item.description}</div>
            )}
            <div className="flex gap-3 mt-1.5">
              {item.location && <span className="text-xs text-muted">📍 {item.location}</span>}
              {item.price !== null && (
                <span className="text-xs text-brand font-bold">💵 S/{item.price}</span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
