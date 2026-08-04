import { createClient } from "@/lib/supabase/server";
import { EventosWizard } from "@/components/EventosWizard";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const supabase = createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("slug", "eventos")
    .single();

  const { data: eventos } = await supabase
    .from("service_items")
    .select("id, name")
    .eq("service_id", service?.id)
    .eq("is_active", true)
    .order("sort_order");

  return <EventosWizard eventos={eventos || []} />;
}
