'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Agrega una asociación de producto y costos (Equipo y PayJoy) a un proveedor.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param productoId - ID del producto a asociar
 * @param proveedor - Nombre de la plaza/proveedor ('Tijuana', 'Monterrey', 'Guadalajara')
 * @param costo - Costo numérico de compra del equipo
 * @param costoPayjoy - Costo numérico base de PayJoy para cotizaciones
 * @returns Objeto ActionResult indicando éxito o mensaje de error
 */
export async function agregarProductoProveedor(
  productoId: string,
  proveedor: string,
  costo: number,
  costoPayjoy: number = 0
): Promise<ActionResult> {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  if (!productoId || !proveedor || costo < 0 || costoPayjoy < 0) {
    return { error: "Parámetros inválidos" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('producto_costos_proveedores')
    .insert([{
      producto_id: productoId,
      proveedor,
      costo,
      costo_payjoy: costoPayjoy
    }]);

  if (error) {
    console.error("Error al asociar producto al proveedor:", error);
    if (error.code === '23505') {
      return { error: "Este producto ya está asignado a este proveedor." };
    }
    return { error: error.message ? `No se pudo asociar: ${error.message}` : "No se pudo asociar el producto." };
  }

  revalidatePath('/empresa/webapp/sueldos/proveedores');
  revalidatePath('/empresa/webapp/cotizaciones-credito');
  revalidatePath('/empresa/webapp/ordenes-entrega');
  return { success: true };
}

/**
 * Actualiza el costo de compra de equipo de un producto para un proveedor.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param id - ID del registro de costo a actualizar
 * @param costo - Nuevo costo numérico
 * @returns Objeto ActionResult indicando éxito o mensaje de error
 */
export async function actualizarCostoProveedor(
  id: string,
  costo: number
): Promise<ActionResult> {
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
 * Actualiza el costo PayJoy de un producto para un proveedor.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param id - ID del registro de costo a actualizar
 * @param costoPayjoy - Nuevo costo PayJoy numérico
 * @returns Objeto ActionResult indicando éxito o mensaje de error
 */
export async function actualizarCostoPayjoyProveedor(
  id: string,
  costoPayjoy: number
): Promise<ActionResult> {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  if (!id || costoPayjoy < 0) {
    return { error: "Parámetros inválidos" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('producto_costos_proveedores')
    .update({
      costo_payjoy: costoPayjoy,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar costo PayJoy del proveedor:", error);
    return { error: "No se pudo actualizar el costo PayJoy." };
  }

  revalidatePath('/empresa/webapp/sueldos/proveedores');
  revalidatePath('/empresa/webapp/cotizaciones-credito');
  revalidatePath('/empresa/webapp/ordenes-entrega');
  return { success: true };
}

/**
 * Remueve la asociación de un producto con un proveedor.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param id - ID del registro de costo a eliminar
 * @returns Objeto ActionResult indicando éxito o mensaje de error
 */
export async function eliminarProductoProveedor(
  id: string
): Promise<ActionResult> {
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
