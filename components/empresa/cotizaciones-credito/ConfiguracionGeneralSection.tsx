'use client';

import React from "react";

interface ConfiguracionGeneralSectionProps {
  siMontosFijos: number[];
  siEngancheLibre: boolean;
  newSiMonto: string;
  onChangeNewSiMonto: (value: string) => void;
  onAddSiMonto: () => void;
  onRemoveSiMonto: () => void;
  onToggleSiEngancheLibre: () => void;

  noMontosFijos: number[];
  noEngancheLibre: boolean;
  newNoMonto: string;
  onChangeNewNoMonto: (value: string) => void;
  onAddNoMonto: () => void;
  onRemoveNoMonto: () => void;
  onToggleNoEngancheLibre: () => void;

  isPending: boolean;
}

const styles = {
  sectionTitle: "text-xl font-bold text-slate-100 tracking-tight",
  sectionDesc: "text-xs text-slate-400",
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  card: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden flex flex-col justify-between",
  badgeContainer: "flex items-center justify-between border-b border-slate-800/80 pb-4",
  badge: "px-3 py-1 rounded-full text-xs font-bold border",
  badgeSi: "bg-teal-500/10 text-secondary border-teal-500/20",
  badgeNo: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  switchContainer: "flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl",
  switchLabel: "text-xs font-semibold text-slate-300",
  switchDesc: "text-[11px] text-slate-500",
  switchTrack: "relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none self-center disabled:opacity-50",
  switchThumb: "pointer-events-none block h-5 w-5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out",
  chipsBox: "flex flex-wrap gap-2 min-h-[5rem] h-auto p-3.5 bg-slate-950/50 border border-slate-800/70 rounded-2xl items-start content-start overflow-y-auto custom-scrollbar",
  input: "w-full sm:w-32 bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-base sm:text-sm text-slate-100 focus:outline-none transition-all",
};

/**
 * Sección 1: Configuración General de Enganches (Montos Fijos en $ para Con Historial y Sin Historial)
 */
export function ConfiguracionGeneralSection({
  siMontosFijos,
  siEngancheLibre,
  newSiMonto,
  onChangeNewSiMonto,
  onAddSiMonto,
  onRemoveSiMonto,
  onToggleSiEngancheLibre,

  noMontosFijos,
  noEngancheLibre,
  newNoMonto,
  onChangeNewNoMonto,
  onAddNoMonto,
  onRemoveNoMonto,
  onToggleNoEngancheLibre,

  isPending,
}: ConfiguracionGeneralSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className={styles.sectionTitle}>
          Configuración General
        </h2>
        <p className={styles.sectionDesc}>
          Montos fijos de enganche por defecto para todos los equipos cuando no existan excepciones específicas por equipo, zona o vendedor.
        </p>
      </div>

      <div className={styles.grid}>
        {/* ========================================================================= */}
        {/* TARJETA 1: CLIENTE CON HISTORIAL */}
        {/* ========================================================================= */}
        <div className={styles.card}>
          <div className="space-y-6">
            <div className={styles.badgeContainer}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">person</span>
                <span className="text-sm font-bold text-slate-200">Cliente con Historial</span>
              </div>
            </div>

            {/* Enganche Libre Toggle */}
            <div className={styles.switchContainer}>
              <div>
                <p className={styles.switchLabel}>Permitir Enganche Libre</p>
                {siEngancheLibre && (
                  <p className={styles.switchDesc}>
                    El vendedor puede definir cualquier monto.
                  </p>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={siEngancheLibre}
                onClick={onToggleSiEngancheLibre}
                disabled={isPending}
                className={`${styles.switchTrack} ${
                  siEngancheLibre ? "bg-secondary" : "bg-slate-800"
                }`}
              >
                <span
                  className={`${styles.switchThumb} ${
                    siEngancheLibre ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Gestión de Montos Fijos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Montos Fijos Disponibles
                </label>
                <span className="text-[11px] text-slate-500">
                  {siMontosFijos.length} {siMontosFijos.length === 1 ? "opción" : "opciones"}
                </span>
              </div>

              {/* Chips */}
              <div className={styles.chipsBox}>
                {siMontosFijos.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No hay montos configurados.</span>
                ) : (
                  siMontosFijos.map((monto) => {
                    const isSelected = newSiMonto.trim() === String(monto);
                    return (
                      <button
                        key={monto}
                        type="button"
                        onClick={() => onChangeNewSiMonto(isSelected ? "" : String(monto))}
                        className={`inline-flex items-center justify-center min-w-[3.75rem] px-3 h-9 rounded-xl font-bold text-sm leading-none transition-all duration-200 cursor-pointer select-none shrink-0 border ${
                          isSelected
                            ? "bg-secondary text-slate-950 font-black border-secondary shadow-[0_0_15px_rgba(45,212,191,0.6)] ring-2 ring-secondary/60 scale-105"
                            : "bg-slate-900 border-secondary/30 text-secondary hover:border-secondary/80 hover:bg-slate-800 hover:shadow-[0_0_10px_rgba(45,212,191,0.25)]"
                        }`}
                        title={isSelected ? `Deseleccionar $${monto}` : `Seleccionar $${monto} para eliminar`}
                      >
                        ${monto}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Input + Botones */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative w-full sm:w-auto">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    value={newSiMonto}
                    onChange={(event) => onChangeNewSiMonto(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onAddSiMonto();
                      }
                    }}
                    placeholder="Ej: 300"
                    className={`${styles.input} focus:border-secondary`}
                    style={{ colorScheme: "dark" }}
                    suppressHydrationWarning
                  />
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={onAddSiMonto}
                    disabled={!newSiMonto || isPending}
                    className="flex-1 px-4 py-2.5 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveSiMonto}
                    disabled={!newSiMonto || isPending}
                    className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TARJETA 2: CLIENTE SIN HISTORIAL */}
        {/* ========================================================================= */}
        <div className={styles.card}>
          <div className="space-y-6">
            <div className={styles.badgeContainer}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">person</span>
                <span className="text-sm font-bold text-slate-200">Cliente sin Historial</span>
              </div>
            </div>

            {/* Enganche Libre Toggle */}
            <div className={styles.switchContainer}>
              <div>
                <p className={styles.switchLabel}>Permitir Enganche Libre</p>
                {noEngancheLibre && (
                  <p className={styles.switchDesc}>
                    El vendedor puede definir cualquier monto.
                  </p>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={noEngancheLibre}
                onClick={onToggleNoEngancheLibre}
                disabled={isPending}
                className={`${styles.switchTrack} ${
                  noEngancheLibre ? "bg-amber-400" : "bg-slate-800"
                }`}
              >
                <span
                  className={`${styles.switchThumb} ${
                    noEngancheLibre ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Gestión de Montos Fijos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Montos Fijos Disponibles
                </label>
                <span className="text-[11px] text-slate-500">
                  {noMontosFijos.length} {noMontosFijos.length === 1 ? "opción" : "opciones"}
                </span>
              </div>

              {/* Chips */}
              <div className={styles.chipsBox}>
                {noMontosFijos.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No hay montos configurados.</span>
                ) : (
                  noMontosFijos.map((monto) => {
                    const isSelected = newNoMonto.trim() === String(monto);
                    return (
                      <button
                        key={monto}
                        type="button"
                        onClick={() => onChangeNewNoMonto(isSelected ? "" : String(monto))}
                        className={`inline-flex items-center justify-center min-w-[3.75rem] px-3 h-9 rounded-xl font-bold text-sm leading-none transition-all duration-200 cursor-pointer select-none shrink-0 border ${
                          isSelected
                            ? "bg-amber-400 text-slate-950 font-black border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] ring-2 ring-amber-400/60 scale-105"
                            : "bg-slate-900 border-amber-500/30 text-amber-300 hover:border-amber-500/80 hover:bg-slate-800 hover:shadow-[0_0_10px_rgba(251,191,36,0.25)]"
                        }`}
                        title={isSelected ? `Deseleccionar $${monto}` : `Seleccionar $${monto} para eliminar`}
                      >
                        ${monto}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Input + Botones */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative w-full sm:w-auto">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    value={newNoMonto}
                    onChange={(event) => onChangeNewNoMonto(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onAddNoMonto();
                      }
                    }}
                    placeholder="Ej: 300"
                    className={`${styles.input} focus:border-amber-400`}
                    style={{ colorScheme: "dark" }}
                    suppressHydrationWarning
                  />
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={onAddNoMonto}
                    disabled={!newNoMonto || isPending}
                    className="flex-1 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveNoMonto}
                    disabled={!newNoMonto || isPending}
                    className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
