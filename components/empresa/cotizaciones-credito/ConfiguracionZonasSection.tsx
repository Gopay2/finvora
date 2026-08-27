'use client';

import React from "react";
import { PorcentajesPopoverSelector } from "./PorcentajesPopoverSelector";
import type { ConfigEngancheItem } from "@/types/ordenes-entrega";

interface ConfiguracionZonasSectionProps {
  zonasDisponibles: string[];
  zoneConfigs: ConfigEngancheItem[];
  editingZoneConfigId: string | null;
  selectedNewZona: string;
  selectedNewZonaCliente: 'Si' | 'No';
  selectedNewZonaPercentages: number[];
  newZoneEngancheLibre: boolean;
  isZonePercentDropdownOpen: boolean;
  zoneFormRef: React.RefObject<HTMLDivElement | null>;
  zoneDropdownRef: React.RefObject<HTMLDivElement | null>;
  isPending: boolean;

  onChangeSelectedZona: (zona: string) => void;
  onChangeZonaCliente: (cliente: 'Si' | 'No') => void;
  onToggleZoneEngancheLibre: () => void;
  onTogglePercentDropdown: () => void;
  onToggleZonePercentage: (percentage: number) => void;
  onSelectAllPercentages: () => void;
  onClearPercentages: () => void;
  onSaveZoneConfig: () => void;
  onCancelEditZone: () => void;
  onEditZoneConfig: (config: ConfigEngancheItem) => void;
  onDeleteZoneConfig: (id?: string, zona?: string | null) => void;
  onToggleZoneRowEnganche: (config: ConfigEngancheItem) => void;
}

const styles = {
  select: "w-full h-[42px] bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed custom-scrollbar",
  selectChevron: "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400",
  badgeBase: "inline-flex items-center justify-center w-28 py-1 rounded-full text-xs font-bold border",
  badgeSi: "bg-teal-500/10 text-secondary border-teal-500/20",
  badgeNo: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  chipBase: "inline-flex items-center justify-center w-11 h-7 rounded-lg bg-slate-950 border font-bold text-xs shadow-sm shrink-0",
  chipSi: "border-secondary/30 text-secondary",
  chipNo: "border-amber-500/30 text-amber-300",
  switchTrackSmall: "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
  switchThumbSmall: "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out",
};

/**
 * Sección 2: Configuración de Enganches por Zona
 */
export function ConfiguracionZonasSection({
  zonasDisponibles,
  zoneConfigs,
  editingZoneConfigId,
  selectedNewZona,
  selectedNewZonaCliente,
  selectedNewZonaPercentages,
  newZoneEngancheLibre,
  isZonePercentDropdownOpen,
  zoneFormRef,
  zoneDropdownRef,
  isPending,

  onChangeSelectedZona,
  onChangeZonaCliente,
  onToggleZoneEngancheLibre,
  onTogglePercentDropdown,
  onToggleZonePercentage,
  onSelectAllPercentages,
  onClearPercentages,
  onSaveZoneConfig,
  onCancelEditZone,
  onEditZoneConfig,
  onDeleteZoneConfig,
  onToggleZoneRowEnganche,
}: ConfiguracionZonasSectionProps) {
  return (
    <section className="space-y-6 pt-4 border-t border-slate-800/80">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Configuración por Zonas
        </h2>
        <p className="text-xs text-slate-400">
          Si una zona tiene una regla, sobrescribe a la configuración general.
        </p>
      </div>

      {/* Formulario / Barra de Inserción / Edición */}
      <div
        ref={zoneFormRef}
        className={`bg-slate-900/50 backdrop-blur-xl border p-5 md:p-6 rounded-3xl shadow-xl space-y-4 transition-all relative z-30 ${
          editingZoneConfigId
            ? "border-secondary/50 shadow-secondary/10"
            : "border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-secondary">
              {editingZoneConfigId ? "edit_note" : "add_circle"}
            </span>
            {editingZoneConfigId
              ? `Editar Regla: ${selectedNewZona} (${selectedNewZonaCliente === "Si" ? "Con Historial" : "Sin Historial"})`
              : "Nueva Excepción por Zona"}
          </h3>

          {editingZoneConfigId && (
            <button
              type="button"
              onClick={onCancelEditZone}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {/* 1. Selector de Zona */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Zona</label>
            <div className="relative">
              <select
                value={selectedNewZona}
                onChange={(event) => onChangeSelectedZona(event.target.value)}
                disabled={Boolean(editingZoneConfigId)}
                className={styles.select}
                style={{ colorScheme: "dark" }}
                suppressHydrationWarning
              >
                {zonasDisponibles.length === 0 ? (
                  <option value="">No hay zonas disponibles</option>
                ) : (
                  zonasDisponibles.map((zona) => (
                    <option key={zona} value={zona} className="bg-slate-950 text-white">
                      {zona}
                    </option>
                  ))
                )}
              </select>
              <div className={styles.selectChevron}>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </div>
            </div>
          </div>

          {/* 2. Selector de Cliente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Tipo de Cliente</label>
            <div className="relative">
              <select
                value={selectedNewZonaCliente}
                onChange={(event) => onChangeZonaCliente(event.target.value as 'Si' | 'No')}
                disabled={Boolean(editingZoneConfigId)}
                className={styles.select}
                style={{ colorScheme: "dark" }}
                suppressHydrationWarning
              >
                <option value="Si" className="bg-slate-950 text-white">Con Historial</option>
                <option value="No" className="bg-slate-950 text-white">Sin Historial</option>
              </select>
              <div className={styles.selectChevron}>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </div>
            </div>
          </div>

          {/* 3. Selector de Porcentajes (1 al 25 con resaltado) */}
          <PorcentajesPopoverSelector
            selectedPercentages={selectedNewZonaPercentages}
            onTogglePercentage={onToggleZonePercentage}
            onSelectAll={onSelectAllPercentages}
            onClear={onClearPercentages}
            isOpen={isZonePercentDropdownOpen}
            onToggleOpen={onTogglePercentDropdown}
            dropdownRef={zoneDropdownRef}
            accentColor={selectedNewZonaCliente === "Si" ? "secondary" : "amber"}
          />

          {/* 4. Toggle Enganche Libre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Enganche Libre</label>
            <div className="w-full h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">
                {newZoneEngancheLibre ? "Permitido" : "Bloqueado"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={newZoneEngancheLibre}
                onClick={onToggleZoneEngancheLibre}
                className={`${styles.switchTrackSmall} ${
                  newZoneEngancheLibre ? "bg-secondary" : "bg-slate-800"
                }`}
              >
                <span
                  className={`${styles.switchThumbSmall} ${
                    newZoneEngancheLibre ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. Botón Enganche de Zona / Guardar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold invisible select-none block">&nbsp;</label>
            <button
              type="button"
              onClick={onSaveZoneConfig}
              disabled={!selectedNewZona || isPending}
              className="w-full h-[42px] px-4 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 rounded-xl text-sm font-semibold transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-center"
            >
              {editingZoneConfigId ? "Guardar Cambios" : "Agregar Zona"}
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE EXCEPCIONES POR ZONA */}
      {zoneConfigs.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800/80 rounded-3xl space-y-2">
          <span className="material-symbols-outlined text-3xl text-slate-600">location_off</span>
          <p className="text-sm text-slate-400 font-medium">
            No hay excepciones configuradas por zona.
          </p>
          <p className="text-xs text-slate-500">
            Todas las zonas respetan actualmente los valores de la <strong>Configuración General</strong>.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 pl-12 pr-6 text-left">Zona</th>
                  <th className="px-6 py-4 text-center">Tipo de Cliente</th>
                  <th className="px-6 py-4 text-center">Enganche Libre</th>
                  <th className="px-6 py-4 text-center">Porcentajes Disponibles</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {zoneConfigs.map((zoneConfig) => {
                  const isSi = zoneConfig.cliente_historial.toLowerCase() === "si";

                  return (
                    <tr
                      key={zoneConfig.id || `${zoneConfig.zona}-${zoneConfig.cliente_historial}`}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      {/* 1. Zona */}
                      <td className="px-6 py-4 font-bold text-slate-100 whitespace-nowrap text-left">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary">location_on</span>
                          <span>{zoneConfig.zona}</span>
                        </div>
                      </td>

                      {/* 2. Tipo de Cliente */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <span
                            className={`${styles.badgeBase} ${
                              isSi ? styles.badgeSi : styles.badgeNo
                            }`}
                          >
                            {isSi ? "Con Historial" : "Sin Historial"}
                          </span>
                        </div>
                      </td>

                      {/* 3. Enganche Libre */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={zoneConfig.permitir_enganche_libre}
                            onClick={() => onToggleZoneRowEnganche(zoneConfig)}
                            disabled={isPending}
                            className={`${styles.switchTrackSmall} ${
                              zoneConfig.permitir_enganche_libre
                                ? isSi
                                  ? "bg-secondary"
                                  : "bg-amber-400"
                                : "bg-slate-800"
                            }`}
                          >
                            <span
                              className={`${styles.switchThumbSmall} ${
                                zoneConfig.permitir_enganche_libre ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-xs text-slate-300 font-medium">
                            {zoneConfig.permitir_enganche_libre ? "Permitido" : "Bloqueado"}
                          </span>
                        </div>
                      </td>

                      {/* 4. Porcentajes Disponibles (Máximo 3 chips uniformes y '...') */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5 min-w-[170px]">
                          {zoneConfig.porcentajes.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">Sin porcentajes</span>
                          ) : (
                            <>
                              {zoneConfig.porcentajes.slice(0, 3).map((porcentaje) => (
                                <span
                                  key={porcentaje}
                                  className={`${styles.chipBase} ${
                                    isSi ? styles.chipSi : styles.chipNo
                                  }`}
                                >
                                  {porcentaje}%
                                </span>
                              ))}
                              {zoneConfig.porcentajes.length > 3 && (
                                <span
                                  className="inline-flex items-center justify-center px-1.5 py-1 text-slate-400 font-bold text-xs select-none tracking-widest"
                                  title={`${zoneConfig.porcentajes.map((porcentaje) => `${porcentaje}%`).join(", ")}`}
                                >
                                  ...
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* 5. Acciones (Editar y Eliminar) */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditZoneConfig(zoneConfig)}
                            disabled={isPending}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              isSi
                                ? "text-slate-400 hover:text-secondary hover:bg-secondary/10"
                                : "text-slate-400 hover:text-amber-300 hover:bg-amber-500/10"
                            }`}
                            title="Editar porcentajes y configuración"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteZoneConfig(zoneConfig.id, zoneConfig.zona)}
                            disabled={isPending}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                            title="Eliminar excepción (volver a General)"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
