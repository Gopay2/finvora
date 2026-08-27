'use client';

import React from "react";
import { PorcentajesPopoverSelector } from "./PorcentajesPopoverSelector";
import type { ConfigEngancheItem, VendedorDisponible } from "@/types/ordenes-entrega";

interface ConfiguracionVendedoresSectionProps {
  vendedoresDisponibles: VendedorDisponible[];
  vendedorConfigs: ConfigEngancheItem[];
  editingVendedorConfigId: string | null;
  selectedNewVendedorId: string;
  selectedNewVendedorCliente: 'Si' | 'No';
  selectedNewVendedorPercentages: number[];
  newVendedorEngancheLibre: boolean;
  isVendedorPercentDropdownOpen: boolean;
  vendedorFormRef: React.RefObject<HTMLDivElement | null>;
  vendedorDropdownRef: React.RefObject<HTMLDivElement | null>;
  isPending: boolean;

  onChangeSelectedVendedorId: (id: string) => void;
  onChangeVendedorCliente: (cliente: 'Si' | 'No') => void;
  onToggleVendedorEngancheLibre: () => void;
  onTogglePercentDropdown: () => void;
  onToggleVendedorPercentage: (percentage: number) => void;
  onSelectAllPercentages: () => void;
  onClearPercentages: () => void;
  onSaveVendedorConfig: () => void;
  onCancelEditVendedor: () => void;
  onEditVendedorConfig: (config: ConfigEngancheItem) => void;
  onDeleteVendedorConfig: (id?: string, nombre?: string | null) => void;
  onToggleVendedorRowEnganche: (config: ConfigEngancheItem) => void;
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
 * Sección 3: Configuración de Enganches por Vendedor (Máxima Prioridad)
 */
export function ConfiguracionVendedoresSection({
  vendedoresDisponibles,
  vendedorConfigs,
  editingVendedorConfigId,
  selectedNewVendedorId,
  selectedNewVendedorCliente,
  selectedNewVendedorPercentages,
  newVendedorEngancheLibre,
  isVendedorPercentDropdownOpen,
  vendedorFormRef,
  vendedorDropdownRef,
  isPending,

  onChangeSelectedVendedorId,
  onChangeVendedorCliente,
  onToggleVendedorEngancheLibre,
  onTogglePercentDropdown,
  onToggleVendedorPercentage,
  onSelectAllPercentages,
  onClearPercentages,
  onSaveVendedorConfig,
  onCancelEditVendedor,
  onEditVendedorConfig,
  onDeleteVendedorConfig,
  onToggleVendedorRowEnganche,
}: ConfiguracionVendedoresSectionProps) {
  const currentEditingVendedorNombre = vendedoresDisponibles.find((v) => v.id === selectedNewVendedorId)?.nombre || "Vendedor";

  return (
    <section className="space-y-6 pt-4 border-t border-slate-800/80">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Configuración por Vendedor
        </h2>
        <p className="text-xs text-slate-400">
          Si un vendedor tiene una regla, sobrescribe a la configuración por zona y general.
        </p>
      </div>

      {/* Formulario / Barra de Inserción / Edición */}
      <div
        ref={vendedorFormRef}
        className={`bg-slate-900/50 backdrop-blur-xl border p-5 md:p-6 rounded-3xl shadow-xl space-y-4 transition-all relative z-20 ${
          editingVendedorConfigId
            ? "border-secondary/50 shadow-secondary/10"
            : "border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-secondary">
              {editingVendedorConfigId ? "edit_note" : "person_add"}
            </span>
            {editingVendedorConfigId
              ? `Editar Regla: ${currentEditingVendedorNombre} (${selectedNewVendedorCliente === "Si" ? "Con Historial" : "Sin Historial"})`
              : "Nueva Excepción por Vendedor"}
          </h3>

          {editingVendedorConfigId && (
            <button
              type="button"
              onClick={onCancelEditVendedor}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {/* 1. Selector de Vendedor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Vendedor</label>
            <div className="relative">
              <select
                value={selectedNewVendedorId}
                onChange={(event) => onChangeSelectedVendedorId(event.target.value)}
                disabled={Boolean(editingVendedorConfigId)}
                className={styles.select}
                style={{ colorScheme: "dark" }}
                suppressHydrationWarning
              >
                {vendedoresDisponibles.length === 0 ? (
                  <option value="">No hay vendedores disponibles</option>
                ) : (
                  vendedoresDisponibles.map((vendedor) => (
                    <option key={vendedor.id} value={vendedor.id} className="bg-slate-950 text-white">
                      {vendedor.nombre} {vendedor.role ? `(${vendedor.role})` : ""}
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
                value={selectedNewVendedorCliente}
                onChange={(event) => onChangeVendedorCliente(event.target.value as 'Si' | 'No')}
                disabled={Boolean(editingVendedorConfigId)}
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
            selectedPercentages={selectedNewVendedorPercentages}
            onTogglePercentage={onToggleVendedorPercentage}
            onSelectAll={onSelectAllPercentages}
            onClear={onClearPercentages}
            isOpen={isVendedorPercentDropdownOpen}
            onToggleOpen={onTogglePercentDropdown}
            dropdownRef={vendedorDropdownRef}
            accentColor={selectedNewVendedorCliente === "Si" ? "secondary" : "amber"}
          />

          {/* 4. Toggle Enganche Libre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Enganche Libre</label>
            <div className="w-full h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">
                {newVendedorEngancheLibre ? "Permitido" : "Bloqueado"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={newVendedorEngancheLibre}
                onClick={onToggleVendedorEngancheLibre}
                className={`${styles.switchTrackSmall} ${
                  newVendedorEngancheLibre ? "bg-secondary" : "bg-slate-800"
                }`}
              >
                <span
                  className={`${styles.switchThumbSmall} ${
                    newVendedorEngancheLibre ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. Botón Enganche de Vendedor / Guardar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold invisible select-none block">&nbsp;</label>
            <button
              type="button"
              onClick={onSaveVendedorConfig}
              disabled={!selectedNewVendedorId || isPending}
              className="w-full h-[42px] px-4 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 rounded-xl text-sm font-semibold transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-center"
            >
              {editingVendedorConfigId ? "Guardar Cambios" : "Agregar Vendedor"}
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE EXCEPCIONES POR VENDEDOR */}
      {vendedorConfigs.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800/80 rounded-3xl space-y-2">
          <span className="material-symbols-outlined text-3xl text-slate-600">person_off</span>
          <p className="text-sm text-slate-400 font-medium">
            No hay excepciones configuradas por vendedor.
          </p>
          <p className="text-xs text-slate-500">
            Todos los vendedores respetan actualmente la configuración de su <strong>Zona</strong> o la <strong>Configuración General</strong>.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 pl-12 pr-6 text-left">Vendedor</th>
                  <th className="px-6 py-4 text-center">Tipo de Cliente</th>
                  <th className="px-6 py-4 text-center">Enganche Libre</th>
                  <th className="px-6 py-4 text-center">Porcentajes Disponibles</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {vendedorConfigs.map((vendedorConfig) => {
                  const isSi = vendedorConfig.cliente_historial.toLowerCase() === "si";

                  return (
                    <tr
                      key={vendedorConfig.id || `${vendedorConfig.vendedor_id}-${vendedorConfig.cliente_historial}`}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      {/* 1. Vendedor */}
                      <td className="px-6 py-4 font-bold text-slate-100 whitespace-nowrap text-left">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary">person</span>
                          <span>{vendedorConfig.vendedor_nombre || "Vendedor"}</span>
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
                            aria-checked={vendedorConfig.permitir_enganche_libre}
                            onClick={() => onToggleVendedorRowEnganche(vendedorConfig)}
                            disabled={isPending}
                            className={`${styles.switchTrackSmall} ${
                              vendedorConfig.permitir_enganche_libre
                                ? isSi
                                  ? "bg-secondary"
                                  : "bg-amber-400"
                                : "bg-slate-800"
                            }`}
                          >
                            <span
                              className={`${styles.switchThumbSmall} ${
                                vendedorConfig.permitir_enganche_libre ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-xs text-slate-300 font-medium">
                            {vendedorConfig.permitir_enganche_libre ? "Permitido" : "Bloqueado"}
                          </span>
                        </div>
                      </td>

                      {/* 4. Porcentajes Disponibles (Máximo 3 chips uniformes y '...') */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5 min-w-[170px]">
                          {vendedorConfig.porcentajes.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">Sin porcentajes</span>
                          ) : (
                            <>
                              {vendedorConfig.porcentajes.slice(0, 3).map((porcentaje) => (
                                <span
                                  key={porcentaje}
                                  className={`${styles.chipBase} ${
                                    isSi ? styles.chipSi : styles.chipNo
                                  }`}
                                >
                                  {porcentaje}%
                                </span>
                              ))}
                              {vendedorConfig.porcentajes.length > 3 && (
                                <span
                                  className="inline-flex items-center justify-center px-1.5 py-1 text-slate-400 font-bold text-xs select-none tracking-widest"
                                  title={`${vendedorConfig.porcentajes.map((porcentaje) => `${porcentaje}%`).join(", ")}`}
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
                            onClick={() => onEditVendedorConfig(vendedorConfig)}
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
                            onClick={() => onDeleteVendedorConfig(vendedorConfig.id, vendedorConfig.vendedor_nombre)}
                            disabled={isPending}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                            title="Eliminar excepción (volver a Zona/General)"
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
