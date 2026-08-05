import React from "react";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import RegistrosClientView, {
  type Venta,
  type OrdenEntrega,
  type Garantia,
  type OrdenGarantia,
  type PerfilOption,
  type RepartidorOption,
  type ZonaReparto
} from "@/components/empresa/RegistrosClientView";

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

  // 1.5 Fetch de Garantías
  const { data: garantiasRaw } = await supabase
    .from("garantias")
    .select(`
      id,
      imei,
      precio_costo,
      motivo,
      fecha_ingreso,
      fecha_garantia,
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
      solicitante:perfiles!solicitado_por (
        id,
        username
      )
    `)
    .order("fecha_garantia", { ascending: false });

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
      preferencia_comunicacion,
      direccion,
      nombre_referencia_1,
      telefono_referencia_1,
      nombre_referencia_2,
      telefono_referencia_2,
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

  // 2.5 Fetch de Órdenes de Garantía
  const { data: ordenesGarantiaRaw } = await supabase
    .from("ordenes_garantia")
    .select(`
      id,
      folio,
      consecutivo,
      zona,
      nombre_cliente,
      telefono,
      ubicacion,
      tag,
      modelo,
      imei,
      fecha_entrega,
      costo_equipo,
      enganche_registrado,
      enganche_recibido,
      motivo_garantia,
      descripcion_falla,
      accesorios_entregados,
      estado_fisico,
      observaciones,
      created_at,
      vendedor:perfiles!vendedor_id (
        id,
        username
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

  const { data: zonasRepartoRaw } = await supabase
    .from("zonas_reparto")
    .select("nombre_zona, repartidor_id")
    .order("nombre_zona");

  return (
    <RegistrosClientView
      ventas={(ventasRaw as unknown as Venta[]) || []}
      ordenes={(ordenesRaw as unknown as OrdenEntrega[]) || []}
      garantias={(garantiasRaw as unknown as Garantia[]) || []}
      ordenesGarantia={(ordenesGarantiaRaw as unknown as OrdenGarantia[]) || []}
      vendedores={(perfiles as unknown as PerfilOption[]) || []}
      repartidores={(repartidores as unknown as RepartidorOption[]) || []}
      zonasReparto={(zonasRepartoRaw as unknown as ZonaReparto[]) || []}
    />
  );
}
