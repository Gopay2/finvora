'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

const ALLOWED_ROLES = ["Admin", "Supervisor", "Developer"];

/**
 * Registra un nuevo equipo en la tabla intermedia 'recibo_stock' (proceso de recepción y control).
 * Trabaja de forma completamente aislada sin tocar la tabla 'stock'.
 */
export async function registrarEquipoRecibo(formData: FormData) {
  const { role, id: userId, username } = await getUserProfile();
  if (!isAllowed(role, ALLOWED_ROLES)) {
    return { error: "No tienes permisos para registrar equipos en recibo." };
  }

  const imei = (formData.get("imei") as string || "").trim();
  const producto_id = formData.get("producto_id") as string;
  const proveedor = formData.get("proveedor") as string; // 'Tijuana', 'Guadalajara', 'Monterrey'
  const tipo_equipo = formData.get("tipo_equipo") as string; // 'credito', 'concesion'

  if (!imei) {
    return { error: "Debes ingresar o escanear el IMEI del equipo." };
  }
  if (!producto_id) {
    return { error: "Debes seleccionar un modelo del catálogo." };
  }
  if (!proveedor) {
    return { error: "Debes seleccionar el área del proveedor." };
  }
  if (!tipo_equipo) {
    return { error: "Debes seleccionar el tipo de equipo (crédito o concesión)." };
  }

  const supabase = await createClient();

  // 1. Validar si el IMEI ya existe en la lista de recibo pendiente
  const { data: existingRecibo, error: checkError } = await supabase
    .from("recibo_stock")
    .select("id, imei")
    .eq("imei", imei)
    .maybeSingle();

  if (checkError && !checkError.message.includes("Could not find the table")) {
    console.error("Error al validar IMEI en recibo_stock:", checkError);
  }

  if (existingRecibo) {
    return { error: `El IMEI ${imei} ya fue registrado previamente en esta lista de recibo.` };
  }

  // 2. Insertar en recibo_stock
  const { data, error: insertError } = await supabase
    .from("recibo_stock")
    .insert([{
      imei,
      producto_id,
      proveedor,
      tipo_equipo,
      ubicacion_default: "Almacenamiento",
      estado: "Pendiente",
      creado_por: userId,
      creado_por_username: username
    }])
    .select()
    .single();

  if (insertError) {
    console.error("Error al insertar en recibo_stock:", insertError);
    if (insertError.message.includes("Could not find the table")) {
      return { 
        error: "La tabla 'recibo_stock' aún no ha sido creada en la base de datos de Supabase. Por favor ejecuta el script SQL de creación." 
      };
    }
    if (insertError.code === "23505") {
      return { error: `El IMEI ${imei} ya se encuentra registrado en el sistema.` };
    }
    return { error: `Error de base de datos: ${insertError.message}` };
  }

  revalidatePath("/empresa/webapp/inventario/recibo");
  return { success: true, item: data };
}

/**
 * Elimina una fila individual de la tabla intermedia 'recibo_stock'.
 */
export async function eliminarEquipoRecibo(id: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ALLOWED_ROLES)) {
    return { error: "No tienes permisos para realizar esta acción." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("recibo_stock")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar de recibo_stock:", error);
    return { error: "No se pudo eliminar el equipo de la lista de recibo." };
  }

  revalidatePath("/empresa/webapp/inventario/recibo");
  return { success: true };
}

/**
 * Actualiza los datos de un equipo en la tabla intermedia 'recibo_stock' (IMEI y/o Producto/Modelo).
 */
export async function actualizarEquipoRecibo(
  id: string,
  data: { imei: string; producto_id: string }
) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ALLOWED_ROLES)) {
    return { error: "No tienes permisos para editar equipos en recibo." };
  }

  const imei = (data.imei || "").trim();
  const producto_id = (data.producto_id || "").trim();

  if (!id) {
    return { error: "Identificador de registro no válido." };
  }
  if (!imei) {
    return { error: "Debes ingresar el IMEI del equipo." };
  }
  if (!producto_id) {
    return { error: "Debes seleccionar un modelo del catálogo." };
  }

  const supabase = await createClient();

  // Validar si el nuevo IMEI ya existe en otro registro de recibo_stock
  const { data: existing, error: checkError } = await supabase
    .from("recibo_stock")
    .select("id, imei")
    .eq("imei", imei)
    .neq("id", id)
    .maybeSingle();

  if (checkError && !checkError.message.includes("Could not find the table")) {
    console.error("Error al validar IMEI único en recibo_stock:", checkError);
  }

  if (existing) {
    return { error: `El IMEI ${imei} ya está registrado en otro equipo de esta lista.` };
  }

  const { data: updated, error: updateError } = await supabase
    .from("recibo_stock")
    .update({
      imei,
      producto_id,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Error al actualizar en recibo_stock:", updateError);
    if (updateError.code === "23505") {
      return { error: `El IMEI ${imei} ya se encuentra registrado en el sistema.` };
    }
    return { error: `Error de base de datos: ${updateError.message}` };
  }

  revalidatePath("/empresa/webapp/inventario/recibo");
  return { success: true, item: updated };
}
