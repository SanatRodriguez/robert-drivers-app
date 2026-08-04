"use client";

export type GalleryItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  location: string | null;
  event_date: string | null;
  image_url: string | null;
};

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
            {selected.event_date && <span>📅 {formatEventDate(selected.event_date)}</span>}
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
    <div className="grid grid-cols-2 gap-3">
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
              className="w-full h-24 object-cover"
            />
          ) : (
            <div className="w-full h-24 bg-bg-card flex items-center justify-center text-2xl">
              🖼️
            </div>
          )}
          <div className="p-2.5">
            <div className="font-bold text-xs leading-tight">{item.name}</div>
            {item.description && (
              <div className="text-[11px] text-muted mt-1 line-clamp-2">
                {item.description}
              </div>
            )}
            {item.price !== null && (
              <div className="text-[11px] text-brand font-bold mt-1">S/{item.price}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
