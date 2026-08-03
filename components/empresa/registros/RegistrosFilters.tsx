'use client';

import React from 'react';
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";
import type { PerfilOption, RepartidorOption, RegistrosTab } from "@/types/registros";

interface RegistrosFiltersProps {
  activeTab: RegistrosTab;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedVendedor: string;
  setSelectedVendedor: (vendedorId: string) => void;
  selectedRepartidor: string;
  setSelectedRepartidor: (repartidorId: string) => void;
  fechaDesde: string;
  setFechaDesde: (fecha: string) => void;
  fechaHasta: string;
  setFechaHasta: (fecha: string) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  vendedores: PerfilOption[];
  repartidores: RepartidorOption[];
  isIOS: boolean;
  handleOpenPicker: (event: React.MouseEvent<HTMLInputElement>) => void;
  activeData: any[];
}

export function RegistrosFilters({
  activeTab,
  searchQuery,
  setSearchQuery,
  selectedVendedor,
  setSelectedVendedor,
  selectedRepartidor,
  setSelectedRepartidor,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  setCurrentPage,
  resetFilters,
  hasActiveFilters,
  vendedores,
  repartidores,
  isIOS,
  handleOpenPicker,
  activeData
}: RegistrosFiltersProps) {
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
        {/* 1. Buscador */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Buscador General</label>
          <input
            type="text"
            placeholder={
              activeTab === "ventas" 
                ? "Buscar por IMEI, modelo..." 
                : activeTab === "ordenes" 
                  ? "Buscar folio, cliente, IMEI..." 
                  : activeTab === "garantias"
                    ? "Buscar IMEI, modelo, solicitante, motivo..."
                    : "Buscar folio, cliente, IMEI, fallas..."
            }
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className={styles.input}
            suppressHydrationWarning
          />
        </div>

        {/* 2. Vendedor */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Vendedor</label>
          <select
            value={selectedVendedor}
            onChange={(e) => { setSelectedVendedor(e.target.value); setCurrentPage(1); }}
            className={styles.select}
            suppressHydrationWarning
          >
            <option value="">Todos</option>
            {vendedores.map(vendedorOption => (
              <option key={vendedorOption.id} value={vendedorOption.id}>{vendedorOption.username}</option>
            ))}
          </select>
        </div>

        {/* 3. Repartidor */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Repartidor / Ubicación</label>
          <select
            value={selectedRepartidor}
            onChange={(e) => { setSelectedRepartidor(e.target.value); setCurrentPage(1); }}
            className={styles.select}
            suppressHydrationWarning
          >
            <option value="">Todos</option>
            {repartidores.map(repartidorOption => (
              <option key={repartidorOption.id} value={repartidorOption.id}>{repartidorOption.nombre}</option>
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
              onChange={(e) => { setFechaDesde(e.target.value); setCurrentPage(1); }}
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
              onChange={(e) => { setFechaHasta(e.target.value); setCurrentPage(1); }}
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
            className={`${styles.resetBtn} flex-initial h-full flex items-center justify-center gap-2 transition-all duration-300 ${hasActiveFilters
              ? "opacity-100 cursor-pointer"
              : "opacity-0 pointer-events-none"
              }`}
            title="Limpiar filtros"
          >
            <span className="material-symbols-outlined text-base">filter_alt_off</span>
            <span>Limpiar Filtros</span>
          </button>
          <DownloadExcelButton
            data={activeData}
            type={
              activeTab === "ventas" 
                ? "ventas" 
                : activeTab === "garantias" 
                  ? "garantias" 
                  : activeTab === "ordenes" 
                    ? "ordenes_entrega" 
                    : "ordenes_garantia"
            }
          />
        </div>
      </div>
    </div>
  );
}
