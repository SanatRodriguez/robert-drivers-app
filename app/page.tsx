import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import type { Service } from "@/lib/types";

export const dynamic = "force-dynamic";

function greeting() {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const hour = parseInt(hourStr, 10);
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default async function HomePage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .returns<Service[]>();

  let firstName = "";
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    firstName = profile?.full_name?.split(" ")[0] || "";
    isAdmin = profile?.role === "admin";
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="pt-4 pb-2">
        {user ? (
          <p className="text-2xl font-extrabold mb-1">
            {greeting()}, {firstName || "de nuevo"} 👋
          </p>
        ) : (
          <p className="text-sm text-muted mb-1">
            <Link href="/login" className="text-brand font-semibold">Ingresa</Link> para pedir un servicio
          </p>
        )}
        <h1 className="text-base font-semibold text-muted">¿Qué servicio quieres pedir?</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {user && (
            <Link
              href="/mis-direcciones"
              className="inline-block text-xs font-bold text-brand border border-brand/40 rounded-full px-3 py-1.5"
            >
              📍 Mis direcciones
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-block text-xs font-bold text-brand border border-brand/40 rounded-full px-3 py-1.5"
            >
              🛠️ Panel de administración
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 mt-6">
        {services?.map((s) => (
          <Link
            key={s.id}
            href={`/servicios/${s.slug}`}
            className="flex items-center gap-4 p-4 rounded-2xl bg-bg-elevated border border-border"
          >
            <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center text-lg shrink-0">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm">{s.name}</div>
              <div className="text-xs text-muted mt-0.5">{s.description}</div>
            </div>
            <div className="text-muted text-lg">›</div>
          </Link>
        ))}
        {!services?.length && (
          <p className="text-sm text-muted">
            Aún no hay servicios cargados — se agregan desde el panel de Robert.
          </p>
        )}
      </div>

      <div className="mt-auto pt-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center font-extrabold text-sm text-white">
          R
        </div>
        <p className="text-xs text-muted leading-tight">
          <b className="text-ink">Robert</b> — 20 años en el rubro. Coordinación
          directa por WhatsApp.
        </p>
      </div>

      {user && (
        <div className="flex items-center gap-4 pt-4">
          <Link href="/mis-reservas" className="text-xs text-muted font-semibold">
            Mis viajes
          </Link>
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
