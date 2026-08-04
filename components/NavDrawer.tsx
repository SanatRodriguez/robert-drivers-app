"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function NavDrawer({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="w-9 h-9 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-sm mb-3"
      >
        ☰
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[80%] h-full bg-bg-elevated border-r border-border p-5 flex flex-col animate-[slideIn_.2s_ease]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="self-end text-muted text-lg mb-6"
            >
              ✕
            </button>
            <nav className="flex flex-col">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold border-b border-border"
              >
                🏠 Inicio
              </Link>
              <Link
                href="/mis-direcciones"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold border-b border-border"
              >
                📍 Mis direcciones
              </Link>
              <Link
                href="/mis-reservas"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold border-b border-border"
              >
                🧳 Mis viajes
              </Link>
              <Link
                href="/cambiar-contrasena"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold border-b border-border"
              >
                🔒 Cambiar contraseña
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm font-semibold border-b border-border"
                >
                  🛠️ Panel de administración
                </Link>
              )}
            </nav>
            <div className="mt-auto pt-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
