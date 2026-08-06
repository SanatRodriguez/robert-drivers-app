"use client";

import { useState } from "react";
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

  const waiting = entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const pool = entries.filter((e) => e.status === "pool");

  async function addToQueue(entryId: string) {
    setBusyId(entryId);
    const supabase = createClient();
    const nextPosition = (waiting.at(-1)?.position ?? 0) + 1;
    await supabase
      .from("queue_entries")
      .update({ status: "waiting", position: nextPosition })
      .eq("id", entryId);
    router.refresh();
    setBusyId(null);
  }

  async function completeEntry(entryId: string) {
    setBusyId(entryId);
    const supabase = createClient();
    await supabase.from("queue_entries").update({ status: "pool", position: null }).eq("id", entryId);
    router.refresh();
    setBusyId(null);
  }

  async function removeEntry(entryId: string) {
    setBusyId(entryId);
    const supabase = createClient();
    await supabase.from("queue_entries").update({ status: "removed", position: null }).eq("id", entryId);
    router.refresh();
    setBusyId(null);
  }

  async function moveEntry(index: number, direction: -1 | 1) {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= waiting.length) return;
    const a = waiting[index];
    const b = waiting[otherIndex];
    setBusyId(a.id);
    const supabase = createClient();
    await Promise.all([
      supabase.from("queue_entries").update({ position: b.position }).eq("id", a.id),
      supabase.from("queue_entries").update({ position: a.position }).eq("id", b.id),
    ]);
    router.refresh();
    setBusyId(null);
  }

  async function handleCopy() {
    const text = [
      `🚦 Cola - ${queueName}`,
      ...waiting.map((e, i) => `${i + 1}. ${e.drivers.full_name}`),
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
        disabled={!waiting.length}
        className="w-full py-3.5 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-40"
      >
        {copied ? "✓ Copiado" : "📋 Copiar cola para WhatsApp"}
      </button>

      <div>
        <h2 className="font-extrabold text-base mb-3">En espera ({waiting.length})</h2>
        {!waiting.length && (
          <p className="text-sm text-muted">Todavía nadie está en la fila.</p>
        )}
        <div className="flex flex-col gap-2">
          {waiting.map((e, i) => (
            <div
              key={e.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-bg-elevated border border-border"
            >
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
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  disabled={i === 0 || busyId === e.id}
                  onClick={() => moveEntry(i, -1)}
                  className="w-7 h-7 rounded-lg border border-border text-sm disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={i === waiting.length - 1 || busyId === e.id}
                  onClick={() => moveEntry(i, 1)}
                  className="w-7 h-7 rounded-lg border border-border text-sm disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={busyId === e.id}
                  onClick={() => completeEntry(e.id)}
                  className="text-[12px] font-bold text-whatsapp px-2 py-1 rounded-full border border-whatsapp"
                >
                  ✓ Listo
                </button>
                <button
                  type="button"
                  disabled={busyId === e.id}
                  onClick={() => removeEntry(e.id)}
                  className="text-[12px] font-bold text-danger px-2 py-1 rounded-full border border-danger"
                >
                  ✕ Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PoolSection pool={pool} onAdd={addToQueue} busyId={busyId} />
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
  busyId,
}: {
  pool: QueueEntry[];
  onAdd: (id: string) => void;
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
          <button
            key={e.id}
            type="button"
            disabled={busyId === e.id}
            onClick={() => onAdd(e.id)}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-elevated border border-border text-left disabled:opacity-50"
          >
            <span className="font-semibold text-sm truncate">{e.drivers.full_name}</span>
            <span className="text-sm text-brand font-bold shrink-0">+ Agregar</span>
          </button>
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

  async function handleSave() {
    const names = text.split("\n").map((n) => n.trim()).filter(Boolean);
    if (!names.length) return;
    setSaving(true);
    setResult(null);
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
      const { data } = await supabase
        .from("drivers")
        .insert(unmatchedNames.map((full_name) => ({ full_name })))
        .select("id");
      createdIds = (data || []).map((d) => d.id);
    }

    const allIds = [...new Set([...matchedIds, ...createdIds])];
    const toInsert = allIds.filter((id) => !existingByDriverId.has(id));
    const toRevive = allIds.filter((id) => existingByDriverId.get(id)?.status === "removed");

    if (toInsert.length) {
      await supabase
        .from("queue_entries")
        .insert(toInsert.map((driver_id) => ({ queue_id: queueId, driver_id, status: "pool" as const })));
    }
    if (toRevive.length) {
      await supabase
        .from("queue_entries")
        .update({ status: "pool" })
        .in("id", toRevive.map((id) => existingByDriverId.get(id)!.id));
    }

    setSaving(false);
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
