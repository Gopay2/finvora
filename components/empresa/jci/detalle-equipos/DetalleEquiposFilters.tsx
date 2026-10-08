'use client';

// ─── Grupo 1: React y Next.js ───────────────────────────────────────────────
import React from 'react';

// ─── Grupo 2: Tipos e Interfaces ────────────────────────────────────────────
import type {
  RepartidorOption,
  PerfilOption,
  DetalleEquiposTab,
} from '@/types/detalle-equipos-jci';

interface DetalleEquiposFiltersProps {
  activeTab: DetalleEquiposTab;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedUbicacion: string;
  setSelectedUbicacion: (ubicacionId: string) => void;
  selectedVendedor: string;
  setSelectedVendedor: (vendedorId: string) => void;
  fechaDesde: string;
  setFechaDesde: (fecha: string) => void;
  fechaHasta: string;
  setFechaHasta: (fecha: string) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  repartidores: RepartidorOption[];
  vendedores: PerfilOption[];
  isIOS: boolean;
  handleOpenPicker: (event: React.MouseEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  hasDataToExport: boolean;
}

/**
 * Componente de filtros reactivos para la sección Detalle de Equipos.
 * - Fila superior: 3 columnas (Buscador General, Vendedor, Repartidor/Ubicación).
 * - El selector de Vendedor se deshabilita automáticamente en la pestaña de stock a concesión.
 * - El selector de Repartidor/Ubicación se deshabilita automáticamente en las pestañas de equipos vendidos (concesión y crédito).
 * - Fila inferior: Rango de fechas (Desde, Hasta) y acciones (Limpiar, Descargar Excel).
 */
export function DetalleEquiposFilters({
  activeTab,
  searchQuery,
  setSearchQuery,
  selectedUbicacion,
  setSelectedUbicacion,
  selectedVendedor,
  setSelectedVendedor,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  setCurrentPage,
  resetFilters,
  hasActiveFilters,
  repartidores,
  vendedores,
  isIOS,
  handleOpenPicker,
  onExportExcel,
  hasDataToExport,
}: DetalleEquiposFiltersProps) {
  const isStockTab = activeTab === 'concesion';

  const styles = {
    filterGroup: "flex flex-col gap-1.5",
    label: "text-[10px] uppercase tracking-wider text-slate-400 font-bold",
    input: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary/40 transition-all",
    select: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary/40 transition-all appearance-none cursor-pointer",
    resetBtn: "flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition-all cursor-pointer",
    dateContainer: "relative flex items-center w-full",
    dateIcon: "absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base",
    dateInput: "w-full bg-slate-950 border border-slate-800 rounded-xl pr-4 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary/40 transition-all [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden",
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl space-y-4">
      {/* Fila Superior: 3 Filtros principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Buscador General */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Buscador General</label>
          <input
            type="text"
            placeholder="Buscar por IMEI, modelo..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            className={styles.input}
            suppressHydrationWarning
          />
        </div>

        {/* 2. Vendedor (Deshabilitado en pestaña de stock a concesión) */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Vendedor</label>
          <select
            value={isStockTab ? "" : selectedVendedor}
            onChange={(event) => {
              setSelectedVendedor(event.target.value);
              setCurrentPage(1);
            }}
            disabled={isStockTab}
            className={`${styles.select} ${
              isStockTab ? "opacity-40 cursor-not-allowed bg-slate-950/60" : ""
            }`}
            title={isStockTab ? "No aplicable para equipos aún no vendidos en stock" : "Filtrar por vendedor"}
            suppressHydrationWarning
          >
            <option value="">Todos</option>
            {!isStockTab &&
              vendedores.map((vendedorOption) => (
                <option key={vendedorOption.id} value={vendedorOption.id}>
                  {vendedorOption.username}
                </option>
              ))}
          </select>
        </div>

        {/* 3. Repartidor / Ubicación (Deshabilitado en pestañas de equipos vendidos) */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Repartidor / Ubicación</label>
          <select
            value={isStockTab ? selectedUbicacion : ""}
            onChange={(event) => {
              setSelectedUbicacion(event.target.value);
              setCurrentPage(1);
            }}
            disabled={!isStockTab}
            className={`${styles.select} ${
              !isStockTab ? "opacity-40 cursor-not-allowed bg-slate-950/60" : ""
            }`}
            title={!isStockTab ? "No aplicable para equipos ya vendidos" : "Filtrar por repartidor o ubicación"}
            suppressHydrationWarning
          >
            <option value="">Todos</option>
            {isStockTab &&
              repartidores.map((repartidorOption) => (
                <option key={repartidorOption.id} value={repartidorOption.id}>
                  {repartidorOption.nombre}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Fila Inferior: Filtros de fecha y botones de acción */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Desde */}
        <div className={`col-span-1 md:col-span-4 ${styles.filterGroup}`}>
          <label className={styles.label}>Desde</label>
          <div className={styles.dateContainer}>
            <span className={styles.dateIcon}>calendar_today</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => {
                setFechaDesde(event.target.value);
                setCurrentPage(1);
              }}
              onClick={handleOpenPicker}
              className={styles.dateInput}
              style={{ paddingLeft: "48px" }}
              suppressHydrationWarning
            />
            {!fechaDesde && isIOS && (
              <span
                className="absolute text-slate-500 text-base md:text-sm pointer-events-none select-none"
                style={{ left: "48px" }}
              >
                dd/mm/aaaa
              </span>
            )}
          </div>
        </div>

        {/* Hasta */}
        <div className={`col-span-1 md:col-span-4 ${styles.filterGroup}`}>
          <label className={styles.label}>Hasta</label>
          <div className={styles.dateContainer}>
            <span className={styles.dateIcon}>calendar_today</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(event) => {
                setFechaHasta(event.target.value);
                setCurrentPage(1);
              }}
              onClick={handleOpenPicker}
              className={styles.dateInput}
              style={{ paddingLeft: "48px" }}
              suppressHydrationWarning
            />
            {!fechaHasta && isIOS && (
              <span
                className="absolute text-slate-500 text-base md:text-sm pointer-events-none select-none"
                style={{ left: "48px" }}
              >
                dd/mm/aaaa
              </span>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="col-span-1 md:col-span-4 h-[42px] flex items-center justify-end gap-3">
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={`${styles.resetBtn} flex-initial h-full flex items-center justify-center gap-2 transition-all duration-300 ${
              hasActiveFilters ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"
            }`}
            title="Limpiar filtros"
          >
            <span className="material-symbols-outlined text-base">filter_alt_off</span>
            <span className="hidden sm:inline">Limpiar Filtros</span>
          </button>

          <button
            onClick={onExportExcel}
            disabled={!hasDataToExport}
            className={`flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl transition-all h-full ${
              !hasDataToExport
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-slate-700 hover:text-white cursor-pointer"
            }`}
            title="Descargar lista filtrada en Excel"
          >
            <span className="material-symbols-outlined text-base md:text-xl shrink-0">download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

