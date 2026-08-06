import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { QueueListManager } from "@/components/QueueListManager";
import type { DriverQueue } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminColaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/cola");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: queues } = await supabase
    .from("driver_queues")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<DriverQueue[]>();

  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/admin" className="text-sm text-muted mb-4 w-fit">
        ← Panel
      </Link>
      <p className="text-sm font-mono text-muted mb-1">EVENTOS</p>
      <h1 className="text-2xl font-extrabold mb-6">Colas de conductores</h1>
      <QueueListManager queues={queues || []} />
    </div>
  );
}
