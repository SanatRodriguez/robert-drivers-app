"use client";

import { useState } from "react";
import {
  TERMS_SECTIONS,
  PRIVACY_SECTIONS,
  TERMS_UPDATED,
  PRIVACY_UPDATED,
} from "@/lib/legalContent";

export function LegalModal({
  initialTab,
  onClose,
}: {
  initialTab: "terminos" | "privacidad";
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"terminos" | "privacidad">(initialTab);
  const sections = tab === "terminos" ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const updated = tab === "terminos" ? TERMS_UPDATED : PRIVACY_UPDATED;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[85vh] bg-bg-elevated border border-border rounded-t-2xl sm:rounded-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("terminos")}
              className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                tab === "terminos" ? "bg-brand text-white" : "text-muted"
              }`}
            >
              Términos
            </button>
            <button
              type="button"
              onClick={() => setTab("privacidad")}
              className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                tab === "privacidad" ? "bg-brand text-white" : "text-muted"
              }`}
            >
              Privacidad
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted text-lg"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          <p className="text-[13px] text-muted">Última actualización: {updated}</p>
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
              <div className="text-sm text-muted leading-relaxed">{s.body}</div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
