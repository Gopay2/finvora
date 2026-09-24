// ─── Grupo 1: React y Next.js ───────────────────────────────────────────────
import React from 'react';

// ─── Grupo 2: Componentes Internos ──────────────────────────────────────────
import AccessDenied from '@/components/empresa/AccessDenied';
import PedidoSugeridoClientView from '@/components/empresa/jci/PedidoSugeridoClientView';

// ─── Grupo 3: Utilidades y Base de Datos ────────────────────────────────────
import { getUserProfile, isAllowed } from '@/utils/auth-check';
import { createClient } from '@/utils/supabase/server';
import { fetchAllFromTable } from '@/utils/supabase/pagination';
import {
  getDosSemanasAnterioresTijuana,
  identificarRegionDeModelo,
  mapearNombreRegionCompleto,
  limpiarNombreModeloComercial,
  calcularCantidadSugerida,
} from '@/utils/pedido-sugerido';

// ─── Grupo 4: Tipos e Interfaces ────────────────────────────────────────────
import type { PedidoSugeridoFila, TipoAgrupacion } from '@/types/pedido-sugerido';

export const revalidate = 0;

interface VentaItemRaw {
  id: string;
  imei: string;
  producto_id: string;
  zona: string | null;
  fecha_venta: string;
  productos: {
    marca: string;
    modelo: string;
    almacenamiento?: string | null;
    ram?: string | null;
  } | null;
}

interface OrdenEntregaRaw {
  imei: string | null;
  zona: string | null;
}

interface RepartidorRaw {
  id: string;
  nombre: string;
}

interface AcumuladorItemVenta {
  agrupacion: string;
  marca: string;
  modelo: string;
  almacenamiento?: string;
  ram?: string;
  semana1: number;
  semana2: number;
}

/**
 * Normaliza y deduce la Ciudad de una venta cruzando la orden de entrega,
 * el repartidor asignado y la sigla regional del modelo.
 *
 * @param venta - Registro bruto de venta
 * @param mapaOrdenes - Mapa IMEI -> Zona de entrega
 * @param mapaRepartidores - Mapa ID -> Nombre de repartidor
 * @param regionModelo - Sigla regional detectada del modelo ('TIJ' | 'GDL' | 'MTY')
 * @returns Nombre de la ciudad normalizada
 */
function deducirCiudadDeVenta(
  venta: VentaItemRaw,
  mapaOrdenes: Map<string, string>,
  mapaRepartidores: Map<string, string>,
  regionModelo: 'TIJ' | 'GDL' | 'MTY'
): string {
  // 1. Cruce directo por IMEI en órdenes de entrega (máxima certeza geográfica)
  if (venta.imei && mapaOrdenes.has(venta.imei)) {
    const zonaOrden = mapaOrdenes.get(venta.imei)!.toUpperCase().trim();
    if (zonaOrden.includes('ROSARITO')) return 'Rosarito';
    if (zonaOrden.includes('ENSENADA')) return 'Ensenada';
    if (zonaOrden.includes('MEXICALI')) return 'Mexicali';
    if (zonaOrden.includes('MONTERREY') || zonaOrden.includes('MTY')) return 'Monterrey';
    if (zonaOrden.includes('GUADALAJARA') || zonaOrden.includes('GDL')) return 'Guadalajara';
    if (zonaOrden.includes('TIJUANA') || zonaOrden.includes('TIJ')) return 'Tijuana';
    return zonaOrden.charAt(0).toUpperCase() + zonaOrden.slice(1).toLowerCase();
  }

  // 2. Comprobar si el nombre del repartidor indica una ciudad específica
  if (venta.zona && mapaRepartidores.has(venta.zona)) {
    const nombreRepartidor = mapaRepartidores.get(venta.zona)!.toUpperCase();
    if (nombreRepartidor.includes('ROSARITO')) return 'Rosarito';
    if (nombreRepartidor.includes('ENSENADA')) return 'Ensenada';
    if (nombreRepartidor.includes('MEXICALI')) return 'Mexicali';
    if (nombreRepartidor.includes('MONTERREY')) return 'Monterrey';
    if (nombreRepartidor.includes('GUADALAJARA')) return 'Guadalajara';
  }

  // 3. Fallback basado en la sigla regional del modelo
  if (regionModelo === 'MTY') return 'Monterrey';
  if (regionModelo === 'GDL') return 'Guadalajara';
  return 'Tijuana';
}

/**
 * Normaliza y formatea capacidades de almacenamiento o RAM (ej: "128" -> "128GB", "4" -> "4GB").
 *
 * @param valor - Texto original de capacidad o memoria
 * @returns Cadena normalizada en mayúsculas o undefined si no hay valor
 */
function normalizarCapacidad(valor?: string | null): string | undefined {
  if (!valor) return undefined;
  let val = valor.trim().replace(/\s+/g, '');
  if (/^\d+$/.test(val)) {
    val = `${val}GB`;
  }
  return val.toUpperCase();
}

/**
 * Acumula ventas individuales en mapas agrupados por clave única (zona + modelo + specs).
 *
 * @param ventas - Listado de ventas obtenidas de la base de datos
 * @param semana1InicioIso - Inicio ISO de Semana 1
 * @param semana1FinIso - Fin ISO de Semana 1
 * @param semana2InicioIso - Inicio ISO de Semana 2
 * @param semana2FinIso - Fin ISO de Semana 2
 * @param mapaOrdenes - Mapa IMEI -> Zona de entrega
 * @param mapaRepartidores - Mapa ID -> Nombre de repartidor
 * @returns Mapas acumuladores para Región y Ciudad
 */
function acumularVentasPorZona(
  ventas: VentaItemRaw[],
  semana1InicioIso: string,
  semana1FinIso: string,
  semana2InicioIso: string,
  semana2FinIso: string,
  mapaOrdenes: Map<string, string>,
  mapaRepartidores: Map<string, string>
): { mapaRegion: Map<string, AcumuladorItemVenta>; mapaCiudad: Map<string, AcumuladorItemVenta> } {
  const mapaRegion = new Map<string, AcumuladorItemVenta>();
  const mapaCiudad = new Map<string, AcumuladorItemVenta>();

  ventas.forEach((venta) => {
    const fechaVentaIso = new Date(venta.fecha_venta).toISOString();
    const esSemana1 = fechaVentaIso >= semana1InicioIso && fechaVentaIso <= semana1FinIso;
    const esSemana2 = fechaVentaIso >= semana2InicioIso && fechaVentaIso <= semana2FinIso;

    if (!esSemana1 && !esSemana2) return;

    const marca = (venta.productos?.marca || 'Desconocida').trim();
    const modeloOriginal = (venta.productos?.modelo || 'Modelo Desconocido').trim();
    const almacenamiento = normalizarCapacidad(venta.productos?.almacenamiento);
    const ram = normalizarCapacidad(venta.productos?.ram);

    const modeloLimpio = limpiarNombreModeloComercial(modeloOriginal, marca);
    const regionSigla = identificarRegionDeModelo(modeloOriginal);
    const regionNombre = mapearNombreRegionCompleto(regionSigla);
    const ciudad = deducirCiudadDeVenta(venta, mapaOrdenes, mapaRepartidores, regionSigla);

    // Acumulación por Región
    const claveRegion = `${regionNombre}___${modeloLimpio}___${almacenamiento || 'SIN_ALM'}___${ram || 'SIN_RAM'}`;
    if (!mapaRegion.has(claveRegion)) {
      mapaRegion.set(claveRegion, {
        agrupacion: regionNombre,
        marca,
        modelo: modeloLimpio,
        almacenamiento,
        ram,
        semana1: 0,
        semana2: 0,
      });
    }
    const itemRegion = mapaRegion.get(claveRegion)!;
    if (esSemana1) itemRegion.semana1++;
    if (esSemana2) itemRegion.semana2++;

    // Acumulación por Ciudad
    const claveCiudad = `${ciudad}___${modeloLimpio}___${almacenamiento || 'SIN_ALM'}___${ram || 'SIN_RAM'}`;
    if (!mapaCiudad.has(claveCiudad)) {
      mapaCiudad.set(claveCiudad, {
        agrupacion: ciudad,
        marca,
        modelo: modeloLimpio,
        almacenamiento,
        ram,
        semana1: 0,
        semana2: 0,
      });
    }
    const itemCiudad = mapaCiudad.get(claveCiudad)!;
    if (esSemana1) itemCiudad.semana1++;
    if (esSemana2) itemCiudad.semana2++;
  });

  return { mapaRegion, mapaCiudad };
}

/**
 * Convierte un mapa acumulador en un arreglo de filas tipadas y ordenadas por prioridad geográfica y demanda.
 *
 * @param mapa - Mapa acumulador
 * @param tipoAgrupacion - 'region' | 'ciudad'
 * @param ordenPrioridad - Diccionario de prioridad geográfica
 * @returns Arreglo de filas de Pedido Sugerido ordenado
 */
function mapearYOrdenarFilas(
  mapa: Map<string, AcumuladorItemVenta>,
  tipoAgrupacion: TipoAgrupacion,
  ordenPrioridad: Record<string, number>
): PedidoSugeridoFila[] {
  const prefijoId = tipoAgrupacion === 'region' ? 'reg' : 'ciu';

  return Array.from(mapa.entries())
    .map(([clave, valor]) => ({
      id: `${prefijoId}_${clave}`,
      agrupacion: valor.agrupacion,
      tipoAgrupacion,
      modelo: valor.modelo,
      marca: valor.marca,
      almacenamiento: valor.almacenamiento,
      ram: valor.ram,
      semana1: valor.semana1,
      semana2: valor.semana2,
      sugerido: calcularCantidadSugerida(valor.semana1, valor.semana2),
    }))
    .sort((filaA, filaB) => {
      const prioridadA = ordenPrioridad[filaA.agrupacion] || 99;
      const prioridadB = ordenPrioridad[filaB.agrupacion] || 99;
      if (prioridadA !== prioridadB) return prioridadA - prioridadB;
      if (filaB.sugerido !== filaA.sugerido) return filaB.sugerido - filaA.sugerido;
      const cmp = filaA.modelo.localeCompare(filaB.modelo);
      if (cmp !== 0) return cmp;
      return (filaA.almacenamiento || '').localeCompare(filaB.almacenamiento || '');
    });
}

/**
 * Procesa la matriz completa de Pedido Sugerido generando las listas de Región y Ciudad.
 *
 * @param ventas - Listado de ventas brutas
 * @param semana1InicioIso - Inicio de Semana 1
 * @param semana1FinIso - Fin de Semana 1
 * @param semana2InicioIso - Inicio de Semana 2
 * @param semana2FinIso - Fin de Semana 2
 * @param mapaOrdenes - Mapa auxiliar de órdenes
 * @param mapaRepartidores - Mapa auxiliar de repartidores
 * @returns Filas procesadas para ambas vistas
 */
function procesarMatrizPedidoSugerido(
  ventas: VentaItemRaw[],
  semana1InicioIso: string,
  semana1FinIso: string,
  semana2InicioIso: string,
  semana2FinIso: string,
  mapaOrdenes: Map<string, string>,
  mapaRepartidores: Map<string, string>
): { filasRegion: PedidoSugeridoFila[]; filasCiudad: PedidoSugeridoFila[] } {
  const { mapaRegion, mapaCiudad } = acumularVentasPorZona(
    ventas,
    semana1InicioIso,
    semana1FinIso,
    semana2InicioIso,
    semana2FinIso,
    mapaOrdenes,
    mapaRepartidores
  );

  const ordenRegiones: Record<string, number> = {
    Tijuana: 1,
    Monterrey: 2,
    Guadalajara: 3,
  };

  const ordenCiudades: Record<string, number> = {
    Tijuana: 1,
    Rosarito: 2,
    Ensenada: 3,
    Mexicali: 4,
    Monterrey: 5,
    Guadalajara: 6,
  };

  const filasRegion = mapearYOrdenarFilas(mapaRegion, 'region', ordenRegiones);
  const filasCiudad = mapearYOrdenarFilas(mapaCiudad, 'ciudad', ordenCiudades);

  return { filasRegion, filasCiudad };
}

export default async function PedidoSugeridoPage() {
  // 1. Verificación de permisos y autorización
  const { role: userRole } = await getUserProfile();
  if (!isAllowed(userRole, ['Admin', 'Supervisor', 'Developer', 'JCI'])) {
    return <AccessDenied role={userRole} sectionName="Pedido Sugerido" />;
  }

  // 2. Determinar las dos semanas anteriores cerradas en horario Tijuana
  const semanas = getDosSemanasAnterioresTijuana();
  const fechaInicioRango = semanas.semana1.fechaInicioIso;
  const fechaFinRango = semanas.semana2.fechaFinIso;

  const supabase = await createClient();

  // 3. Descarga paralela optimizada y paginada sin límite de 1.000 filas
  const [ventasRaw, ordenesRaw, repartidoresRaw] = await Promise.all([
    // Ventas dentro del rango de ambas semanas con especificaciones de productos
    fetchAllFromTable<VentaItemRaw>(
      supabase,
      'ventas',
      'id, imei, producto_id, zona, fecha_venta, productos(marca, modelo, almacenamiento, ram)',
      {
        orderColumn: 'fecha_venta',
        ascending: false,
        filterFn: (query) =>
          query
            .gte('fecha_venta', fechaInicioRango)
            .lte('fecha_venta', fechaFinRango),
      }
    ).catch((error) => {
      console.error('Error al obtener ventas para Pedido Sugerido:', error);
      return [] as VentaItemRaw[];
    }),

    // Órdenes de entrega para resolución geográfica por IMEI
    fetchAllFromTable<OrdenEntregaRaw>(
      supabase,
      'ordenes_entrega',
      'imei, zona'
    ).catch(() => [] as OrdenEntregaRaw[]),

    // Repartidores para resolución de zonas específicas
    fetchAllFromTable<RepartidorRaw>(
      supabase,
      'repartidores',
      'id, nombre'
    ).catch(() => [] as RepartidorRaw[]),
  ]);

  // 4. Mapas auxiliares para resolución rápida O(1)
  const mapaOrdenes = new Map<string, string>();
  ordenesRaw.forEach((orden) => {
    if (orden.imei && orden.zona) {
      mapaOrdenes.set(orden.imei.trim(), orden.zona.trim());
    }
  });

  const mapaRepartidores = new Map<string, string>();
  repartidoresRaw.forEach((repartidor) => {
    mapaRepartidores.set(repartidor.id, repartidor.nombre);
  });

  // 5. Procesamiento de la matriz para Región y Ciudad
  const { filasRegion, filasCiudad } = procesarMatrizPedidoSugerido(
    ventasRaw,
    semanas.semana1.fechaInicioIso,
    semanas.semana1.fechaFinIso,
    semanas.semana2.fechaInicioIso,
    semanas.semana2.fechaFinIso,
    mapaOrdenes,
    mapaRepartidores
  );

  return (
    <PedidoSugeridoClientView
      filasRegion={filasRegion}
      filasCiudad={filasCiudad}
      semanas={semanas}
    />
  );
}
