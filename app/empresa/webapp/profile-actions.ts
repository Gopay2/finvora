'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Actualiza el nombre de usuario (username) en el perfil del usuario autenticado.
 * Verifica si el nombre ya existe para cumplir con la restricción de unicidad.
 */
export async function updateUsername(username: string) {
  const supabase = await createClient();

  // 1. Obtener el usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No se pudo autenticar al usuario." };
  }

  // 2. Limpieza básica del username (quitar espacios, etc.)
  const cleanUsername = username.trim();

  if (cleanUsername.length < 3) {
    return { success: false, error: "El nombre de usuario debe tener al menos 3 caracteres." };
  }

  // 3. Intentar actualizar el perfil
  const { error: updateError } = await supabase
    .from("perfiles")
    .update({ username: cleanUsername })
    .eq("id", user.id);

  if (updateError) {
    // Manejar error de unicidad (código 23505 en PostgreSQL)
    if (updateError.code === '23505') {
      return { success: false, error: "Lo sentimos, este nombre de usuario ya está en uso." };
    }
    console.error("Error actualizando username:", updateError);
    return { success: false, error: "Ocurrió un error al guardar el nombre. Por favor intenta de nuevo." };
  }

  // 4. Revalidar la ruta para que los cambios se vean reflejados inmediatamente
  revalidatePath("/empresa/webapp", "layout");
  
  return { success: true };
}
