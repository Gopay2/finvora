'use server'

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/auth-check";

import { ROLES_DISPONIBLES, UserRole } from "./constants";

export async function updateUserRole(targetUserId: string, newRole: UserRole) {
  try {
    const { role: currentUserRole } = await getUserProfile();
    
    // 1. Validar que el rol que realiza la acción sea de rango superior
    const allowedRoles = ["Admin", "Developer", "Supervisor"];
    if (!allowedRoles.includes(currentUserRole)) {
      return { success: false, error: "No tienes permisos para realizar esta acción." };
    }
    
    // 2. Validar que el rol de destino sea válido
    if (!ROLES_DISPONIBLES.includes(newRole)) {
      return { success: false, error: "El rol seleccionado no es válido." };
    }
    
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: "Error al conectar con la base de datos." };
    }

    // 3. Restricciones específicas si el editor es Supervisor
    if (currentUserRole === "Supervisor") {
      // a. El Supervisor no puede asignar roles de Admin o Developer
      if (newRole === "Admin" || newRole === "Developer") {
        return { success: false, error: "Un Supervisor no puede asignar los roles de Admin o Developer." };
      }
      
      // b. El Supervisor no puede editar a un usuario que actualmente sea Admin o Developer
      const { data: targetProfile, error: selectError } = await supabase
        .from("perfiles")
        .select("role")
        .eq("id", targetUserId)
        .single();
        
      if (selectError || !targetProfile) {
        return { success: false, error: "No se pudo verificar el rol actual del usuario a editar." };
      }
      
      if (targetProfile.role === "Admin" || targetProfile.role === "Developer") {
        return { success: false, error: "Un Supervisor no puede modificar el rol de un Admin o Developer." };
      }
    }
    
    // 4. Ejecutar la actualización
    const { error } = await supabase
      .from("perfiles")
      .update({ role: newRole })
      .eq("id", targetUserId);
      
    if (error) {
      console.error("Error al actualizar rol:", error);
      return { success: false, error: `Error en base de datos: ${error.message}` };
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Error inesperado en Server Action updateUserRole:", err);
    return { success: false, error: err.message || "Ocurrió un error inesperado al actualizar el rol." };
  }
}
