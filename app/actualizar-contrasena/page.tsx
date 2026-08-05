"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ActualizarContrasenaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 1500);
  }

  if (done) {
    return (
      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-2xl font-extrabold mb-2">✓ Contraseña actualizada</h1>
        <p className="text-sm text-muted">Te llevamos al inicio...</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex-1 flex flex-col justify-center text-center">
        <p className="text-sm text-muted">
          Este link ya no es válido o expiró. Pide uno nuevo desde{" "}
          <a href="/recuperar-contrasena" className="text-brand font-semibold">
            recuperar contraseña
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center">
      <h1 className="text-2xl font-extrabold mb-1 text-center">Crea una nueva contraseña</h1>
      <p className="text-sm text-muted mb-6 text-center">Robert's Drivers</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-mono text-muted mb-2 tracking-wide">
            NUEVA CONTRASEÑA
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div>
          <label className="block text-sm font-mono text-muted mb-2 tracking-wide">
            REPITE LA CONTRASEÑA
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
