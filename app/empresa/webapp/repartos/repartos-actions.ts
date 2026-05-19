'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getRepartosMes(year: number, month: number) {
  const supabase = await createClient();

  // Primer y último día del mes
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('repartos')
    .select(`
      id,
      fecha_reparto,
      horario,
      notas,
      imei,
      repartidores (
        id,
        nombre,
        zona_horaria
      ),
      zonas_reparto (
        id,
        nombre_zona,
        descripcion
      ),
      vendedor:perfiles (
        id,
        username,
        email
      ),
      productos (
        id,
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      )
    `)
    .gte('fecha_reparto', startDate)
    .lte('fecha_reparto', endDate);

  if (error) {
    console.error("Error al obtener repartos:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getLogisticsFormData() {
  const supabase = await createClient();

  // 1. Obtener repartidores activos
  const { data: repartidores, error: repError } = await supabase
    .from('repartidores')
    .select('id, nombre, zona_horaria')
    .eq('activo', true)
    .order('nombre');

  if (repError) {
    console.error("Error al obtener repartidores:", repError);
    return { success: false, error: repError.message };
  }

  // 2. Obtener todas las zonas de reparto
  const { data: zonas, error: zonaError } = await supabase
    .from('zonas_reparto')
    .select('id, repartidor_id, nombre_zona, descripcion')
    .order('nombre_zona');

  if (zonaError) {
    console.error("Error al obtener zonas:", zonaError);
    return { success: false, error: zonaError.message };
  }

  // 3. Obtener vendedores (perfiles con rol asignado distinto de 'Sin rol')
  const { data: vendedores, error: vendError } = await supabase
    .from('perfiles')
    .select('id, username, email, role')
    .neq('role', 'Sin rol')
    .order('username');

  if (vendError) {
    console.error("Error al obtener vendedores:", vendError);
    return { success: false, error: vendError.message };
  }

  // 4. Obtener stock disponible o a consultar
  const { data: stock, error: stockError } = await supabase
    .from('stock')
    .select(`
      imei,
      producto_id,
      productos (
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      )
    `)
    .in('estado', ['Disponible', 'A consultar'])
    .order('fecha_ingreso', { ascending: false });

  if (stockError) {
    console.error("Error al obtener stock:", stockError);
    return { success: false, error: stockError.message };
  }

  return {
    success: true,
    data: {
      repartidores: repartidores || [],
      zonas: zonas || [],
      vendedores: vendedores || [],
      stock: stock || []
    }
  };
}

export async function crearReparto(formData: {
  fecha_reparto: string;
  horario: string;
  repartidor_id: string;
  zona_id: string;
  vendedor_id: string;
  imei: string;
  producto_id: string;
  notas?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('repartos')
    .insert({
      fecha_reparto: formData.fecha_reparto,
      horario: formData.horario,
      repartidor_id: formData.repartidor_id || null,
      zona_id: formData.zona_id || null,
      vendedor_id: formData.vendedor_id || null,
      imei: formData.imei || null,
      producto_id: formData.producto_id || null,
      notas: formData.notas || ''
    });

  if (error) {
    console.error("Error al crear reparto:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}

export async function eliminarReparto(repartoId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('repartos')
    .delete()
    .eq('id', repartoId);

  if (error) {
    console.error("Error al eliminar reparto:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}

// ==========================================
// ACCIONES DE REPARTIDORES
// ==========================================

export async function getRepartidoresList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('repartidores')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error("Error al obtener repartidores:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data: data || [] };
}

export async function crearRepartidor(nombre: string, zonaHoraria?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('repartidores')
    .insert({ nombre, activo: true, zona_horaria: zonaHoraria || 'America/Mexico_City' });

  if (error) {
    console.error("Error al crear repartidor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/repartidores');
  return { success: true };
}

export async function toggleRepartidorActivo(repartidorId: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('repartidores')
    .update({ activo })
    .eq('id', repartidorId);

  if (error) {
    console.error("Error al cambiar estado de repartidor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/repartidores');
  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}

export async function eliminarRepartidor(repartidorId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('repartidores')
    .delete()
    .eq('id', repartidorId);

  if (error) {
    console.error("Error al eliminar repartidor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/repartidores');
  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}

// ==========================================
// ACCIONES DE ZONAS
// ==========================================

export async function getZonasList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('zonas_reparto')
    .select(`
      id,
      repartidor_id,
      nombre_zona,
      descripcion,
      created_at,
      repartidores (
        id,
        nombre
      )
    `)
    .order('nombre_zona', { ascending: true });

  if (error) {
    console.error("Error al obtener zonas:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data: data || [] };
}

export async function crearZona(formData: {
  repartidor_id: string;
  nombre_zona: string;
  descripcion?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('zonas_reparto')
    .insert({
      repartidor_id: formData.repartidor_id,
      nombre_zona: formData.nombre_zona,
      descripcion: formData.descripcion || ''
    });

  if (error) {
    console.error("Error al crear zona:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/zonas');
  return { success: true };
}

export async function eliminarZona(zonaId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('zonas_reparto')
    .delete()
    .eq('id', zonaId);

  if (error) {
    console.error("Error al eliminar zona:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/zonas');
  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}
