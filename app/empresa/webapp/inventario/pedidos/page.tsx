import React from 'react';
import Link from 'next/link';
import { getUserProfile, isAllowed } from '@/utils/auth-check';
import AccessDenied from '@/components/empresa/AccessDenied';
import { createClient } from '@/utils/supabase/server';
import { getVendedores } from '@/app/empresa/webapp/stock/stock-actions';
import PedidosClientView from '@/components/empresa/inventario/pedidos/PedidosClientView';
import type { Product, ZonaRepartoItem } from '@/types/stock';

export const revalidate = 0;

const ALLOWED_ROLES = ['Admin', 'Supervisor', 'Developer', 'JCI', 'Closer'];

const styles = {
  container: 'max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12',
  header: 'flex items-center justify-between',
  titleGroup: 'space-y-1',
  title: 'text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent',
  subtitle: 'text-slate-500 text-sm',
  btnBack: 'text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors cursor-pointer',
};

export default async function PedidosPage() {
  const { role: userRole, username: userName } = await getUserProfile();

  // Solo Admin, Supervisor, Developer, JCI y Closer tienen acceso
  if (!isAllowed(userRole, ALLOWED_ROLES)) {
    return <AccessDenied role={userRole} sectionName="Pedidos de Inventario" />;
  }

  const supabase = await createClient();

  // 1. Obtener catálogo de productos
  const { data: productosRaw } = await supabase
    .from('productos')
    .select('id, marca, modelo, color, almacenamiento, ram')
    .order('marca', { ascending: true });

  const productos: Product[] = productosRaw || [];

  // 2. Obtener zonas de reparto configuradas
  const { data: zonasRepartoRaw } = await supabase
    .from('zonas_reparto')
    .select(`
      id,
      nombre_zona,
      sigla,
      repartidor_id,
      repartidores (
        id,
        nombre,
        activo
      )
    `)
    .order('nombre_zona', { ascending: true });

  interface ZonaRepartoRaw {
    id: string;
    nombre_zona: string;
    sigla?: string;
    repartidor_id: string;
    repartidores: {
      id: string;
      nombre: string;
      activo: boolean;
    } | null;
  }

  const zonasReparto: ZonaRepartoItem[] = ((zonasRepartoRaw as unknown as ZonaRepartoRaw[]) || [])
    .filter((z) => z.nombre_zona && z.repartidores?.activo)
    .map((z) => ({
      id: z.id,
      nombre_zona: z.nombre_zona,
      sigla: z.sigla,
      repartidor_id: z.repartidor_id,
      repartidor_nombre: z.repartidores?.nombre || '',
    }));

  // 3. Obtener vendedores para los filtros de cargos superiores
  const vendedores = await getVendedores();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Pedidos</h1>
          <p className={styles.subtitle}>
            Solicitud de unidades para reposición de stock
          </p>
        </div>
        <Link href="/empresa/webapp/inventario" className={styles.btnBack} title="Volver a Inventario">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </header>

      {/* Componente interactivo cliente */}
      <PedidosClientView
        productos={productos}
        zonasReparto={zonasReparto}
        vendedores={vendedores}
        userRole={userRole}
        userName={userName || 'Vendedor'}
      />
    </div>
  );
}
