import React from "react";
import { getUserProfile } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import MisOperacionesClientPage from "@/components/empresa/MisOperacionesClientPage";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";

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
  const rawComprobantes = (data as any) || [];
  const comprobantesList: ComprobanteRecord[] = rawComprobantes.map((comprobanteRaw: any) => ({
    id: comprobanteRaw.id,
    nombre_cliente: comprobanteRaw.nombre_cliente,
    comentarios: comprobanteRaw.comentarios || null,
    precio_compra: Number(comprobanteRaw.precio_compra),
    pago_inicial: Number(comprobanteRaw.pago_inicial),
    pago_recibido: Number(comprobanteRaw.pago_recibido),
    celular: comprobanteRaw.celular || null,
    color_celular: comprobanteRaw.color_celular || null,
    imei: comprobanteRaw.imei || null,
    comprobante_url: comprobanteRaw.comprobante_url,
    created_at: comprobanteRaw.created_at,
    vendedor: Array.isArray(comprobanteRaw.vendedor) ? comprobanteRaw.vendedor[0] : comprobanteRaw.vendedor,
    repartidor: Array.isArray(comprobanteRaw.repartidor) ? comprobanteRaw.repartidor[0] : comprobanteRaw.repartidor,
    creador: Array.isArray(comprobanteRaw.creador) ? comprobanteRaw.creador[0] : comprobanteRaw.creador,
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
