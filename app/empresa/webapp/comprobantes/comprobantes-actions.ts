'use server';

import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { revalidatePath } from "next/cache";

export interface ComprobanteRecord {
  id: string;
  monto_enganche: number;
  comprobante_url: string;
  created_at: string;
  vendedor: {
    id: string;
    username: string;
    role: string;
  } | null;
  repartidor: {
    id: string;
    username: string;
    role: string;
  } | null;
  creador: {
    id: string;
    username: string;
    role: string;
  } | null;
}

/**
 * Server Action para subir un comprobante de enganche y registrarlo en la base de datos.
 * Accesible por: Admin, Supervisor, Developer, Repartidor.
 */
export async function submitComprobante(formData: FormData) {
  const { id: currentUserId, role: userRole } = await getUserProfile();

  if (!currentUserId || !isAllowed(userRole, ["Developer", "Admin", "Supervisor", "Repartidor"])) {
    return { success: false, error: "No autorizado. No tienes los permisos necesarios." };
  }

  const vendedorId = formData.get("vendedor_id") as string;
  const repartidorId = formData.get("repartidor_id") as string;
  const montoRaw = formData.get("monto_enganche") as string;
  const file = formData.get("comprobante") as File | null;

  if (!vendedorId || !repartidorId || !montoRaw || !file || file.size === 0) {
    return { success: false, error: "Todos los campos son obligatorios, incluyendo el comprobante." };
  }

  const monto = parseFloat(montoRaw);
  if (isNaN(monto) || monto < 0) {
    return { success: false, error: "El monto del enganche debe ser un número válido mayor o igual a cero." };
  }

  const supabase = await createClient();

  // 1. Subir el comprobante (Imagen o PDF) a Supabase Storage
  let comprobanteUrl = "";
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `comprobantes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Error al subir archivo a storage:", uploadError);
      return { success: false, error: `Error al subir el comprobante: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(filePath);

    comprobanteUrl = publicUrl;
  } catch (error: any) {
    console.error("Excepción en la carga del archivo:", error);
    return { success: false, error: "Ocurrió un error inesperado al subir el comprobante." };
  }

  // 2. Registrar en la base de datos
  const { error } = await supabase
    .from('comprobantes')
    .insert([{
      vendedor_id: vendedorId,
      repartidor_id: repartidorId,
      monto_enganche: monto,
      comprobante_url: comprobanteUrl,
      creado_por: currentUserId
    }]);

  if (error) {
    console.error("Error al registrar comprobante en DB:", error);
    // Limpieza: intentar borrar el archivo de storage si falló la base de datos
    try {
      const searchString = "/storage/v1/object/public/comprobantes/";
      const index = comprobanteUrl.indexOf(searchString);
      if (index !== -1) {
        const filePath = comprobanteUrl.substring(index + searchString.length);
        await supabase.storage.from('comprobantes').remove([filePath]);
      }
    } catch (cleanupError) {
      console.error("Error al limpiar archivo de storage tras fallo en DB:", cleanupError);
    }
    return { success: false, error: `Error en la base de datos: ${error.message}` };
  }

  revalidatePath('/empresa/webapp/comprobantes');
  return { success: true };
}

/**
 * Server Action para obtener los comprobantes cargados en los últimos 2 meses.
 * Accesible únicamente por roles superiores: Admin, Supervisor, Developer.
 */
export async function getComprobantes(): Promise<{ success: boolean; data?: ComprobanteRecord[]; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado. No tienes permisos para ver estos registros." };
  }

  const supabase = await createClient();

  // Calcular la fecha límite de hace 2 meses
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const { data, error } = await supabase
    .from('comprobantes')
    .select(`
      id,
      monto_enganche,
      comprobante_url,
      created_at,
      vendedor:perfiles!vendedor_id (id, username, role),
      repartidor:perfiles!repartidor_id (id, username, role),
      creador:perfiles!creado_por (id, username, role)
    `)
    .gte('created_at', twoMonthsAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error al obtener comprobantes:", error);
    return { success: false, error: `Error en la consulta: ${error.message}` };
  }

  // Mapeamos los datos de tipado para evitar problemas con arrays y devolver un esquema seguro
  const formattedData: ComprobanteRecord[] = (data || []).map((item: any) => ({
    id: item.id,
    monto_enganche: Number(item.monto_enganche),
    comprobante_url: item.comprobante_url,
    created_at: item.created_at,
    vendedor: Array.isArray(item.vendedor) ? item.vendedor[0] : item.vendedor,
    repartidor: Array.isArray(item.repartidor) ? item.repartidor[0] : item.repartidor,
    creador: Array.isArray(item.creador) ? item.creador[0] : item.creador,
  }));

  return { success: true, data: formattedData };
}

/**
 * Server Action para eliminar un comprobante de la base de datos y su archivo de storage.
 * Accesible únicamente por roles superiores: Admin, Supervisor, Developer.
 */
export async function eliminarComprobante(id: string): Promise<{ success: boolean; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado. No tienes permisos para eliminar registros." };
  }

  const supabase = await createClient();

  // 1. Obtener la URL del comprobante para poder borrar el archivo de storage
  const { data: item, error: fetchError } = await supabase
    .from('comprobantes')
    .select('comprobante_url')
    .eq('id', id)
    .single();

  if (fetchError || !item) {
    console.error("Error al buscar el comprobante:", fetchError);
    return { success: false, error: "No se encontró el registro a eliminar." };
  }

  const comprobanteUrl = item.comprobante_url;

  // 2. Eliminar el registro de la base de datos
  const { data: deletedRows, error: deleteError } = await supabase
    .from('comprobantes')
    .delete()
    .eq('id', id)
    .select();

  if (deleteError) {
    console.error("Error al eliminar el comprobante de la DB:", deleteError);
    return { success: false, error: `Error en la base de datos: ${deleteError.message}` };
  }

  if (!deletedRows || deletedRows.length === 0) {
    console.warn("No se eliminó ninguna fila. RLS podría estar bloqueando el DELETE.");
    return {
      success: false,
      error: "No se pudo eliminar el registro. Row Level Security (RLS) bloqueó la operación o no tienes permisos de eliminación en Supabase para la tabla 'comprobantes'."
    };
  }

  // 3. Eliminar el archivo de Supabase Storage
  try {
    const searchString = "/storage/v1/object/public/comprobantes/";
    const index = comprobanteUrl.indexOf(searchString);
    if (index !== -1) {
      const filePath = comprobanteUrl.substring(index + searchString.length);
      await supabase.storage.from('comprobantes').remove([filePath]);
    }
  } catch (cleanupError) {
    console.error("Error al limpiar archivo de storage tras eliminación:", cleanupError);
  }

  revalidatePath('/empresa/webapp/comprobantes');
  return { success: true };
}
