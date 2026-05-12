import { createClient } from "./supabase/server";

export async function getUserProfile() {
  const supabase = await createClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { id: null, role: "Closer", username: null };
  }

  const { data: profile } = await supabase
    .from("perfiles")
    .select("id, role, username")
    .eq("id", user.id)
    .single();
    
  return {
    id: profile?.id || user.id,
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
