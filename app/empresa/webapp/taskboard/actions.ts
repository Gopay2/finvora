"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { revalidatePath } from "next/cache";

/**
 * Crea una nueva tarea en el taskboard.
 */
export async function crearTarea(formData: {
  titulo: string;
  descripcion?: string;
  asignado_a: string;
}) {
  const { id: userId, role: userRole } = await getUserProfile();

  if (!userId || !isAllowed(userRole, ["Admin", "Developer", "Supervisor"])) {
    throw new Error("No tienes permisos para crear tareas.");
  }

  if (!formData.titulo.trim()) {
    throw new Error("El título de la tarea es obligatorio.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("taskboard")
    .insert({
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion?.trim() || null,
      asignado_a: formData.asignado_a,
      creado_por: userId,
      estado: "Pendientes",
    })
    .select()
    .single();

  if (error) {
    console.error("Error al crear tarea:", error);
    throw new Error("Error al crear la tarea en la base de datos.");
  }

  revalidatePath("/empresa/webapp/taskboard");
  return data;
}

/**
 * Actualiza el estado de una tarea.
 */
export async function actualizarEstadoTarea(
  tareaId: string,
  nuevoEstado: "Pendientes" | "En proceso" | "Terminado",
  nuevaDescripcion?: string | null
) {
  const { id: userId, role: userRole } = await getUserProfile();

  if (!userId || !isAllowed(userRole, ["Admin", "Developer", "Supervisor"])) {
    throw new Error("No tienes permisos para actualizar tareas.");
  }

  const supabase = await createClient();

  const updateData: any = {
    estado: nuevoEstado,
    updated_at: new Date().toISOString(),
  };

  if (nuevaDescripcion !== undefined) {
    updateData.descripcion = nuevaDescripcion?.trim() || null;
  }

  const { data, error } = await supabase
    .from("taskboard")
    .update(updateData)
    .eq("id", tareaId)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar estado de tarea:", error);
    throw new Error("Error al actualizar el estado en la base de datos.");
  }

  revalidatePath("/empresa/webapp/taskboard");
  return data;
}

/**
 * Elimina una tarea del taskboard.
 */
export async function eliminarTarea(tareaId: string) {
  const { id: userId, role: userRole } = await getUserProfile();

  if (!userId || !isAllowed(userRole, ["Admin", "Developer", "Supervisor"])) {
    throw new Error("No tienes permisos para eliminar tareas.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("taskboard")
    .delete()
    .eq("id", tareaId);

  if (error) {
    console.error("Error al eliminar tarea:", error);
    throw new Error("Error al eliminar la tarea de la base de datos.");
  }

  revalidatePath("/empresa/webapp/taskboard");
  return { success: true };
}
