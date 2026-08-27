'use client';

import React from "react";

interface ConfiguracionGeneralSectionProps {
  siPorcentajes: number[];
  siEngancheLibre: boolean;
  newSiPercent: string;
  onChangeNewSiPercent: (value: string) => void;
  onAddSiPercent: () => void;
  onRemoveSiPercent: () => void;
  onToggleSiEngancheLibre: () => void;

  noPorcentajes: number[];
  noEngancheLibre: boolean;
  newNoPercent: string;
  onChangeNewNoPercent: (value: string) => void;
  onAddNoPercent: () => void;
  onRemoveNoPercent: () => void;
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
  switchTrack: "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-center disabled:opacity-50",
  switchThumb: "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out",
  chipsBox: "flex flex-wrap gap-2 min-h-[5rem] h-auto p-3.5 bg-slate-950/50 border border-slate-800/70 rounded-2xl items-start content-start overflow-y-auto custom-scrollbar",
  input: "w-full sm:w-28 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-100 focus:outline-none transition-all",
};

/**
 * Sección 1: Configuración General de Enganches (Con Historial y Sin Historial)
 */
export function ConfiguracionGeneralSection({
  siPorcentajes,
  siEngancheLibre,
  newSiPercent,
  onChangeNewSiPercent,
  onAddSiPercent,
  onRemoveSiPercent,
  onToggleSiEngancheLibre,

  noPorcentajes,
  noEngancheLibre,
  newNoPercent,
  onChangeNewNoPercent,
  onAddNoPercent,
  onRemoveNoPercent,
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
          Valores por defecto para todo el sistema cuando no existan excepciones por zona o vendedor.
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

            {/* Gestión de Porcentajes */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Porcentajes Disponibles
              </label>

              {/* Chips */}
              <div className={styles.chipsBox}>
                {siPorcentajes.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No hay porcentajes configurados.</span>
                ) : (
                  siPorcentajes.map((porcentaje) => {
                    const isSelected = newSiPercent.trim() === String(porcentaje);
                    return (
                      <button
                        key={porcentaje}
                        type="button"
                        onClick={() => onChangeNewSiPercent(isSelected ? "" : String(porcentaje))}
                        className={`inline-flex items-center justify-center w-12 h-9 rounded-xl font-bold text-sm leading-none transition-all duration-200 cursor-pointer select-none shrink-0 border ${
                          isSelected
                            ? "bg-secondary text-slate-950 font-black border-secondary shadow-[0_0_15px_rgba(45,212,191,0.6)] ring-2 ring-secondary/60 scale-105"
                            : "bg-slate-900 border-secondary/30 text-secondary hover:border-secondary/80 hover:bg-slate-800 hover:shadow-[0_0_10px_rgba(45,212,191,0.25)]"
                        }`}
                        title={isSelected ? `Deseleccionar ${porcentaje}%` : `Seleccionar ${porcentaje}% para eliminar`}
                      >
                        {porcentaje}%
                      </button>
                    );
                  })
                )}
              </div>

              {/* Input + Botones */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="100"
                  value={newSiPercent}
                  onChange={(event) => onChangeNewSiPercent(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onAddSiPercent();
                    }
                  }}
                  placeholder="Ej: 30"
                  className={`${styles.input} focus:border-secondary`}
                  style={{ colorScheme: "dark" }}
                  suppressHydrationWarning
                />
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={onAddSiPercent}
                    disabled={!newSiPercent || isPending}
                    className="flex-1 px-4 py-2.5 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveSiPercent}
                    disabled={!newSiPercent || isPending}
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

            {/* Gestión de Porcentajes */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Porcentajes Disponibles
              </label>

              {/* Chips */}
              <div className={styles.chipsBox}>
                {noPorcentajes.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No hay porcentajes configurados.</span>
                ) : (
                  noPorcentajes.map((porcentaje) => {
                    const isSelected = newNoPercent.trim() === String(porcentaje);
                    return (
                      <button
                        key={porcentaje}
                        type="button"
                        onClick={() => onChangeNewNoPercent(isSelected ? "" : String(porcentaje))}
                        className={`inline-flex items-center justify-center w-12 h-9 rounded-xl font-bold text-sm leading-none transition-all duration-200 cursor-pointer select-none shrink-0 border ${
                          isSelected
                            ? "bg-amber-400 text-slate-950 font-black border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] ring-2 ring-amber-400/60 scale-105"
                            : "bg-slate-900 border-amber-500/30 text-amber-300 hover:border-amber-500/80 hover:bg-slate-800 hover:shadow-[0_0_10px_rgba(251,191,36,0.25)]"
                        }`}
                        title={isSelected ? `Deseleccionar ${porcentaje}%` : `Seleccionar ${porcentaje}% para eliminar`}
                      >
                        {porcentaje}%
                      </button>
                    );
                  })
                )}
              </div>

              {/* Input + Botones */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="100"
                  value={newNoPercent}
                  onChange={(event) => onChangeNewNoPercent(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onAddNoPercent();
                    }
                  }}
                  placeholder="Ej: 5"
                  className={`${styles.input} focus:border-amber-400`}
                  style={{ colorScheme: "dark" }}
                  suppressHydrationWarning
                />
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={onAddNoPercent}
                    disabled={!newNoPercent || isPending}
                    className="flex-1 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveNoPercent}
                    disabled={!newNoPercent || isPending}
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
