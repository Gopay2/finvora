'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

/**
 * Agrega una asociación de producto y costo a un proveedor.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 */
export async function agregarProductoProveedor(productoId: string, proveedor: string, costo: number) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  if (!productoId || !proveedor || costo < 0) {
    return { error: "Parámetros inválidos" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('producto_costos_proveedores')
    .insert([{
      producto_id: productoId,
      proveedor,
      costo
    }]);

  if (error) {
    console.error("Error al asociar producto al proveedor:", error);
    if (error.code === '23505') {
      return { error: "Este producto ya está asignado a este proveedor." };
    }
    return { error: "No se pudo asociar el producto." };
  }

  revalidatePath('/empresa/webapp/sueldos/proveedores');
  return { success: true };
}

/**
 * Actualiza el costo de un producto para un proveedor.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 */
export async function actualizarCostoProveedor(id: string, costo: number) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  if (!id || costo < 0) {
    return { error: "Parámetros inválidos" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('producto_costos_proveedores')
    .update({
      costo,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar costo del proveedor:", error);
    return { error: "No se pudo actualizar el costo." };
  }

  revalidatePath('/empresa/webapp/sueldos/proveedores');
  return { success: true };
}

/**
 * Remueve la asociación de un producto con un proveedor.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 */
export async function eliminarProductoProveedor(id: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  if (!id) {
    return { error: "Parámetros inválidos" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('producto_costos_proveedores')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error al eliminar costo del proveedor:", error);
    return { error: "No se pudo remover el producto del proveedor." };
  }

  revalidatePath('/empresa/webapp/sueldos/proveedores');
  return { success: true };
}
