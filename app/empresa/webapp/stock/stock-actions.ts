'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

export async function crearProducto(formData: FormData) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    throw new Error("No autorizado");
  }

  const supabase = await createClient();

  const marca = formData.get('marca') as string;
  const modelo = formData.get('modelo') as string;
  const color = formData.get('color') as string;
  const almacenamiento = formData.get('almacenamiento') as string;
  const ram = formData.get('ram') as string;
  const precio = parseFloat(formData.get('precio') as string);

  const { error } = await supabase
    .from('productos')
    .insert([{
      marca,
      modelo,
      color,
      almacenamiento,
      ram,
      precio
    }]);

  if (error) {
    console.error("Error al crear producto:", error);
    return { error: error.message };
  }

  // Limpiamos la caché y mantenemos al usuario en la página de productos
  revalidatePath('/empresa/webapp/stock/productos');
  redirect('/empresa/webapp/stock/productos');
}

export async function eliminarProducto(formData: FormData) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();
  const id = formData.get('id') as string;

  // 1. CHEQUEO DE SEGURIDAD: ¿Hay unidades físicas en stock?
  const { count, error: countError } = await supabase
    .from('stock')
    .select('*', { count: 'exact', head: true })
    .eq('producto_id', id);

  if (countError) return { error: "Error al verificar el stock disponible" };

  if (count && count > 0) {
    return { error: `No se puede eliminar: Todavía hay ${count} unidades en stock de este producto.` };
  }

  // 2. Si no hay stock, procedemos al borrado
  const { error: deleteError } = await supabase
    .from('productos')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error("Error al eliminar producto:", deleteError);
    return { error: "No se pudo eliminar el producto del catálogo." };
  }

  revalidatePath('/empresa/webapp/stock/productos');
  return { success: true };
}

export async function cargarStock(formData: FormData) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    throw new Error("No autorizado");
  }

  const supabase = await createClient();

  const imei = formData.get('imei') as string;
  const producto_id = formData.get('producto_id') as string;
  const zona = formData.get('zona') as string;

  const { error } = await supabase
    .from('stock')
    .insert([{
      imei,
      producto_id,
      zona
    }]);

  if (error) {
    console.error("Error al cargar stock:", error);
    return { error: error.message };
  }

  revalidatePath('/empresa/webapp/stock');
  redirect('/empresa/webapp/stock');
}

export async function actualizarEstadoStock(imei: string, nuevoEstado: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('stock')
    .update({ estado: nuevoEstado })
    .eq('imei', imei);

  if (error) {
    console.error("Error al actualizar estado:", error);
    return { error: error.message };
  }

  revalidatePath('/empresa/webapp/stock');
  return { success: true };
}

export async function getVendedores() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, username, role')
    .order('username', { ascending: true });

  if (error) {
    console.error("Error al obtener vendedores:", error);
    return [];
  }
  return data || [];
}

export async function registrarVenta(imei: string, vendedorId?: string) {
  const { role, id: currentUserId } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // 1. Obtener datos del equipo antes de borrarlo
  const { data: item, error: fetchError } = await supabase
    .from('stock')
    .select('*')
    .eq('imei', imei)
    .single();

  if (fetchError || !item) return { error: "No se encontró el equipo en stock" };

  // 2. Mover a la tabla de ventas
  const { error: insertError } = await supabase
    .from('ventas')
    .insert({
      imei: item.imei,
      producto_id: item.producto_id,
      vendedor_id: vendedorId || currentUserId,
      zona: item.zona,
      fecha_ingreso: item.fecha_ingreso
    });

  if (insertError) {
    console.error("Error al insertar en ventas:", insertError);
    return { error: "Error al registrar la venta en el historial" };
  }

  // 3. Borrar de stock
  const { error: deleteError } = await supabase
    .from('stock')
    .delete()
    .eq('imei', imei);

  if (deleteError) {
    console.error("Error al borrar de stock:", deleteError);
    return { error: "Error al remover del stock, pero la venta fue registrada" };
  }

  revalidatePath('/empresa/webapp/stock');
  return { success: true };
}
