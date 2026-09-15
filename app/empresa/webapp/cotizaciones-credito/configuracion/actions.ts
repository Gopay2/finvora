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
  /** Nombre de la zona si es una regla por zona (null para general, vendedor o producto) */
  zona?: string | null;
  /** ID del vendedor si es una regla por vendedor (null para general, zona o producto) */
  vendedor_id?: string | null;
  /** ID del producto si es una regla por equipo (null para general, zona o vendedor) */
  producto_id?: string | null;
  /** Proveedor asociado al equipo ('Tijuana', 'Monterrey', 'Guadalajara') */
  proveedor?: string | null;
  /** Lista ordenada de porcentajes de enganche permitidos (ej. [3, 5, 10, 15, 20, 25]) */
  porcentajes: number[];
  /** Lista ordenada de montos fijos de enganche en pesos (ej. [500, 800, 1200]) */
  montos_fijos?: number[] | null;
  /** Indica si se permite al vendedor fijar un monto personalizado libre */
  permitir_enganche_libre: boolean;
}

import { ConfigEngancheItem } from "@/types/ordenes-entrega";

/**
 * Guarda o actualiza configuraciones de enganche en la base de datos (General, Zona, Producto o Vendedor).
 * 
 * Limpia y deduplica los porcentajes y montos fijos recibidos, verifica permisos de rol y revalida
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
          (config.porcentajes || [])
            .map((porcentaje) => Math.round(Number(porcentaje)))
            .filter((porcentaje) => !isNaN(porcentaje) && porcentaje >= 0 && porcentaje <= 100)
        )
      ).sort((porcentajeA, porcentajeB) => porcentajeA - porcentajeB);

      const cleanMontosFijos = Array.from(
        new Set(
          (config.montos_fijos || [])
            .map((monto) => Number(Number(monto).toFixed(2)))
            .filter((monto) => !isNaN(monto) && monto > 0)
        )
      ).sort((montoA, montoB) => montoA - montoB);

      const targetVendedorId = config.vendedor_id ? config.vendedor_id.trim() : null;
      const targetProductoId = config.producto_id ? config.producto_id.trim() : null;
      const targetProveedor = config.proveedor ? config.proveedor.trim() : null;
      const targetZona = config.zona ? config.zona.trim() : null;

      let savedRecord: any = null;

      const selectFields = `
        id,
        cliente_historial,
        zona,
        vendedor_id,
        producto_id,
        proveedor,
        montos_fijos,
        porcentajes,
        permitir_enganche_libre,
        perfiles:vendedor_id (
          id,
          username,
          email,
          role
        ),
        productos:producto_id (
          id,
          marca,
          modelo,
          color,
          almacenamiento,
          ram
        )
      `;

      function formatDbError(prefix: string, err: any): string {
        if (err?.code === "42703") {
          return `${prefix}: La base de datos requiere la migración. Ejecuta el script 43_add_producto_to_configuracion_enganche.sql en el Editor SQL de Supabase.`;
        }
        return `${prefix}: ${err?.message || "Error desconocido"}`;
      }

      // Campos a actualizar; montos_fijos solo se tocan si es regla de producto o si se especificaron
      const updateFields: Record<string, any> = {
        porcentajes: cleanPorcentajes,
        permitir_enganche_libre: Boolean(config.permitir_enganche_libre),
        updated_at: new Date().toISOString(),
      };

      if (targetProductoId || (config.montos_fijos !== undefined && config.montos_fijos !== null)) {
        updateFields.montos_fijos = cleanMontosFijos.length > 0 ? cleanMontosFijos : null;
        updateFields.proveedor = targetProveedor;
      }

      const isExplicitGeneral = config.producto_id === null && config.zona === null && config.vendedor_id === null;

      if (config.id) {
        let updateQuery = supabase
          .from("configuracion_enganche")
          .update(updateFields)
          .eq("id", config.id);

        // Si es una regla declarada como General, asegurar que la fila objetivo sea realmente General
        if (isExplicitGeneral) {
          updateQuery = updateQuery
            .is("producto_id", null)
            .is("vendedor_id", null)
            .is("zona", null);
        }

        const { data, error } = await updateQuery
          .select(selectFields)
          .maybeSingle();

        if (error) {
          console.error("Error al actualizar configuración por ID:", error);
          return { error: formatDbError("Error al actualizar", error) };
        }

        if (data) {
          savedRecord = data;
        } else if (isExplicitGeneral) {
          // Si el ID no pertenecía a una fila General, buscar la fila General correspondiente o crearla
          const { data: generalExisting } = await supabase
            .from("configuracion_enganche")
            .select("id")
            .eq("cliente_historial", config.cliente_historial)
            .is("vendedor_id", null)
            .is("producto_id", null)
            .is("zona", null)
            .maybeSingle();

          if (generalExisting?.id) {
            const { data: updatedGeneral, error: updateGeneralErr } = await supabase
              .from("configuracion_enganche")
              .update(updateFields)
              .eq("id", generalExisting.id)
              .select(selectFields)
              .single();

            if (updateGeneralErr) {
              return { error: formatDbError("Error al actualizar", updateGeneralErr) };
            }
            savedRecord = updatedGeneral;
          } else {
            const { data: insertedGeneral, error: insertGeneralErr } = await supabase
              .from("configuracion_enganche")
              .insert({
                cliente_historial: config.cliente_historial,
                zona: null,
                vendedor_id: null,
                producto_id: null,
                porcentajes: cleanPorcentajes,
                permitir_enganche_libre: Boolean(config.permitir_enganche_libre),
                updated_at: new Date().toISOString(),
              })
              .select(selectFields)
              .single();

            if (insertGeneralErr) {
              return { error: formatDbError("Error al crear configuración", insertGeneralErr) };
            }
            savedRecord = insertedGeneral;
          }
        }
      } else {
        // Buscar si ya existe por combinación según el nivel jerárquico
        let query = supabase
          .from("configuracion_enganche")
          .select("id")
          .eq("cliente_historial", config.cliente_historial);

        if (targetVendedorId) {
          // Nivel 1: Vendedor
          query = query.eq("vendedor_id", targetVendedorId);
        } else if (targetProductoId) {
          // Nivel 2: Producto
          query = query.is("vendedor_id", null).eq("producto_id", targetProductoId);
        } else if (targetZona) {
          // Nivel 3: Zona
          query = query.is("vendedor_id", null).is("producto_id", null).eq("zona", targetZona);
        } else {
          // Nivel 4: General
          query = query.is("vendedor_id", null).is("producto_id", null).is("zona", null);
        }

        const { data: existing, error: findError } = await query.maybeSingle();

        if (findError) {
          console.error("Error al buscar configuración existente:", findError);
          return { error: `Error al verificar configuración: ${findError.message}` };
        }

        if (existing?.id) {
          // Si es una regla de Producto, Zona o Vendedor y no se envió ID (intento de nueva regla), rechazar duplicado
          if (targetVendedorId || targetProductoId || targetZona) {
            const nombre = targetProductoId ? "este equipo" : (targetZona || "este vendedor");
            const tipo = config.cliente_historial.toLowerCase() === "si" ? "Con Historial" : "Sin Historial";
            return { error: `Ya existe una regla configurada para ${nombre} (${tipo}). Por favor edita la regla existente.` };
          }

          const { data, error: updateError } = await supabase
            .from("configuracion_enganche")
            .update(updateFields)
            .eq("id", existing.id)
            .select(selectFields)
            .single();

          if (updateError) {
            console.error("Error al actualizar configuración existente:", updateError);
            return { error: formatDbError("Error al actualizar", updateError) };
          }
          savedRecord = data;
        } else {
          const { data, error: insertError } = await supabase
            .from("configuracion_enganche")
            .insert({
              cliente_historial: config.cliente_historial,
              zona: (targetVendedorId || targetProductoId) ? null : targetZona,
              vendedor_id: targetVendedorId,
              producto_id: targetProductoId,
              proveedor: targetProveedor,
              montos_fijos: cleanMontosFijos.length > 0 ? cleanMontosFijos : null,
              porcentajes: cleanPorcentajes,
              permitir_enganche_libre: Boolean(config.permitir_enganche_libre),
              updated_at: new Date().toISOString(),
            })
            .select(selectFields)
            .single();

          if (insertError) {
            console.error("Error al insertar configuración:", insertError);
            return { error: formatDbError("Error al crear configuración", insertError) };
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
          producto_id: savedRecord.producto_id || null,
          proveedor: savedRecord.proveedor || null,
          montos_fijos: savedRecord.montos_fijos || [],
          producto_info: savedRecord.productos || null,
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
