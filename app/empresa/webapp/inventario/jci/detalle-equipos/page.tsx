// ─── Grupo 1: React y Next.js ───────────────────────────────────────────────
import React from 'react';

// ─── Grupo 2: Componentes Internos ──────────────────────────────────────────
import AccessDenied from '@/components/empresa/AccessDenied';
import DetalleEquiposClientView from '@/components/empresa/jci/detalle-equipos/DetalleEquiposClientView';

// ─── Grupo 3: Utilidades y Base de Datos ────────────────────────────────────
import { getUserProfile, isAllowed } from '@/utils/auth-check';
import { createClient } from '@/utils/supabase/server';
import { fetchAllFromTable } from '@/utils/supabase/pagination';

// ─── Grupo 4: Tipos e Interfaces ────────────────────────────────────────────
import type {
  StockConcesionItem,
  VentaItem,
  RepartidorOption,
  PerfilOption,
} from '@/types/detalle-equipos-jci';

export const revalidate = 0;

/**
 * Página de Auditoría y Detalle de Equipos (JCI).
 * Carga en paralelo inventario activo en concesión, histórico de ventas, ubicaciones y vendedores.
 */
export default async function DetalleEquiposPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ['Admin', 'Supervisor', 'Developer', 'JCI'])) {
    return <AccessDenied role={userRole} sectionName="Detalle Equipos JCI" />;
  }

  const supabase = await createClient();

  // Carga paralela de stock en concesión, ventas, repartidores y vendedores
  const [
    equiposConcesionRaw,
    todasVentasRaw,
    { data: repartidoresRaw },
    { data: vendedoresRaw },
  ] = await Promise.all([
    // 1. Equipos en stock actualmente bajo modalidad de concesión
    fetchAllFromTable<StockConcesionItem>(
      supabase,
      'stock',
      `
        imei,
        producto_id,
        zona,
        estado,
        estado_previo,
        fecha_ingreso,
        fecha_en_envio,
        productos (
          id,
          marca,
          modelo,
          color,
          almacenamiento,
          ram
        ),
        repartidores:repartidores!zona (
          id,
          nombre
        )
      `,
      {
        orderColumn: 'fecha_ingreso',
        ascending: false,
        filterFn: (query) =>
          query.or('estado.eq.Concesión,and(estado.eq.En envío,estado_previo.eq.Concesión)'),
      }
    ),

    // 2. Historial de ventas completo
    fetchAllFromTable<VentaItem>(
      supabase,
      'ventas',
      `
        id,
        imei,
        producto_id,
        zona,
        vendedor_id,
        vendedor_nombre,
        fecha_ingreso,
        fecha_venta,
        estado_previo,
        productos (
          id,
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
      `,
      {
        orderColumn: 'fecha_venta',
        ascending: false,
      }
    ).catch((fetchError) => {
      console.warn('Aviso al consultar ventas en Detalle Equipos:', fetchError);
      return [] as VentaItem[];
    }),

    // 3. Catálogo de repartidores / ubicaciones
    supabase
      .from('repartidores')
      .select('id, nombre')
      .order('nombre', { ascending: true }),

    // 4. Catálogo de perfiles / vendedores
    supabase
      .from('perfiles')
      .select('id, username')
      .order('username', { ascending: true }),
  ]);

  // Clasificación de ventas estricta por estado_previo
  const ventasConcesion = (todasVentasRaw || []).filter((venta) => {
    const estado = (venta.estado_previo || '').trim().toLowerCase();
    return estado === 'concesión' || estado === 'concesion';
  });

  const estadosCreditoPermitidos = ['disponible', 'test', 'a consultar'];
  const ventasCredito = (todasVentasRaw || []).filter((venta) => {
    if (!venta.estado_previo) return false;
    return estadosCreditoPermitidos.includes(venta.estado_previo.trim().toLowerCase());
  });

  const repartidores: RepartidorOption[] = repartidoresRaw || [];
  const vendedores: PerfilOption[] = (vendedoresRaw || []).filter(
    (perfil: PerfilOption) => Boolean(perfil.username && perfil.username.trim())
  );

  return (
    <DetalleEquiposClientView
      equiposConcesion={equiposConcesionRaw || []}
      ventasConcesion={ventasConcesion}
      ventasCredito={ventasCredito}
      repartidores={repartidores}
      vendedores={vendedores}
    />
  );
}

