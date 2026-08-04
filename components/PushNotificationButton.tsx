"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, getPushSubscriptionStatus } from "@/lib/push";

export function PushNotificationButton({ adminId }: { adminId: string }) {
  const [status, setStatus] = useState<"unsupported" | "granted" | "denied" | "default">(
    "default"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPushSubscriptionStatus().then(setStatus);
  }, []);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await subscribeToPush(adminId);
      setStatus("granted");
    } catch (e: any) {
      setError(e?.message || "No se pudo activar.");
    }
    setLoading(false);
  }

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <span className="text-xs font-bold text-whatsapp border border-border rounded-full px-3 py-1.5">
        🔔 Notificaciones activas
      </span>
    );
  }

  if (status === "denied") {
    return (
      <span className="text-xs text-muted border border-border rounded-full px-3 py-1.5">
        🔕 Bloqueadas — actívalas desde ajustes del navegador
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-bold text-brand border border-brand/40 rounded-full px-3 py-1.5 disabled:opacity-60"
      >
        {loading ? "Activando..." : "🔔 Activar notificaciones"}
      </button>
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  );
}
