"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatLimaDateTime } from "@/lib/limaTime";
import type { DriverQueue } from "@/lib/types";

export function QueueListManager({ queues }: { queues: DriverQueue[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("driver_queues")
      .insert({ name: name.trim() })
      .select("id")
      .single();
    setSaving(false);
    if (!error && data) {
      router.push(`/admin/cola/${data.id}`);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {queues.map((q) => (
        <Link
          key={q.id}
          href={`/admin/cola/${q.id}`}
          className="flex items-center justify-between p-4 rounded-2xl bg-bg-elevated border border-border"
        >
          <div>
            <div className="font-extrabold text-sm">{q.name}</div>
            <div className="text-sm text-muted mt-0.5">{formatLimaDateTime(q.created_at)}</div>
          </div>
          <div className="text-muted text-lg">›</div>
        </Link>
      ))}

      {!queues.length && !creating && (
        <p className="text-sm text-muted">Todavía no hay colas creadas.</p>
      )}

      {creating ? (
        <div className="p-4 rounded-2xl bg-bg-elevated border border-border space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ej: "Cochinola 30 ago"'
            className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!name.trim() || saving}
              onClick={handleCreate}
              className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-40"
            >
              {saving ? "Creando..." : "Crear cola"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="py-3.5 rounded-xl border border-dashed border-border text-sm text-brand font-bold"
        >
          + Nueva cola
        </button>
      )}
    </div>
  );
}
