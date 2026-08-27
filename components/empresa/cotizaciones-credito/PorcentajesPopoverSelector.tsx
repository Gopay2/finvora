'use client';

import React from "react";

export const ALL_PERCENTAGES = Array.from({ length: 25 }, (_, index) => index + 1);

interface PorcentajesPopoverSelectorProps {
  selectedPercentages: number[];
  onTogglePercentage: (percentage: number) => void;
  onSelectAll: () => void;
  onClear: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  accentColor?: "secondary" | "amber";
}

/**
 * Selector desplegable de porcentajes (1% al 25%) con popover y chips seleccionables.
 */
export function PorcentajesPopoverSelector({
  selectedPercentages,
  onTogglePercentage,
  onSelectAll,
  onClear,
  isOpen,
  onToggleOpen,
  dropdownRef,
  accentColor = "secondary",
}: PorcentajesPopoverSelectorProps) {
  const isAmber = accentColor === "amber";

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="text-xs font-semibold text-slate-300 block">
        Porcentajes ({selectedPercentages.length})
      </label>

      <div className="relative z-40">
        <button
          type="button"
          onClick={onToggleOpen}
          className="w-full h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 text-sm text-left text-slate-100 focus:outline-none focus:border-secondary transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap max-w-[190px]">
            {selectedPercentages.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Elegir porcentajes...</span>
            ) : (
              <>
                {selectedPercentages.slice(0, 3).map((porcentaje) => (
                  <span
                    key={porcentaje}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[11px] leading-none shrink-0 border ${
                      isAmber
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                        : "bg-secondary/15 border-secondary/30 text-secondary"
                    }`}
                  >
                    {porcentaje}%
                  </span>
                ))}
                {selectedPercentages.length > 3 && (
                  <span className="text-xs text-slate-400 font-bold shrink-0">
                    +{selectedPercentages.length - 3}
                  </span>
                )}
              </>
            )}
          </div>
          <span className="material-symbols-outlined text-base text-slate-400 shrink-0 ml-1">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </button>

        {/* Popover interactivo con botones del 1% al 25% */}
        {isOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-72 sm:w-80 p-3.5 bg-slate-950/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-300">Selecciona del 1% al 25%</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                    isAmber ? "text-amber-300" : "text-secondary"
                  }`}
                >
                  Todos
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={onClear}
                  className="text-[11px] font-semibold text-slate-400 hover:text-red-400 cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
              {ALL_PERCENTAGES.map((porcentaje) => {
                const isSelected = selectedPercentages.includes(porcentaje);
                return (
                  <button
                    key={porcentaje}
                    type="button"
                    onClick={() => onTogglePercentage(porcentaje)}
                    className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center justify-center ${
                      isSelected
                        ? isAmber
                          ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm shadow-amber-400/25"
                          : "bg-secondary text-slate-950 font-extrabold shadow-sm shadow-secondary/25"
                        : "bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800/80"
                    }`}
                  >
                    {porcentaje}%
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
