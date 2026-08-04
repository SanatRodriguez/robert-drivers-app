import { createClient } from "@/lib/supabase/server";
import { FullDayWizard } from "@/components/FullDayWizard";

export const dynamic = "force-dynamic";

export default async function FullDayPage() {
  const supabase = createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("slug", "full-day")
    .single();

  const { data: paquetes } = await supabase
    .from("service_items")
    .select("id, name, price")
    .eq("service_id", service?.id)
    .eq("is_active", true)
    .order("sort_order");

  return <FullDayWizard paquetes={paquetes || []} />;
}
