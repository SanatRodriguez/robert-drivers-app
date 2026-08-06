"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { QueueEntry } from "@/lib/types";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function QueueManager({
  queueId,
  queueName,
  entries,
  allDrivers,
}: {
  queueId: string;
  queueName: string;
  entries: QueueEntry[];
  allDrivers: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const waiting = entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const pool = entries.filter((e) => e.status === "pool");

  const [localWaiting, setLocalWaiting] = useState(waiting);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setLocalWaiting(waiting), [entries]);

  const dragStateRef = useRef<{ id: string; startIndex: number } | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);

  async function addToQueue(entryId: string) {
    setBusyId(entryId);
    setActionError(null);
    const supabase = createClient();
    const nextPosition = (waiting.at(-1)?.position ?? 0) + 1;
    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "waiting", position: nextPosition })
      .eq("id", entryId);
    setBusyId(null);
    if (error) {
      setActionError("No se pudo agregar a la fila. Intenta de nuevo.");
      return;
    }
    router.refresh();
  }

  // Se usa tanto para "Listo" (le tocó turno) como "Retirar" (se bajó de
  // la fila sin ser llamado) — en ambos casos vuelve a estar disponible
  // en "Participantes" para sumarlo de nuevo más tarde, nunca desaparece.
  async function returnToPool(entryId: string) {
    setBusyId(entryId);
    setActionError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "pool", position: null })
      .eq("id", entryId);
    setBusyId(null);
    if (error) {
      setActionError("No se pudo actualizar. Intenta de nuevo.");
      return;
    }
    router.refresh();
  }

  // Distinto de returnToPool: esto sí lo saca por completo del evento
  // (ej: se bajó del todo, no va a participar). Solo disponible desde
  // "Participantes", no desde la fila en vivo.
  async function removeFromEvent(entryId: string) {
    setBusyId(entryId);
    setActionError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "removed", position: null })
      .eq("id", entryId);
    setBusyId(null);
    if (error) {
      setActionError("No se pudo quitar. Intenta de nuevo.");
      return;
    }
    router.refresh();
  }

  function handleDragStart(e: React.PointerEvent, id: string, index: number) {
    if (busyId) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = { id, startIndex: index };
    setDraggingId(id);
  }

  function handleDragMove(e: React.PointerEvent) {
    if (!dragStateRef.current) return;
    const y = e.clientY;
    let targetIndex = 0;
    for (let i = 0; i < localWaiting.length; i++) {
      const el = rowRefs.current[localWaiting[i].id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y > rect.top + rect.height / 2) targetIndex = i + 1;
    }
    targetIndex = Math.min(targetIndex, localWaiting.length - 1);
    const currentIndex = localWaiting.findIndex((x) => x.id === dragStateRef.current!.id);
    if (targetIndex !== currentIndex && currentIndex !== -1) {
      setLocalWaiting((prev) => {
        const next = [...prev];
        const [moved] = next.splice(currentIndex, 1);
        next.splice(targetIndex, 0, moved);
        return next;
      });
    }
  }

  async function handleDragEnd() {
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    setDraggingId(null);
    if (!drag) return;
    const finalIndex = localWaiting.findIndex((x) => x.id === drag.id);
    if (finalIndex === drag.startIndex) return;

    setActionError(null);
    setBusyId(drag.id);
    const supabase = createClient();
    const { error } = await supabase.from("queue_entries").upsert(
      localWaiting.map((entry, i) => ({
        id: entry.id,
        queue_id: entry.queue_id,
        driver_id: entry.driver_id,
        status: "waiting" as const,
        position: i + 1,
      }))
    );
    setBusyId(null);
    if (error) {
      setActionError("No se pudo reordenar. Intenta de nuevo.");
      setLocalWaiting(waiting);
      return;
    }
    router.refresh();
  }

  async function handleCopy() {
    const text = [
      `🚦 Cola - ${queueName}`,
      ...localWaiting.map((e, i) => `${i + 1}. ${e.drivers.full_name}`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleCopy}
        disabled={!localWaiting.length}
        className="w-full py-3.5 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-40"
      >
        {copied ? "✓ Copiado" : "📋 Copiar cola para WhatsApp"}
      </button>

      {actionError && <p className="text-sm text-danger">{actionError}</p>}

      <div>
        <h2 className="font-extrabold text-base mb-1">En espera ({localWaiting.length})</h2>
        {localWaiting.length > 0 && (
          <p className="text-[12px] text-muted mb-3">
            ⠿ Arrastra para reordenar · ✓ Listo · ↩ Retirar
          </p>
        )}
        {!localWaiting.length && (
          <p className="text-sm text-muted">Todavía nadie está en la fila.</p>
        )}
        <div className="flex flex-col gap-2">
          {localWaiting.map((e, i) => (
            <div
              key={e.id}
              ref={(el) => {
                rowRefs.current[e.id] = el;
              }}
              className={`flex items-center gap-2 p-3 rounded-2xl bg-bg-elevated border ${
                draggingId === e.id ? "border-brand" : "border-border"
              }`}
            >
              <div
                onPointerDown={(ev) => handleDragStart(ev, e.id, i)}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
                style={{ touchAction: "none" }}
                className="w-7 h-9 flex items-center justify-center text-muted shrink-0 select-none text-lg"
              >
                ⠿
              </div>
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm font-extrabold text-white shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{e.drivers.full_name}</div>
                <div className="text-sm text-muted truncate">
                  {[e.drivers.plate, e.drivers.seats ? `${e.drivers.seats} asientos` : null]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => returnToPool(e.id)}
                  aria-label="Listo"
                  title="Listo"
                  className="w-8 h-8 rounded-lg border border-whatsapp text-whatsapp flex items-center justify-center font-bold disabled:opacity-40"
                >
                  ✓
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => returnToPool(e.id)}
                  aria-label="Retirar"
                  title="Retirar"
                  className="w-8 h-8 rounded-lg border border-border text-muted flex items-center justify-center font-bold disabled:opacity-40"
                >
                  ↩
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PoolSection pool={pool} onAdd={addToQueue} onRemove={removeFromEvent} busyId={busyId} />
      <AddParticipantsForm
        queueId={queueId}
        allDrivers={allDrivers}
        existingEntries={entries.map((e) => ({ id: e.id, driver_id: e.driver_id, status: e.status }))}
      />
    </div>
  );
}

function PoolSection({
  pool,
  onAdd,
  onRemove,
  busyId,
}: {
  pool: QueueEntry[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  busyId: string | null;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? pool.filter((e) => normalize(e.drivers.full_name).includes(normalize(query)))
    : pool;

  return (
    <div>
      <h2 className="font-extrabold text-base mb-3">Participantes disponibles ({pool.length})</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre..."
        className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand mb-3"
      />
      {!pool.length && (
        <p className="text-sm text-muted">Agrega participantes abajo para empezar.</p>
      )}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {filtered.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-2 p-3 rounded-xl bg-bg-elevated border border-border"
          >
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => onAdd(e.id)}
              className="flex-1 flex items-center justify-between gap-3 text-left disabled:opacity-50 min-w-0"
            >
              <span className="font-semibold text-sm truncate">{e.drivers.full_name}</span>
              <span className="text-sm text-brand font-bold shrink-0">+ Agregar</span>
            </button>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => onRemove(e.id)}
              aria-label="Quitar del evento"
              title="Quitar del evento"
              className="w-8 h-8 rounded-lg border border-danger text-danger flex items-center justify-center font-bold shrink-0 disabled:opacity-40"
            >
              ✕
            </button>
          </div>
        ))}
        {query.trim() && !filtered.length && (
          <p className="text-sm text-muted">Sin resultados para &quot;{query}&quot;.</p>
        )}
      </div>
    </div>
  );
}

function AddParticipantsForm({
  queueId,
  allDrivers,
  existingEntries,
}: {
  queueId: string;
  allDrivers: { id: string; full_name: string }[];
  existingEntries: { id: string; driver_id: string; status: string }[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ matched: number; created: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const names = text.split("\n").map((n) => n.trim()).filter(Boolean);
    if (!names.length) return;
    setSaving(true);
    setResult(null);
    setError(null);
    const supabase = createClient();

    const existingByDriverId = new Map(existingEntries.map((e) => [e.driver_id, e]));

    const unmatchedNames: string[] = [];
    const matchedIds: string[] = [];
    for (const name of names) {
      const norm = normalize(name);
      const found = allDrivers.find((d) => normalize(d.full_name) === norm);
      if (found) matchedIds.push(found.id);
      else unmatchedNames.push(name);
    }

    let createdIds: string[] = [];
    if (unmatchedNames.length) {
      const { data, error: driversError } = await supabase
        .from("drivers")
        .insert(unmatchedNames.map((full_name) => ({ full_name })))
        .select("id");
      if (driversError) {
        setSaving(false);
        setError("No se pudieron crear los conductores nuevos. No se agregó nadie — intenta de nuevo.");
        return;
      }
      createdIds = (data || []).map((d) => d.id);
    }

    const allIds = [...new Set([...matchedIds, ...createdIds])];
    const toInsert = allIds.filter((id) => !existingByDriverId.has(id));
    const toRevive = allIds.filter((id) => existingByDriverId.get(id)?.status === "removed");

    let mutationError = false;
    if (toInsert.length) {
      const { error: insertError } = await supabase
        .from("queue_entries")
        .insert(toInsert.map((driver_id) => ({ queue_id: queueId, driver_id, status: "pool" as const })));
      if (insertError) mutationError = true;
    }
    if (toRevive.length) {
      const { error: reviveError } = await supabase
        .from("queue_entries")
        .update({ status: "pool" })
        .in("id", toRevive.map((id) => existingByDriverId.get(id)!.id));
      if (reviveError) mutationError = true;
    }

    setSaving(false);
    if (mutationError) {
      setError(
        "Los conductores se reconocieron/crearon, pero algunos no se pudieron sumar a esta cola. Vuelve a pegar los mismos nombres para reintentar."
      );
      router.refresh();
      return;
    }
    setResult({ matched: matchedIds.length, created: createdIds.length });
    setText("");
    router.refresh();
  }

  return (
    <div className="p-4 rounded-2xl bg-bg-elevated border border-border space-y-3">
      <h2 className="font-extrabold text-base">Agregar participantes</h2>
      <p className="text-sm text-muted">
        Pega los nombres de los conductores que participan hoy, uno por línea. Si el nombre ya
        existe en tu base de conductores lo reconoce solo; si es nuevo, lo crea automáticamente.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"Juan Pérez\nMaría Gómez\nCarlos Ruiz"}
        className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
      />
      {result && (
        <p className="text-sm text-whatsapp">
          ✓ {result.matched} reconocidos, {result.created} nuevos agregados a tu base de conductores.
        </p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        disabled={!text.trim() || saving}
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-40"
      >
        {saving ? "Agregando..." : "Agregar a la cola"}
      </button>
    </div>
  );
}
