"use client";

import { createClient } from "@/lib/supabase/client";

export type SavedLocation = {
  id: string;
  label: string;
  address_text: string;
};

export async function fetchMyLocations(): Promise<SavedLocation[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("client_locations")
    .select("id, label, address_text")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function saveLocation(label: string, addressText: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("client_locations").insert({
    client_id: user.id,
    label,
    address_text: addressText,
  });
}
