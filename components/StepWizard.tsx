"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

export function StepWizard({
  steps,
  onFinish,
  finishLabel = "Enviar",
  submitting = false,
  backHref = "/",
}: {
  steps: { title: string; content: ReactNode; canAdvance?: boolean }[];
  onFinish: () => void;
  finishLabel?: string;
  submitting?: boolean;
  backHref?: string;
}) {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="flex-1 flex flex-col">
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-sm text-muted mb-4 w-fit"
      >
        ← Volver a servicios
      </Link>

      <div className="flex items-center gap-1.5 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? "bg-brand" : "bg-bg-elevated"
            }`}
          />
        ))}
      </div>

      <div
        key={step}
        className="flex-1 flex flex-col animate-[fadeSlide_.25s_ease]"
      >
        <h2 className="text-lg font-extrabold mb-5">{current.title}</h2>
        <div className="flex-1">{current.content}</div>
      </div>

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-5 py-3.5 rounded-xl border border-border text-sm text-muted"
          >
            ← Atrás
          </button>
        )}
        <button
          disabled={current.canAdvance === false || submitting}
          onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}
          className="flex-1 py-3.5 rounded-xl bg-brand font-bold text-sm disabled:opacity-40"
        >
          {isLast ? (submitting ? "Enviando..." : finishLabel) : "Siguiente →"}
        </button>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export function PillGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2.5 rounded-full text-sm border ${
            value === opt
              ? "bg-brand border-brand font-bold"
              : "bg-bg-elevated border-border"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3.5 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
    />
  );
}
