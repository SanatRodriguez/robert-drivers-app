import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { QueueManager } from "@/components/QueueManager";
import type { QueueEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminColaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/cola/${params.id}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: queue } = await supabase
    .from("driver_queues")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!queue) notFound();

  const { data: entries } = await supabase
    .from("queue_entries")
    .select("*, drivers(id, full_name, car_model, plate, seats)")
    .eq("queue_id", params.id)
    .returns<QueueEntry[]>();

  const { data: allDrivers } = await supabase
    .from("drivers")
    .select("id, full_name")
    .order("full_name");

  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/admin/cola" className="text-sm text-muted mb-4 w-fit">
        ← Colas
      </Link>
      <p className="text-sm font-mono text-muted mb-1">COLA DE CONDUCTORES</p>
      <h1 className="text-2xl font-extrabold mb-6">{queue.name}</h1>

      <QueueManager
        queueId={queue.id}
        queueName={queue.name}
        entries={entries || []}
        allDrivers={allDrivers || []}
      />
    </div>
  );
}
