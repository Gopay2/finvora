import React from "react";
import { getUserProfile } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import MisOperacionesClientPage from "@/components/empresa/MisOperacionesClientPage";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";

interface RawComprobanteItem {
  id: string;
  nombre_cliente: string;
  comentarios: string | null;
  precio_compra: number | string;
  pago_inicial: number | string;
  pago_recibido: number | string;
  pago_semanal: number | string | null;
  plazos: number | string | null;
  precio_total: number | string | null;
  tag: string | null;
  celular: string | null;
  color_celular: string | null;
  imei: string | null;
  comprobante_url: string;
  created_at: string;
  vendedor: { id: string; username: string; role: string } | { id: string; username: string; role: string }[] | null;
  repartidor: { id: string; nombre: string } | { id: string; nombre: string }[] | null;
  creador: { id: string; username: string; role: string } | { id: string; username: string; role: string }[] | null;
}

export const revalidate = 0;

export default async function MisOperacionesPage() {
  const { id: currentUserId, role: userRole } = await getUserProfile();

  // 1. Control de acceso: Todos los roles menos "Sin rol"
  if (!currentUserId || userRole === "Sin rol") {
    return <AccessDenied role={userRole} sectionName="Mis Operaciones" />;
  }

  const supabase = await createClient();

  // 2. Obtener el ID de repartidor asociado al perfil actual si existe
  const { data: repartidorRow } = await supabase
    .from('repartidores')
    .select('id')
    .eq('perfil_id', currentUserId)
    .maybeSingle();

  const repartidorId = repartidorRow?.id || null;

  // 3. Obtener registros históricos de los últimos 2 meses
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  let query = supabase
    .from('comprobantes')
    .select(`
      id,
      nombre_cliente,
      comentarios,
      precio_compra,
      pago_inicial,
      pago_recibido,
      pago_semanal,
      plazos,
      precio_total,
      tag,
      celular,
      color_celular,
      imei,
      comprobante_url,
      created_at,
      vendedor:perfiles!vendedor_id (id, username, role),
      repartidor:repartidores!repartidor_id (id, nombre, perfil_id),
      creador:perfiles!creado_por (id, username, role)
    `)
    .gte('created_at', twoMonthsAgo.toISOString());

  // Aplicar el filtro OR dinámico según la vinculación del usuario logueado
  if (repartidorId) {
    query = query.or(`vendedor_id.eq.${currentUserId},creado_por.eq.${currentUserId},repartidor_id.eq.${repartidorId}`);
  } else {
    query = query.or(`vendedor_id.eq.${currentUserId},creado_por.eq.${currentUserId}`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error("Error al obtener mis operaciones:", error);
  }

  // 4. Mapear y formatear los datos para el componente de cliente
  const rawComprobantes = (data as unknown as RawComprobanteItem[]) || [];
  const comprobantesList: ComprobanteRecord[] = rawComprobantes.map((comprobanteRaw: RawComprobanteItem) => ({
    id: comprobanteRaw.id,
    nombre_cliente: comprobanteRaw.nombre_cliente,
    comentarios: comprobanteRaw.comentarios || null,
    precio_compra: Number(comprobanteRaw.precio_compra),
    pago_inicial: Number(comprobanteRaw.pago_inicial),
    pago_recibido: Number(comprobanteRaw.pago_recibido),
    pago_semanal: comprobanteRaw.pago_semanal != null ? Number(comprobanteRaw.pago_semanal) : null,
    plazos: comprobanteRaw.plazos || null,
    precio_total: comprobanteRaw.precio_total != null ? Number(comprobanteRaw.precio_total) : null,
    tag: comprobanteRaw.tag || null,
    celular: comprobanteRaw.celular || null,
    color_celular: comprobanteRaw.color_celular || null,
    imei: comprobanteRaw.imei || null,
    comprobante_url: comprobanteRaw.comprobante_url,
    created_at: comprobanteRaw.created_at,
    vendedor: comprobanteRaw.vendedor ? (Array.isArray(comprobanteRaw.vendedor) ? (comprobanteRaw.vendedor[0] || null) : comprobanteRaw.vendedor) : null,
    repartidor: comprobanteRaw.repartidor ? (Array.isArray(comprobanteRaw.repartidor) ? (comprobanteRaw.repartidor[0] || null) : comprobanteRaw.repartidor) : null,
    creador: comprobanteRaw.creador ? (Array.isArray(comprobanteRaw.creador) ? (comprobanteRaw.creador[0] || null) : comprobanteRaw.creador) : null,
  }));

  return (
    <MisOperacionesPageContent comprobantesList={comprobantesList} />
  );
}

// Sub-componente wrapper para separar claramente la carga server-side
function MisOperacionesPageContent({ comprobantesList }: { comprobantesList: ComprobanteRecord[] }) {
  return (
    <MisOperacionesClientPage comprobantesList={comprobantesList} />
  );
}
