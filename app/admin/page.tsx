import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminBookingsList } from "@/components/AdminBookingsList";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, ticket_code, status, created_at, services(name, icon), client:profiles!bookings_client_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  return (
    <div className="flex-1 flex flex-col py-4">
      <p className="text-xs font-mono text-muted mb-1">PANEL DE ROBERT</p>
      <h1 className="text-2xl font-extrabold mb-4">Reservas</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/eventos"
          className="text-xs font-bold text-brand border border-brand/40 rounded-full px-3 py-1.5"
        >
          🎫 Eventos
        </Link>
        <Link
          href="/admin/full-day"
          className="text-xs font-bold text-brand border border-brand/40 rounded-full px-3 py-1.5"
        >
          ☀️ Full day
        </Link>
      </div>

      <AdminBookingsList initialBookings={(bookings as any) || []} />
    </div>
  );
}
