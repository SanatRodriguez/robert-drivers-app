"use client";

import { createClient } from "@/lib/supabase/client";

// Bloqueo de cuenta tras 5 intentos fallidos, por 1 hora — respaldado en la
// base de datos (no en el dispositivo) para que no se pueda saltar limpiando
// el navegador.

export async function checkLoginLock(email: string): Promise<Date | null> {
  const supabase = createClient();
  const { data } = await supabase.rpc("check_login_lock", { p_email: email });
  return data ? new Date(data) : null;
}

export async function registerFailedLogin(email: string): Promise<Date | null> {
  const supabase = createClient();
  const { data } = await supabase.rpc("register_failed_login", { p_email: email });
  return data ? new Date(data) : null;
}

export async function clearLoginAttempts(email: string): Promise<void> {
  const supabase = createClient();
  await supabase.rpc("clear_login_attempts", { p_email: email });
}

export function minutesUntil(date: Date): number {
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 60000));
}
