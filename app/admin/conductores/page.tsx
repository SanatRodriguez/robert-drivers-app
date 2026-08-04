import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DriversManager, type Driver } from "@/components/DriversManager";

export const dynamic = "force-dynamic";

export default async function AdminConductoresPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/conductores");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("full_name")
    .returns<Driver[]>();

  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/admin" className="text-sm text-muted mb-4 w-fit">
        ← Panel
      </Link>
      <p className="text-xs font-mono text-muted mb-1">CONDUCTORES</p>
      <h1 className="text-2xl font-extrabold mb-6">Gestionar conductores</h1>

      <DriversManager drivers={drivers || []} />
    </div>
  );
}
