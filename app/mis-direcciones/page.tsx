import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LocationManager } from "@/components/LocationManager";

export const dynamic = "force-dynamic";

export default async function MisDireccionesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mis-direcciones");

  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/" className="text-sm text-muted mb-4 w-fit">
        ← Volver al inicio
      </Link>
      <p className="text-sm font-mono text-muted mb-1">MIS DIRECCIONES</p>
      <h1 className="text-2xl font-extrabold mb-1">Ubicaciones guardadas</h1>
      <p className="text-sm text-muted mb-6">
        Úsalas para pedir Viajes o Chofer de reemplazo más rápido.
      </p>
      <LocationManager />
    </div>
  );
}
