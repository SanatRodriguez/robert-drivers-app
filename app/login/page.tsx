"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { checkLoginLock, registerFailedLogin, clearLoginAttempts, minutesUntil } from "@/lib/loginAttempts";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const lockedUntil = await checkLoginLock(email);
    if (lockedUntil) {
      setError(
        `Cuenta bloqueada por varios intentos fallidos. Intenta de nuevo en ${minutesUntil(lockedUntil)} min.`
      );
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const newLock = await registerFailedLogin(email);
      setLoading(false);
      setError(
        newLock
          ? `Demasiados intentos fallidos. Cuenta bloqueada por 1 hora.`
          : "Correo o contraseña incorrectos."
      );
      return;
    }

    await clearLoginAttempts(email);
    setLoading(false);
    router.push(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-512.png" alt="Robert's Drivers" className="w-32 h-32 rounded-2xl mx-auto mb-5" />
      <h1 className="text-2xl font-extrabold mb-1 text-center">Ingresa a tu cuenta</h1>
      <p className="text-sm text-muted mb-6 text-center">Robert's Drivers</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-muted mb-2 tracking-wide">
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
        <div>
          <label className="block text-xs font-mono text-muted mb-2 tracking-wide">
            CONTRASEÑA
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
            placeholder="••••••••"
          />
          <Link href="/recuperar-contrasena" className="block text-xs text-brand font-semibold mt-2">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-brand font-semibold">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
