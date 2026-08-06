"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/lib/types";

export function ServiceToggleList({ services }: { services: Service[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleToggle(service: Service) {
    setPendingId(service.id);
    const supabase = createClient();
    await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);
    router.refresh();
    setPendingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {services.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-4 p-4 rounded-2xl bg-bg-elevated border border-border"
        >
          <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center text-lg shrink-0">
            {s.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm">{s.name}</div>
            <div className="text-sm text-muted mt-0.5">
              {s.is_active ? "Visible para los clientes" : "Oculto para los clientes"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle(s)}
            disabled={pendingId === s.id}
            aria-label={s.is_active ? `Desactivar ${s.name}` : `Activar ${s.name}`}
            className={`shrink-0 w-14 h-8 rounded-full border transition disabled:opacity-50 relative ${
              s.is_active ? "bg-brand border-brand" : "bg-bg border-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                s.is_active ? "left-[calc(100%-1.625rem)]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
