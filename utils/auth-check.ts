import { createClient } from "./supabase/server";

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("perfiles")
    .select("role, username")
    .single();
    
  return {
    role: profile?.role || "Closer",
    username: profile?.username || null
  };
}

/**
 * Verifica si el rol del usuario está en la lista permitida.
 * Devuelve true si está permitido, false si no.
 */
export function isAllowed(userRole: string, allowedRoles: string[]) {
  return allowedRoles.includes(userRole);
}
