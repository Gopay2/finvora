'use client';

// ─── Grupo 1: React y Hooks ────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';

// ─── Grupo 2: Next.js ──────────────────────────────────────────────────────
import Link from 'next/link';

// ─── Grupo 3: Librerías Externas ───────────────────────────────────────────
import * as XLSX from 'xlsx';

// ─── Grupo 4: Tipos e Interfaces ──────────────────────────────────────────
import type {
  PedidoSugeridoFila,
  PedidoSugeridoClientViewProps,
  TipoAgrupacion,
} from '@/types/pedido-sugerido';

interface MetricasKpiCalculadas {
  totalSugerido: number;
  totalSemana1: number;
  totalSemana2: number;
  modeloLiderItem: {
    modelo: string;
    almacenamiento?: string;
    ram?: string;
  } | null;
}

// ─── Estilos Tailwind Centralizados (Identidad Finvora) ────────────────────
const styles = {
  container: 'max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12',

  // Encabezado de página: botón Volver siempre a la derecha en celular y escritorio
  header: 'flex items-center justify-between gap-3 sm:gap-4',
  titleGroup: 'space-y-1 min-w-0 flex-1',
  title: 'text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate sm:whitespace-normal',
  subtitle: 'text-slate-400 text-xs sm:text-sm line-clamp-2 sm:line-clamp-none',
  headerActions: 'flex items-center gap-3 sm:gap-4 shrink-0',

  // Botón de descarga de Excel (arriba de la tabla)
  btnExcel: 'flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-sm',
  // Botón Volver (solo dice "Volver" y la flecha)
  btnBack: 'text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors cursor-pointer',

  // Cuadrícula de KPIs con tamaño y estilo idénticos a JCI
  kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6',
  kpiCard: 'bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-secondary/30 transition-all shadow-lg h-24 sm:h-28',
  kpiValue: 'text-sm sm:text-base md:text-lg font-bold text-white text-center break-words line-clamp-2 w-full',
  kpiValueHighlight: 'text-sm sm:text-base md:text-lg font-bold text-cyan-400 text-center break-words line-clamp-2 w-full',
  kpiLabel: 'text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center mt-0.5',

  // Título situado arriba de la tabla
  sectionTitle: 'text-base sm:text-lg font-bold text-white tracking-tight',
  // Badges centrados en celular para que no queden tirados a la izquierda
  badgeContainer: 'flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap w-full sm:w-auto',
  badgePill: 'flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-slate-800 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium text-slate-300 shadow-inner shrink-0',

  // Card principal de la tabla
  cardWrapper: 'bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl',
  cardTopBar: 'p-4 sm:p-5 bg-gradient-to-b from-slate-950 to-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4',

  // Buscador: text-base en móvil (16px) previene auto-zoom en iOS Safari y Chrome móvil, text-sm en escritorio
  searchWrapper: 'relative w-full sm:w-72',
  searchInput: 'w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary transition-colors relative z-10',
  searchIcon: 'material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-base sm:text-lg pointer-events-none z-20',

  // Switch de control Región / Ciudad con altura compacta y estilizada
  switchWrapper: 'bg-slate-950/90 border border-slate-800 p-0.5 sm:p-1 rounded-xl flex items-center gap-1 w-full sm:w-72 shadow-inner relative z-10 touch-manipulation select-none',
  switchBtnActive: 'flex-1 flex items-center justify-center px-3 py-1 sm:py-1.5 min-h-[30px] sm:min-h-[32px] bg-secondary text-slate-950 font-black rounded-lg text-xs uppercase tracking-wide transition-all shadow-md shadow-secondary/20 cursor-pointer touch-manipulation select-none active:scale-95',
  switchBtnInactive: 'flex-1 flex items-center justify-center px-3 py-1 sm:py-1.5 min-h-[30px] sm:min-h-[32px] text-slate-400 hover:text-slate-200 font-bold rounded-lg text-xs uppercase tracking-wide transition-all cursor-pointer touch-manipulation select-none active:scale-95 active:bg-slate-800',

  // Estructura de la tabla: sin touch-pan-x para permitir scroll vertical nativo y cómodo en móvil
  tableWrapper: 'overflow-x-auto custom-scrollbar overscroll-x-contain touch-auto',
  table: 'w-full border-collapse text-sm text-left',
  thBase: 'px-3 sm:px-5 py-3.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap bg-slate-950/90 border-b border-slate-800',
  thHighlight: 'px-3 sm:px-5 py-3.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-cyan-400 whitespace-nowrap bg-slate-950/90 border-b border-slate-800',

  // Celdas de la tabla (el fondo de tdLocation se alterna dinámicamente por zona)
  tdLocation: 'px-4 sm:px-6 py-3.5 text-left font-bold text-slate-100 text-xs sm:text-sm whitespace-nowrap border-r border-slate-800/60 align-middle',
  tdLocationEven: 'bg-slate-950/80',
  tdLocationOdd: 'bg-slate-900/90',
  trEven: 'bg-slate-950/40 hover:bg-slate-800/40',
  trOdd: 'bg-slate-900/50 hover:bg-slate-800/60',
  trZoneDivider: 'border-t-2 border-slate-700/80',

  tdModel: 'px-4 sm:px-6 py-3 text-left font-medium text-slate-200 text-xs sm:text-sm whitespace-nowrap border-b border-slate-800/40',
  tdCount: 'px-3 sm:px-5 py-3 text-center font-semibold text-slate-300 text-xs sm:text-sm whitespace-nowrap border-b border-slate-800/40',
  tdSuggested: 'px-3 sm:px-5 py-3 text-center font-bold text-cyan-400 text-sm sm:text-base whitespace-nowrap border-b border-slate-800/40 bg-cyan-950/10',

  // Badges de especificaciones de memoria
  badgeStorage: 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700/80 shadow-sm',
  badgeRam: 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 shadow-sm',

  // Estado vacío de tabla
  emptyStateCell: 'px-6 py-16 text-center text-slate-500 italic text-sm',
};

/**
 * Agrupa una lista de filas de pedido sugerido por su nombre de ubicación (Ciudad o Región).
 */
function agruparFilasPorUbicacion(filas: PedidoSugeridoFila[]): Map<string, PedidoSugeridoFila[]> {
  const mapa = new Map<string, PedidoSugeridoFila[]>();
  filas.forEach((fila) => {
    const clave = fila.agrupacion;
    if (!mapa.has(clave)) {
      mapa.set(clave, []);
    }
    mapa.get(clave)!.push(fila);
  });
  return mapa;
}

export default function PedidoSugeridoClientView({
  filasRegion,
  filasCiudad,
  semanas,
}: PedidoSugeridoClientViewProps) {
  // Estado de vista activa: 'region' (Tijuana, Monterrey, Guadalajara) o 'ciudad'
  const [vistaActiva, setVistaActiva] = useState<TipoAgrupacion>('region');
  const [busquedaModelo, setBusquedaModelo] = useState('');

  // 1. Seleccionar filas según la vista activa del switch
  const filasActivas = useMemo(() => {
    return vistaActiva === 'region' ? filasRegion : filasCiudad;
  }, [vistaActiva, filasRegion, filasCiudad]);

  // 2. Filtrar por término de búsqueda en tiempo real
  const filasFiltradas = useMemo(() => {
    const termino = busquedaModelo.trim().toLowerCase();
    if (!termino) return filasActivas;

    return filasActivas.filter((fila) => {
      const coincideModelo = fila.modelo.toLowerCase().includes(termino);
      const coincideUbicacion = fila.agrupacion.toLowerCase().includes(termino);
      const coincideMarca = fila.marca.toLowerCase().includes(termino);
      const coincideAlmacenamiento = fila.almacenamiento?.toLowerCase().includes(termino) ?? false;
      const coincideRam = fila.ram?.toLowerCase().includes(termino) ?? false;
      return coincideModelo || coincideUbicacion || coincideMarca || coincideAlmacenamiento || coincideRam;
    });
  }, [filasActivas, busquedaModelo]);

  // 3. Estructura agrupada para renderizado con rowspan
  const mapaUbicaciones = useMemo(() => {
    return agruparFilasPorUbicacion(filasFiltradas);
  }, [filasFiltradas]);

  // 4. Métricas consolidadas de los KPIs
  const metricasKpi = useMemo<MetricasKpiCalculadas>(() => {
    const totalSugerido = filasActivas.reduce((acum, fila) => acum + fila.sugerido, 0);
    const totalSemana1 = filasActivas.reduce((acum, fila) => acum + fila.semana1, 0);
    const totalSemana2 = filasActivas.reduce((acum, fila) => acum + fila.semana2, 0);

    // Determinar el modelo más vendido en toda la empresa por variante de memoria
    const ventasTotalesPorModelo = new Map<string, {
      modelo: string;
      almacenamiento?: string;
      ram?: string;
      total: number;
    }>();

    filasRegion.forEach((fila) => {
      const clave = `${fila.modelo}___${fila.almacenamiento || ''}___${fila.ram || ''}`;
      const ventas = fila.semana1 + fila.semana2;
      if (!ventasTotalesPorModelo.has(clave)) {
        ventasTotalesPorModelo.set(clave, {
          modelo: fila.modelo,
          almacenamiento: fila.almacenamiento,
          ram: fila.ram,
          total: 0,
        });
      }
      ventasTotalesPorModelo.get(clave)!.total += ventas;
    });

    let modeloLiderItem: { modelo: string; almacenamiento?: string; ram?: string } | null = null;
    let maxVentas = 0;
    for (const item of Array.from(ventasTotalesPorModelo.values())) {
      if (item.total > maxVentas) {
        maxVentas = item.total;
        modeloLiderItem = item;
      }
    }

    return { totalSugerido, totalSemana1, totalSemana2, modeloLiderItem };
  }, [filasActivas, filasRegion]);

  /**
   * Genera y descarga un archivo Excel (.xlsx) con los datos filtrados actualmente en la tabla,
   * adaptando el nombre de la hoja, las columnas y el nombre del archivo según la vista activa (Región o Ciudad).
   */
  const handleDescargarExcel = () => {
    if (filasFiltradas.length === 0) return;

    const etiquetaUbicacion = vistaActiva === 'region' ? 'Región' : 'Ciudad';
    const nombreHoja = vistaActiva === 'region' ? 'Sugerido por Región' : 'Sugerido por Ciudad';

    const datosExcel = filasFiltradas.map((fila) => ({
      [etiquetaUbicacion]: fila.agrupacion,
      'Modelo': fila.modelo,
      'Marca': fila.marca,
      'Almacenamiento': fila.almacenamiento || '—',
      'RAM': fila.ram || '—',
      [`Semana 1 (${semanas.semana1.etiquetaCorta})`]: fila.semana1,
      [`Semana 2 (${semanas.semana2.etiquetaCorta})`]: fila.semana2,
      'Cantidad Sugerida': fila.sugerido,
    }));

    const hojaTrabajo = XLSX.utils.json_to_sheet(datosExcel);
    const libroTrabajo = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libroTrabajo, hojaTrabajo, nombreHoja);

    const fechaHoyStr = new Date().toISOString().split('T')[0];
    const sufijoArchivo = vistaActiva === 'region' ? 'Region' : 'Ciudad';
    const nombreArchivo = `Pedido_Sugerido_${sufijoArchivo}_Finvora_${fechaHoyStr}.xlsx`;

    XLSX.writeFile(libroTrabajo, nombreArchivo);
  };

  return (
    <div className={styles.container}>
      {/* ─── ENCABEZADO SUPERIOR ─────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Pedido Sugerido</h1>
          <p className={styles.subtitle}>
            Análisis de ventas de las últimas dos semanas y proyección automática de re-compra de stock
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Botón Volver estándar: solo dice "Volver" y la flecha */}
          <Link
            href="/empresa/webapp/inventario/jci"
            className={styles.btnBack}
            title="Volver a JCI"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Volver</span>
          </Link>
        </div>
      </header>

      {/* ─── RESUMEN DE MÉTRICAS KPI (ESTILO Y TAMAÑO IDÉNTICOS A JCI) ───────── */}
      <div className={styles.kpiGrid}>
        {/* KPI 1: Pedido sugerido total */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiValueHighlight}>{metricasKpi.totalSugerido}</span>
          <span className={styles.kpiLabel}>Pedido sugerido total</span>
        </div>

        {/* KPI 2: Ventas Semana 2 */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{metricasKpi.totalSemana2}</span>
          <span className={styles.kpiLabel}>Ventas Semana 2</span>
        </div>

        {/* KPI 3: Ventas Semana 1 */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{metricasKpi.totalSemana1}</span>
          <span className={styles.kpiLabel}>Ventas Semana 1</span>
        </div>

        {/* KPI 4: Modelo más vendido con especificaciones */}
        <div className={styles.kpiCard}>
          {metricasKpi.modeloLiderItem ? (
            <div className="flex flex-col items-center justify-center gap-1 w-full px-2">
              <span className={styles.kpiValue} title={metricasKpi.modeloLiderItem.modelo}>
                {metricasKpi.modeloLiderItem.modelo}
              </span>
              {(metricasKpi.modeloLiderItem.almacenamiento || metricasKpi.modeloLiderItem.ram) && (
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {metricasKpi.modeloLiderItem.almacenamiento && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/80">
                      {metricasKpi.modeloLiderItem.almacenamiento}
                    </span>
                  )}
                  {metricasKpi.modeloLiderItem.ram && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                      {metricasKpi.modeloLiderItem.ram.includes('RAM') ? metricasKpi.modeloLiderItem.ram : `${metricasKpi.modeloLiderItem.ram} RAM`}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <span className={styles.kpiValue}>—</span>
          )}
          <span className={styles.kpiLabel}>Modelo mas vendido</span>
        </div>
      </div>

      {/* ─── FILA SUPERIOR ARRIBA DE LA TABLA: TÍTULO Y BOTÓN DE EXCEL ──────── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <h2 className={styles.sectionTitle}>
          Ventas ultimas 2 semanas
        </h2>

        {/* Botón de Excel arriba de la tabla */}
        <button
          onClick={handleDescargarExcel}
          className={styles.btnExcel}
          title="Descargar reporte en formato Excel (.xlsx)"
          type="button"
        >
          <span className="material-symbols-outlined text-base md:text-xl shrink-0">download</span>
        </button>
      </div>

      {/* ─── CARD PRINCIPAL: TABLA DE PEDIDO SUGERIDO ───────────────────────── */}
      <section className={styles.cardWrapper}>
        {/* Barra superior de controles: Buscador y Switch (Izq) | Semanas Centradas (Der) */}
        <div className={styles.cardTopBar}>
          {/* Lado izquierdo: Buscador arriba y Switch abajo */}
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            {/* Buscador */}
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>search</span>
              <input
                type="text"
                id="busqueda-pedido-sugerido"
                name="busqueda-pedido-sugerido"
                value={busquedaModelo}
                onChange={(event) => setBusquedaModelo(event.target.value)}
                onInput={(event: React.FormEvent<HTMLInputElement>) => setBusquedaModelo(event.currentTarget.value)}
                placeholder="Buscar modelo o marca..."
                className={styles.searchInput}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                suppressHydrationWarning
              />
            </div>

            {/* Switch Región / Ciudad abajo del buscador */}
            <div className={styles.switchWrapper}>
              <button
                type="button"
                onClick={() => setVistaActiva('region')}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setVistaActiva('region');
                }}
                className={vistaActiva === 'region' ? styles.switchBtnActive : styles.switchBtnInactive}
              >
                <span className="pointer-events-none">Región</span>
              </button>

              <button
                type="button"
                onClick={() => setVistaActiva('ciudad')}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setVistaActiva('ciudad');
                }}
                className={vistaActiva === 'ciudad' ? styles.switchBtnActive : styles.switchBtnInactive}
              >
                <span className="pointer-events-none">Ciudad</span>
              </button>
            </div>
          </div>

          {/* Lado derecho: Badges de Semana 1 y 2 centrados en móvil */}
          <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto self-center">
            <div className={styles.badgeContainer}>
              <div className={styles.badgePill} title={semanas.semana1.etiquetaCompleta}>
                <span className="material-symbols-outlined text-secondary text-[11px] sm:text-xs">calendar_today</span>
                <span className="text-slate-400 font-semibold text-[10px] sm:text-xs">Semana 1:</span>
                <span className="text-slate-200 font-bold text-[10px] sm:text-xs">{semanas.semana1.etiquetaCorta}</span>
              </div>

              <div className={styles.badgePill} title={semanas.semana2.etiquetaCompleta}>
                <span className="material-symbols-outlined text-secondary text-[11px] sm:text-xs">calendar_today</span>
                <span className="text-slate-400 font-semibold text-[10px] sm:text-xs">Semana 2:</span>
                <span className="text-slate-200 font-bold text-[10px] sm:text-xs">{semanas.semana2.etiquetaCorta}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TABLA DE DATOS ───────────────────────────────────────────────── */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thBase} style={{ width: '22%' }}>
                  {vistaActiva === 'region' ? 'Región' : 'Ciudad'}
                </th>
                <th className={styles.thBase} style={{ width: '30%', textAlign: 'left' }}>
                  Modelo
                </th>
                <th className={styles.thBase} style={{ width: '16%' }}>
                  Semana 1
                </th>
                <th className={styles.thBase} style={{ width: '16%' }}>
                  Semana 2
                </th>
                <th className={styles.thHighlight} style={{ width: '16%' }}>
                  Sugerido
                </th>
              </tr>
            </thead>

            <tbody>
              {mapaUbicaciones.size === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyStateCell}>
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">
                      inventory_2
                    </span>
                    No se encontraron registros de ventas en las dos semanas anteriores para este filtro.
                  </td>
                </tr>
              ) : (
                Array.from(mapaUbicaciones.entries()).map(([ubicacionNombre, filasGrupo], indiceGrupo) => {
                  const esGrupoPar = indiceGrupo % 2 === 0;
                  const claseFondoFila = esGrupoPar ? styles.trEven : styles.trOdd;
                  const claseFondoUbicacion = esGrupoPar ? styles.tdLocationEven : styles.tdLocationOdd;
                  const bordeDivisionZona = indiceGrupo > 0 ? styles.trZoneDivider : '';

                  return filasGrupo.map((fila, indiceFila) => {
                    const esPrimeraFilaDelGrupo = indiceFila === 0;

                    return (
                      <tr
                        key={fila.id}
                        className={`${claseFondoFila} ${esPrimeraFilaDelGrupo ? bordeDivisionZona : ''} transition-colors duration-150`}
                      >
                        {/* Celda combinada de Ciudad/Región con Pin de Ubicación (RowSpan) */}
                        {esPrimeraFilaDelGrupo && (
                          <td
                            rowSpan={filasGrupo.length}
                            className={`${styles.tdLocation} ${claseFondoUbicacion}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-cyan-400 text-lg sm:text-xl shrink-0">
                                location_on
                              </span>
                              <span className="tracking-wide">{ubicacionNombre}</span>
                            </div>
                          </td>
                        )}

                        {/* Nombre del Modelo con especificaciones en badges visuales (sin '-') */}
                        <td className={styles.tdModel}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-100">{fila.modelo}</span>
                            {(fila.almacenamiento || fila.ram) && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {fila.almacenamiento && (
                                  <span className={styles.badgeStorage}>
                                    {fila.almacenamiento}
                                  </span>
                                )}
                                {fila.ram && (
                                  <span className={styles.badgeRam}>
                                    {fila.ram.includes('RAM') ? fila.ram : `${fila.ram} RAM`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Ventas Semana 1 */}
                        <td className={styles.tdCount}>{fila.semana1}</td>

                        {/* Ventas Semana 2 */}
                        <td className={styles.tdCount}>{fila.semana2}</td>

                        {/* Cantidad Sugerida (Destacada en Cyan) */}
                        <td className={styles.tdSuggested}>
                          <span>{fila.sugerido}</span>
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
