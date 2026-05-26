'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

/**
 * Registra un nuevo tipo de producto en el catálogo general (tabla 'productos').
 * Define atributos fijos como marca, modelo, color, almacenamiento, ram y precio base de venta.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param formData Formulario con marca, modelo, color, almacenamiento, ram y precio
 * @throws {Error} Si el usuario no cuenta con autorización o perfil válido
 * @returns Objeto con mensaje de error si falla la inserción en la base de datos
 */
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

  // Limpiamos la caché y redirigimos al usuario a la vista de administración de productos
  revalidatePath('/empresa/webapp/stock/productos');
  redirect('/empresa/webapp/stock/productos');
}

/**
 * Modifica los atributos de un producto existente en el catálogo general (tabla 'productos').
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param formData Formulario con el ID del producto y sus campos editados (marca, modelo, color, almacenamiento, ram, precio)
 * @returns Objeto indicando el estado del resultado de la operación (error o success)
 */
export async function editarProducto(formData: FormData) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();
  const id = formData.get('id') as string;
  const marca = formData.get('marca') as string;
  const modelo = formData.get('modelo') as string;
  const color = formData.get('color') as string;
  const almacenamiento = formData.get('almacenamiento') as string;
  const ram = formData.get('ram') as string;
  const precio = parseFloat(formData.get('precio') as string);

  const { error } = await supabase
    .from('productos')
    .update({
      marca,
      modelo,
      color,
      almacenamiento,
      ram,
      precio
    })
    .eq('id', id);

  if (error) {
    console.error("Error al editar producto:", error);
    return { error: "No se pudo actualizar el producto." };
  }

  revalidatePath('/empresa/webapp/stock/productos');
  return { success: true };
}

/**
 * Elimina un producto del catálogo general (tabla 'productos') únicamente si no tiene
 * stock asociado o cargado físicamente.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param formData Formulario con el ID único del producto a eliminar
 * @returns Objeto indicando el resultado de la operación. Bloquea el borrado si hay stock activo para mantener consistencia.
 */
export async function eliminarProducto(formData: FormData) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();
  const id = formData.get('id') as string;

  // 1. CHEQUEO DE SEGURIDAD Y DE INTEGRIDAD: ¿Hay unidades físicas cargadas en el inventario actual?
  const { count, error: countError } = await supabase
    .from('stock')
    .select('*', { count: 'exact', head: true })
    .eq('producto_id', id);

  if (countError) return { error: "Error al verificar el stock disponible" };

  // Si existen items con este producto en stock, bloqueamos la acción para no romper llaves foráneas
  if (count && count > 0) {
    return { error: `No se puede eliminar: Todavía hay ${count} unidades en stock de este producto.` };
  }

  // 2. Si no hay stock físico, procedemos a dar de baja del catálogo
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

/**
 * Carga e ingresa una unidad física individual (ej. dispositivo móvil con IMEI) al inventario en la tabla 'stock'.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param formData Formulario con el IMEI, ID de producto de catálogo y la zona o depósito inicial de almacenamiento
 * @throws {Error} Si el usuario no cuenta con autorización o perfil válido
 * @returns Objeto con mensaje de error si falla la inserción
 */
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

/**
 * Actualiza el estado logístico de un equipo físico individual (ej. 'Disponible', 'Vendido', 'En reparto').
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param imei Identificador único de hardware (IMEI) de la unidad en stock
 * @param nuevoEstado Nombre del nuevo estado operativo del equipo
 * @returns Objeto indicando el éxito o error de la actualización
 */
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

/**
 * Actualiza la ubicación física, zona o asignación de depósito de un equipo individual en stock.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param imei Identificador único de hardware (IMEI) de la unidad en stock
 * @param nuevaZona Nombre de la nueva ubicación física asignada
 * @returns Objeto indicando el éxito o error del traslado
 */
export async function actualizarZonaStock(imei: string, nuevaZona: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('stock')
    .update({ zona: nuevaZona })
    .eq('imei', imei);

  if (error) {
    console.error("Error al actualizar ubicación:", error);
    return { error: error.message };
  }

  revalidatePath('/empresa/webapp/stock');
  return { success: true };
}

/**
 * Recupera la lista completa de vendedores registrados en el sistema (tabla 'perfiles') ordenados por nombre.
 * 
 * @security Bloquea de inmediato a usuarios con rol 'Sin rol' para evitar enumeración interna de personal corporativo.
 * @returns Arreglo con la información de vendedores (id, username, role) o arreglo vacío en caso de error o bloqueo.
 */
export async function getVendedores() {
  const { role } = await getUserProfile();
  if (role === "Sin rol") {
    return [];
  }

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

/**
 * Transición crítica de inventario: Registra una venta en el historial histórico de la empresa (tabla 'ventas')
 * y al mismo tiempo da de baja física la unidad vendida de la tabla principal de inventario ('stock').
 * Congela en el registro de ventas el precio de costo del producto vigente en el catálogo al momento de la transacción.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param imei Identificador único de hardware (IMEI) de la unidad en stock a vender
 * @param vendedorId ID opcional del vendedor asignado. Si no se provee, se asigna al usuario que ejecuta la acción.
 * @returns Objeto con éxito o error de la transacción
 */
export async function registrarVenta(imei: string, vendedorId?: string) {
  const { role, id: currentUserId } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // 1. Obtener datos del equipo antes de borrarlo del inventario activo (incluyendo el precio del catálogo de productos)
  const { data: item, error: fetchError } = await supabase
    .from('stock')
    .select('*, productos(precio)')
    .eq('imei', imei)
    .single();

  if (fetchError || !item) return { error: "No se encontró el equipo en stock" };

  // 2. Mover la unidad a la tabla histórica de ventas (congelando el precio de costo actual del catálogo)
  const { error: insertError } = await supabase
    .from('ventas')
    .insert({
      imei: item.imei,
      producto_id: item.producto_id,
      vendedor_id: vendedorId || currentUserId,
      zona: item.zona,
      precio_costo: (item.productos as any)?.precio || 0,
      fecha_ingreso: item.fecha_ingreso
    });

  if (insertError) {
    console.error("Error al insertar en ventas:", insertError);
    return { error: "Error al registrar la venta en el historial" };
  }

  // 3. Remover el equipo físicamente de la tabla de stock para evitar duplicidad o doble venta
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

/**
 * Elimina de forma directa y permanente un equipo individual del stock físico (tabla 'stock')
 * sin generar transición de venta histórica (ej. descarte por falla de hardware o merma).
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param imei Identificador único de hardware (IMEI) de la unidad en stock a descartar
 * @returns Objeto indicando el resultado de la operación (error o success)
 */
export async function eliminarStock(imei: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('stock')
    .delete()
    .eq('imei', imei);

  if (error) {
    console.error("Error al eliminar del stock:", error);
    return { error: "No se pudo eliminar el equipo del inventario." };
  }

  revalidatePath('/empresa/webapp/stock');
  return { success: true };
}

/**
 * Actualiza el repartidor asignado como ubicación física a un equipo individual en stock.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param imei Identificador único de hardware (IMEI) de la unidad en stock
 * @param nuevaUbicacionId UUID del repartidor o null para desasignar
 * @returns Objeto indicando el éxito o error de la actualización
 */
export async function actualizarUbicacionStock(imei: string, nuevaUbicacionId: string | null) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('stock')
    .update({ ubicacion: nuevaUbicacionId || null })
    .eq('imei', imei);

  if (error) {
    console.error("Error al actualizar repartidor de ubicación:", error);
    return { error: error.message };
  }

  revalidatePath('/empresa/webapp/stock');
  return { success: true };
}
