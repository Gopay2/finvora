import React from "react";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import RegistrosClientView from "../../../../components/empresa/RegistrosClientView";

export const revalidate = 0;

export default async function RegistrosPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Registros" />;
  }

  const supabase = await createClient();

  // 1. Fetch de Ventas
  const { data: ventasRaw } = await supabase
    .from("ventas")
    .select(`
      id,
      imei,
      precio_costo,
      fecha_ingreso,
      fecha_venta,
      repartidor:repartidores!zona (
        id,
        nombre
      ),
      productos (
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      ),
      vendedor:perfiles (
        id,
        username
      )
    `)
    .order("fecha_venta", { ascending: false });

  // 2. Fetch de Órdenes de Entrega
  const { data: ordenesRaw } = await supabase
    .from("ordenes_entrega")
    .select(`
      id,
      folio,
      consecutivo,
      nombre_cliente,
      identificacion_fisica,
      curp,
      telefono,
      direccion,
      enganche,
      celular,
      color_celular,
      imei,
      cuenta_activa,
      cliente_historial,
      zona,
      repartidor,
      repartidor_id,
      especificar_local,
      fecha_entrega,
      hora_entrega,
      comentarios,
      created_at,
      vendedor:perfiles!vendedor_id (
        id,
        username
      ),
      repartidores:repartidores!repartidor_id (
        id,
        nombre
      )
    `)
    .order("created_at", { ascending: false });

  // 3. Fetch de Catálogos para filtros
  const { data: perfiles } = await supabase
    .from("perfiles")
    .select("id, username")
    .order("username");

  const { data: repartidores } = await supabase
    .from("repartidores")
    .select("id, nombre")
    .order("nombre");

  return (
    <RegistrosClientView
      ventas={(ventasRaw || []) as any}
      ordenes={(ordenesRaw || []) as any}
      vendedores={(perfiles || []) as any}
      repartidores={(repartidores || []) as any}
    />
  );
}
