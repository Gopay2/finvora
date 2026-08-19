import { createClient } from "./supabase/server";

/**
 * Estructura del perfil de usuario y sus permisos.
 */
export interface UserProfile {
  /** Identificador único UUID del usuario. Null si no hay sesión activa. */
  id: string | null;
  /** Rol del usuario asignado en el sistema (por ejemplo, Admin, Closer, Supervisor, etc.) */
  role: string;
  /** Nombre de usuario opcional registrado en la tabla de perfiles */
  username: string | null;
}

/**
 * Obtiene la información del usuario autenticado actualmente y
 * consulta su rol y nombre de usuario correspondientes en la tabla "perfiles" en Supabase.
 * 
 * Si no hay sesión de usuario activa, devuelve un perfil por defecto con rol "Sin rol".
 * 
 * @returns {Promise<UserProfile>} Objeto con el id del usuario, su rol y su username.
 */
export async function getUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { id: null, role: "Sin rol", username: null };
  }

  const { data: profile } = await supabase
    .from("perfiles")
    .select("id, role, username")
    .eq("id", user.id)
    .single();
    
  return {
    id: profile?.id || user.id,
    role: profile?.role || "Sin rol",
    username: profile?.username || null
  };
}

/**
 * Verifica si el rol del usuario está en la lista permitida.
 * Devuelve true si está permitido, false si no.
 */
export function isAllowed(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}
