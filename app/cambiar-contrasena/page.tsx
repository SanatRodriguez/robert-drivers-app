"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CambiarContrasenaPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setLoading(false);
      setError("No se pudo verificar tu sesión. Vuelve a ingresar.");
      return;
    }

    // Verifica la contraseña actual antes de cambiarla.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      setLoading(false);
      setError("Tu contraseña actual no es correcta.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
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

  return (
    <div className="flex-1 flex flex-col justify-center">
      <Link href="/" className="text-sm text-muted mb-4 w-fit">
        ← Volver al inicio
      </Link>
      <h1 className="text-2xl font-extrabold mb-1">Cambiar contraseña</h1>
      <p className="text-sm text-muted mb-6">Robert's Drivers</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-mono text-muted mb-2 tracking-wide">
            CONTRASEÑA ACTUAL
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
            placeholder="••••••••"
          />
        </div>
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
            REPITE LA NUEVA CONTRASEÑA
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
