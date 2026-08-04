"use client";

import { createClient } from "@/lib/supabase/client";
import type { Location } from "@/lib/types";

export async function createBooking(params: {
  serviceSlug: string;
  serviceItemId?: string | null;
  formData: Record<string, string>;
  origin?: Location | null;
  destination?: Location | null;
  scheduledFor?: string | null;
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa");

  const { data: service } = await supabase
    .from("services")
    .select("id, name")
    .eq("slug", params.serviceSlug)
    .single();

  if (!service) throw new Error("Servicio no encontrado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      client_id: user.id,
      service_id: service.id,
      service_item_id: params.serviceItemId || null,
      form_data: params.formData,
      origin_location: params.origin || null,
      destination_location: params.destination || null,
      scheduled_for: params.scheduledFor || null,
    })
    .select("id, ticket_code")
    .single();

  if (error) throw error;

  await supabase.from("booking_events").insert({
    booking_id: data.id,
    event_type: "created",
  });

  return {
    ...data,
    serviceName: service.name as string,
    clientName: (profile?.full_name as string) || "un cliente",
  };
}
