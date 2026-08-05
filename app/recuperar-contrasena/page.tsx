"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    setLoading(false);
    if (error) {
      setError("No se pudo enviar el correo. Intenta de nuevo.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-2xl font-extrabold mb-2">Revisa tu correo</h1>
        <p className="text-sm text-muted mb-6">
          Si {email} tiene una cuenta, te mandamos un link para crear una nueva contraseña.
        </p>
        <Link href="/login" className="text-brand font-semibold text-sm">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center">
      <h1 className="text-2xl font-extrabold mb-1 text-center">Recupera tu contraseña</h1>
      <p className="text-sm text-muted mb-6 text-center">
        Te mandamos un link a tu correo para crear una nueva.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-mono text-muted mb-2 tracking-wide">
            CORREO
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
            placeholder="tu@correo.com"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        <Link href="/login" className="text-brand font-semibold">
          ← Volver a ingresar
        </Link>
      </p>
    </div>
  );
}
