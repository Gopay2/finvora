'use server';

import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { revalidatePath } from "next/cache";

/**
 * Estructura de payload para guardar o actualizar una regla de configuración de enganche.
 */
export interface ConfigEngancheUpdatePayload {
  /** ID existente en la base de datos (opcional si es creación nueva) */
  id?: string;
  /** Tipo de cliente: 'Si' (con historial) o 'No' (sin historial) */
  cliente_historial: string;
  /** Nombre de la zona si es una regla por zona (null para general o vendedor) */
  zona?: string | null;
  /** ID del vendedor si es una regla por vendedor (null para general o zona) */
  vendedor_id?: string | null;
  /** Lista ordenada de porcentajes de enganche permitidos (ej. [3, 5, 10, 15, 20, 25]) */
  porcentajes: number[];
  /** Indica si se permite al vendedor fijar un monto personalizado libre */
  permitir_enganche_libre: boolean;
}

import { ConfigEngancheItem } from "@/types/ordenes-entrega";

/**
 * Guarda o actualiza configuraciones de enganche en la base de datos (General, Zona o Vendedor).
 * 
 * Limpia y deduplica los porcentajes recibidos, verifica permisos de rol y revalida
 * las rutas relacionadas en el caché de Next.js.
 * 
 * @param configs - Arreglo de payloads de configuración a persistir.
 * @returns Objeto indicando el resultado `{ success: true, savedConfigs: [...] }` o `{ error: string }`.
 */
export async function guardarConfiguracionesEnganche(
  configs: ConfigEngancheUpdatePayload[]
): Promise<{ success?: boolean; error?: string; savedConfigs?: ConfigEngancheItem[] }> {
  try {
    const { role: userRole } = await getUserProfile();

    if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
      return { error: "No tienes permisos suficientes para modificar las configuraciones de enganche." };
    }

    const supabase = await createClient();
    const savedConfigs: ConfigEngancheItem[] = [];

    for (const config of configs) {
      const cleanPorcentajes = Array.from(
        new Set(
          config.porcentajes
            .map((porcentaje) => Math.round(Number(porcentaje)))
            .filter((porcentaje) => !isNaN(porcentaje) && porcentaje >= 0 && porcentaje <= 100)
        )
      ).sort((porcentajeA, porcentajeB) => porcentajeA - porcentajeB);

      const targetVendedorId = config.vendedor_id ? config.vendedor_id.trim() : null;
      const targetZona = config.zona ? config.zona.trim() : null;

      let savedRecord: any = null;

      if (config.id) {
        const { data, error } = await supabase
          .from("configuracion_enganche")
          .update({
            porcentajes: cleanPorcentajes,
            permitir_enganche_libre: Boolean(config.permitir_enganche_libre),
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id)
          .select(`
            id,
            cliente_historial,
            zona,
            vendedor_id,
            porcentajes,
            permitir_enganche_libre,
            perfiles:vendedor_id (
              id,
              username,
              email,
              role
            )
          `)
          .single();

        if (error) {
          console.error("Error al actualizar configuración por ID:", error);
          return { error: `Error al actualizar: ${error.message}` };
        }
        savedRecord = data;
      } else {
        // Buscar si ya existe por combinación según el nivel jerárquico
        let query = supabase
          .from("configuracion_enganche")
          .select("id")
          .eq("cliente_historial", config.cliente_historial);

        if (targetVendedorId) {
          // Nivel 1: Vendedor
          query = query.eq("vendedor_id", targetVendedorId);
        } else if (targetZona) {
          // Nivel 2: Zona
          query = query.is("vendedor_id", null).eq("zona", targetZona);
        } else {
          // Nivel 3: General
          query = query.is("vendedor_id", null).is("zona", null);
        }

        const { data: existing, error: findError } = await query.maybeSingle();

        if (findError) {
          console.error("Error al buscar configuración existente:", findError);
          return { error: `Error al verificar configuración: ${findError.message}` };
        }

        if (existing?.id) {
          // Si es una regla de Zona o Vendedor y no se envió ID (intento de nueva regla), rechazar duplicado
          if (targetVendedorId || targetZona) {
            const nombre = targetZona || "este vendedor";
            const tipo = config.cliente_historial.toLowerCase() === "si" ? "Con Historial" : "Sin Historial";
            return { error: `Ya existe una regla configurada para ${nombre} (${tipo}). Por favor edita la regla existente.` };
          }

          const { data, error: updateError } = await supabase
            .from("configuracion_enganche")
            .update({
              porcentajes: cleanPorcentajes,
              permitir_enganche_libre: Boolean(config.permitir_enganche_libre),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select(`
              id,
              cliente_historial,
              zona,
              vendedor_id,
              porcentajes,
              permitir_enganche_libre,
              perfiles:vendedor_id (
                id,
                username,
                email,
                role
              )
            `)
            .single();

          if (updateError) {
            console.error("Error al actualizar configuración existente:", updateError);
            return { error: `Error al actualizar: ${updateError.message}` };
          }
          savedRecord = data;
        } else {
          const { data, error: insertError } = await supabase
            .from("configuracion_enganche")
            .insert({
              cliente_historial: config.cliente_historial,
              zona: targetVendedorId ? null : targetZona,
              vendedor_id: targetVendedorId,
              porcentajes: cleanPorcentajes,
              permitir_enganche_libre: Boolean(config.permitir_enganche_libre),
              updated_at: new Date().toISOString(),
            })
            .select(`
              id,
              cliente_historial,
              zona,
              vendedor_id,
              porcentajes,
              permitir_enganche_libre,
              perfiles:vendedor_id (
                id,
                username,
                email,
                role
              )
            `)
            .single();

          if (insertError) {
            console.error("Error al insertar configuración:", insertError);
            return { error: `Error al crear configuración: ${insertError.message}` };
          }
          savedRecord = data;
        }
      }

      if (savedRecord) {
        savedConfigs.push({
          id: savedRecord.id,
          cliente_historial: savedRecord.cliente_historial,
          zona: savedRecord.zona || null,
          vendedor_id: savedRecord.vendedor_id || null,
          vendedor_nombre: savedRecord.perfiles?.username || savedRecord.perfiles?.email || null,
          porcentajes: savedRecord.porcentajes || [],
          permitir_enganche_libre: Boolean(savedRecord.permitir_enganche_libre),
        });
      }
    }

    revalidatePath("/empresa/webapp/cotizaciones-credito");
    revalidatePath("/empresa/webapp/cotizaciones-credito/configuracion");
    revalidatePath("/empresa/webapp/ordenes-entrega");

    return { success: true, savedConfigs };
  } catch (err: unknown) {
    console.error("Error inesperado en guardarConfiguracionesEnganche:", err);
    return { error: err instanceof Error ? err.message : "Error inesperado al guardar las configuraciones." };
  }
}

export async function eliminarConfiguracionEnganche(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { role: userRole } = await getUserProfile();

    if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
      return { error: "No tienes permisos suficientes para eliminar configuraciones de enganche." };
    }

    if (!id) {
      return { error: "ID de configuración inválido." };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("configuracion_enganche")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar configuración:", error);
      return { error: `Error al eliminar regla: ${error.message}` };
    }

    revalidatePath("/empresa/webapp/cotizaciones-credito");
    revalidatePath("/empresa/webapp/cotizaciones-credito/configuracion");
    revalidatePath("/empresa/webapp/ordenes-entrega");

    return { success: true };
  } catch (err: unknown) {
    console.error("Error inesperado en eliminarConfiguracionEnganche:", err);
    return { error: err instanceof Error ? err.message : "Error inesperado al eliminar la configuración." };
  }
}
