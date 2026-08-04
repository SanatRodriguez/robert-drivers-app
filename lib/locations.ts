"use client";

import { createClient } from "@/lib/supabase/client";
import type { Location } from "@/lib/types";

export type SavedLocation = {
  id: string;
  label: string;
  address_text: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
};

export async function fetchMyLocations(): Promise<SavedLocation[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("client_locations")
    .select("id, label, address_text, lat, lng, is_default")
    .eq("client_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return data || [];
}

export async function saveLocation(label: string, location: Location, isDefault = false) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (isDefault) {
    await supabase
      .from("client_locations")
      .update({ is_default: false })
      .eq("client_id", user.id);
  }
  await supabase.from("client_locations").insert({
    client_id: user.id,
    label,
    address_text: location.address_text,
    lat: location.lat,
    lng: location.lng,
    is_default: isDefault,
  });
}

export async function updateLocation(
  id: string,
  patch: { label: string; address_text: string; lat: number | null; lng: number | null }
) {
  const supabase = createClient();
  await supabase.from("client_locations").update(patch).eq("id", id);
}

export async function deleteLocation(id: string) {
  const supabase = createClient();
  await supabase.from("client_locations").delete().eq("id", id);
}

export async function setDefaultLocation(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("client_locations")
    .update({ is_default: false })
    .eq("client_id", user.id);
  await supabase.from("client_locations").update({ is_default: true }).eq("id", id);
}
