"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+51");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: `${phonePrefix.trim()} ${phoneNumber.trim()}`,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex-1 flex flex-col justify-center text-center">
        <h1 className="text-2xl font-extrabold mb-2">Revisa tu correo</h1>
        <p className="text-sm text-muted mb-6">
          Te mandamos un link para confirmar tu cuenta antes de ingresar.
        </p>
        <Link href="/login" className="text-brand font-semibold text-sm">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-512.png" alt="Robert's Drivers" className="w-32 h-32 rounded-2xl mx-auto mb-5" />
      <h1 className="text-2xl font-extrabold mb-1 text-center">Crea tu cuenta</h1>
      <p className="text-sm text-muted mb-6 text-center">Robert's Drivers</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-mono text-muted mb-2 tracking-wide">
            TU NOMBRE
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
            placeholder="Ana Pérez"
          />
        </div>
        <div>
          <label className="block text-sm font-mono text-muted mb-2 tracking-wide">
            CELULAR
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={phonePrefix}
              onChange={(e) => setPhonePrefix(e.target.value)}
              className="w-16 px-3 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand text-center"
              placeholder="+51"
            />
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-bg-elevated border border-border text-sm outline-none focus:border-brand"
              placeholder="987 654 321"
            />
          </div>
        </div>
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
        <div>
          <label className="block text-sm font-mono text-muted mb-2 tracking-wide">
            CONTRASEÑA
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

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-60"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand font-semibold">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
