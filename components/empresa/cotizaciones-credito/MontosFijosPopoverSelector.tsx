'use client';

import React, { useState } from "react";

import { formatShortMoney } from "@/utils/formatters";

export const PRESET_MONTOS_FIJOS = [
  100, 200, 300, 400, 500,
  600, 700, 800, 900, 1000,
  1100, 1200, 1300, 1400, 1500
];

/**
 * Propiedades del componente selector desplegable de montos fijos.
 */
interface MontosFijosPopoverSelectorProps {
  /** Lista de valores numéricos de enganche seleccionados */
  selectedMontos: number[];
  /** Alterna la selección de un monto de los botones preset */
  onToggleMonto: (monto: number) => void;
  /** Agrega un monto numérico ingresado manualmente */
  onAddCustomMonto: (monto: number) => void;
  /** Remueve un monto numérico de la selección */
  onRemoveMonto: (monto: number) => void;
  /** Limpia todos los montos seleccionados */
  onClear: () => void;
  /** Estado de visibilidad del popover flotante */
  isOpen: boolean;
  /** Alterna la apertura o cierre del popover */
  onToggleOpen: () => void;
  /** Referencia del elemento contenedor para control de click fuera */
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  /** Paleta de acento visual según el tipo de cliente ("secondary" para historial, "amber" para sin historial) */
  accentColor?: "secondary" | "amber";
  /** Deshabilita la interacción con el selector durante cargas o mutaciones */
  disabled?: boolean;
}

const styles = {
  triggerButton: "w-full h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 text-sm text-left text-slate-100 focus:outline-none focus:border-secondary transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  popoverCard: "absolute top-[calc(100%+8px)] left-0 z-50 w-80 sm:w-96 p-3.5 bg-slate-950/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-3 animate-in fade-in zoom-in-95 duration-150",
  previewBadge: (isAmber: boolean) =>
    `inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[11px] leading-none shrink-0 border ${
      isAmber
        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
        : "bg-secondary/15 border-secondary/30 text-secondary"
    }`,
  gridMontoButton: (isSelected: boolean, isAmber: boolean) => {
    const baseClasses = "h-8 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center justify-center";
    if (!isSelected) {
      return `${baseClasses} bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800/80`;
    }
    return isAmber
      ? `${baseClasses} bg-amber-400 text-slate-950 font-extrabold shadow-sm shadow-amber-400/25`
      : `${baseClasses} bg-secondary text-slate-950 font-extrabold shadow-sm shadow-secondary/25`;
  },
  otherButton: (isActive: boolean) =>
    `h-8 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center justify-center border ${
      isActive
        ? "bg-slate-800 text-secondary border-secondary/50 font-extrabold"
        : "bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border-slate-800/80"
    }`,
  customInput: "w-full h-9 sm:h-8 bg-slate-900 border border-slate-700/80 rounded-lg pl-6 pr-2 text-[16px] sm:text-xs text-slate-100 focus:outline-none focus:border-secondary transition-all",
  addCustomButton: "h-9 sm:h-8 px-3.5 sm:px-3 bg-secondary text-slate-950 rounded-lg text-xs font-bold hover:bg-secondary/90 transition-all disabled:opacity-40 cursor-pointer shrink-0",
};

/**
 * Selector desplegable de montos fijos (100 a 1500 y Otro personalizable) con popover interactivo.
 */
export function MontosFijosPopoverSelector({
  selectedMontos,
  onToggleMonto,
  onAddCustomMonto,
  onRemoveMonto,
  onClear,
  isOpen,
  onToggleOpen,
  dropdownRef,
  accentColor = "secondary",
  disabled = false,
}: MontosFijosPopoverSelectorProps) {
  const isAmber = accentColor === "amber";
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Identificar montos que son fuera de los 15 presets
  const customSelected = selectedMontos.filter((monto) => !PRESET_MONTOS_FIJOS.includes(monto));

  const handleAddCustom = () => {
    const parsedCustomMonto = Number(customInput.trim());
    if (!isNaN(parsedCustomMonto) && parsedCustomMonto > 0) {
      onAddCustomMonto(parsedCustomMonto);
      setCustomInput("");
    }
  };

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="text-xs font-semibold text-slate-300 block">
        Monto Enganche ({selectedMontos.length})
      </label>

      <div className="relative z-40">
        <button
          type="button"
          onClick={onToggleOpen}
          disabled={disabled}
          className={styles.triggerButton}
        >
          <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap max-w-[200px] sm:max-w-[220px]">
            {selectedMontos.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Elegir montos...</span>
            ) : (
              <>
                {selectedMontos.slice(0, 3).map((monto) => (
                  <span
                    key={monto}
                    className={styles.previewBadge(isAmber)}
                  >
                    {formatShortMoney(monto)}
                  </span>
                ))}
                {selectedMontos.length > 3 && (
                  <span className="text-xs text-slate-400 font-bold shrink-0">
                    +{selectedMontos.length - 3}
                  </span>
                )}
              </>
            )}
          </div>
          <span className="material-symbols-outlined text-base text-slate-400 shrink-0 ml-1">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </button>

        {/* Popover interactivo con botones del 100 al 1500 y Otro */}
        {isOpen && (
          <div className={styles.popoverCard}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-300">Selecciona montos fijos</span>
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] font-semibold text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
              >
                Limpiar
              </button>
            </div>

            {/* Grid 4 columnas: 15 montos fijos + botón 'Otro' */}
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_MONTOS_FIJOS.map((monto) => {
                const isSelected = selectedMontos.includes(monto);
                return (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => onToggleMonto(monto)}
                    className={styles.gridMontoButton(isSelected, isAmber)}
                  >
                    {formatShortMoney(monto)}
                  </button>
                );
              })}

              {/* Botón 'Otro' */}
              <button
                type="button"
                onClick={() => setShowCustomInput((previousShow) => !previousShow)}
                className={styles.otherButton(showCustomInput || customSelected.length > 0)}
                title="Personalizar otro valor"
              >
                Otro...
              </button>
            </div>

            {/* Sección para ingresar 'Otro' monto personalizado */}
            {showCustomInput && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Otro monto personalizado:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm sm:text-xs pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="1"
                      step="any"
                      placeholder="Ej. 750"
                      value={customInput}
                      onChange={(event) => setCustomInput(event.target.value)}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key === "Enter") {
                          keyboardEvent.preventDefault();
                          handleAddCustom();
                        }
                      }}
                      className={styles.customInput}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    disabled={!customInput || Number(customInput) <= 0}
                    className={styles.addCustomButton}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {/* Listado de montos personalizados agregados */}
            {customSelected.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 block">Personalizados añadidos:</span>
                  <button
                    type="button"
                    onClick={() => customSelected.forEach((monto) => onRemoveMonto(monto))}
                    className="text-[10px] font-semibold text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Quitar todos
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                  {customSelected.map((monto) => (
                    <span
                      key={monto}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-secondary/15 border border-secondary/30 text-secondary"
                    >
                      {formatShortMoney(monto)}
                      <button
                        type="button"
                        onClick={() => onRemoveMonto(monto)}
                        title={`Eliminar ${formatShortMoney(monto)}`}
                        className="hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
