'use client';

import React, { useState, useTransition } from "react";
import { actualizarHorariosRepartidor } from "@/app/empresa/webapp/repartos/repartos-actions";

// ─── Tipos e Interfaces ──────────────────────────────────────────────────────

export interface RepartidorHorarioItem {
  id: string;
  nombre: string;
  activo: boolean;
  zona_horaria: string;
  dias?: number[];
  horario_inicio?: string;
  horario_fin?: string;
  created_at?: string;
}

interface Props {
  initialRepartidores: RepartidorHorarioItem[];
}

// ─── Constantes de Configuración ─────────────────────────────────────────────

const DIAS_SEMANA = [
  { id: 1, nombre: "Lunes", inicial: "L" },
  { id: 2, nombre: "Martes", inicial: "M" },
  { id: 3, nombre: "Miércoles", inicial: "X" },
  { id: 4, nombre: "Jueves", inicial: "J" },
  { id: 5, nombre: "Viernes", inicial: "V" },
  { id: 6, nombre: "Sábado", inicial: "S" },
  { id: 0, nombre: "Domingo", inicial: "D" },
];

/** Opciones de intervalos horarios cada 30 minutos (07:00 a 22:00) */
const GENERATED_TIME_OPTIONS = (() => {
  const options: string[] = [];
  for (let h = 7; h <= 22; h++) {
    const hStr = String(h).padStart(2, '0');
    options.push(`${hStr}:00`);
    if (h < 22) {
      options.push(`${hStr}:30`);
    }
  }
  return options;
})();

// ─── Estilos (Tailwind CSS) ──────────────────────────────────────────────────

const styles = {
  container: "space-y-8 relative",
  alertError: "p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl flex items-center gap-2 animate-pulse",
  alertIcon: "material-symbols-outlined text-lg",
  tableCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl",
  tableHeader: "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
  tableTitleGroup: "space-y-1",
  tableTitle: "text-base sm:text-xl font-bold text-white flex items-center gap-2",
  tableTitleIcon: "material-symbols-outlined text-secondary text-xl sm:text-2xl",
  tableWrapper: "bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-xl",
  tableScroll: "overflow-x-auto custom-scrollbar",
  table: "w-full text-center border-collapse",
  thead: "bg-slate-950/40",
  th: "px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center",
  tr: "hover:bg-white/5 transition-colors group",
  tdRepartidor: "px-6 py-4 text-sm font-bold text-white border-b border-slate-800/50 text-center min-w-[240px] whitespace-nowrap",
  tdDias: "px-6 py-4 border-b border-slate-800/50 text-center min-w-[240px]",
  tdHorarios: "px-6 py-4 border-b border-slate-800/50 text-center min-w-[200px] whitespace-nowrap",
  tdActions: "px-6 py-4 border-b border-slate-800/50 text-center",
  btnEdit: "p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/30 transition-all flex items-center justify-center cursor-pointer mx-auto",
  btnIcon: "material-symbols-outlined text-base",
  badgeTime: "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono tracking-tight bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm whitespace-nowrap",
  dayPillGrid: "flex items-center justify-center gap-1.5",
  dayPillActive: "w-6 h-6 rounded-lg text-[10px] font-black uppercase flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
  dayPillInactive: "w-6 h-6 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center bg-slate-950/50 text-slate-600 border border-slate-800 line-through opacity-60",

  // Modal
  modalOverlay: "fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto",
  modalBackdrop: "absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-in fade-in duration-300",
  modalContent: "relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-6 my-auto",
  modalHeader: "flex items-start justify-between border-b border-slate-800 pb-4 gap-4",
  modalTitle: "text-lg font-bold text-white leading-tight",
  modalCloseBtn: "w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-slate-950/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 transition-all cursor-pointer",
  formGroup: "space-y-2",
  label: "text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5",
  daySelectContainer: "grid grid-cols-4 gap-2 pt-1",
  daySelectBtn: "py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center text-center cursor-pointer",
  daySelectBtnActive: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]",
  daySelectBtnInactive: "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400",
  selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none cursor-pointer",
  modalBtnGroup: "pt-4 border-t border-slate-800",
  modalBtnSubmit: "w-full py-3 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all text-xs cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2",
  btnSpinner: "w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin",
};

// ─── Componente Principal ──────────────────────────────────────────────────

/**
 * Componente interactivo para administrar los días laborales y rangos horarios
 * de repartidores y ubicaciones físicas de Finvora.
 */
export default function HorariosConfig({ initialRepartidores }: Props) {
  const [repartidores, setRepartidores] = useState<RepartidorHorarioItem[]>(initialRepartidores);
  const [editingRepartidor, setEditingRepartidor] = useState<RepartidorHorarioItem | null>(null);
  const [selectedDias, setSelectedDias] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [horarioInicio, setHorarioInicio] = useState("09:00");
  const [horarioFin, setHorarioFin] = useState("19:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  React.useEffect(() => {
    setRepartidores(initialRepartidores);
  }, [initialRepartidores]);

  // Bloqueo de scroll en el body cuando el modal está abierto
  React.useEffect(() => {
    if (editingRepartidor) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingRepartidor]);

  /** Abre el modal de configuración precargando los horarios del repartidor */
  const startEdit = (repartidor: RepartidorHorarioItem) => {
    setEditingRepartidor(repartidor);
    setSelectedDias(repartidor.dias && repartidor.dias.length > 0 ? repartidor.dias : [0, 1, 2, 3, 4, 5, 6]);
    setHorarioInicio(repartidor.horario_inicio || "09:00");
    setHorarioFin(repartidor.horario_fin || "19:00");
    setError(null);
  };

  /** Cierra el modal de edición */
  const closeEdit = () => {
    setEditingRepartidor(null);
    setError(null);
  };

  /** Alterna la selección de un día laboral, asegurando al menos 1 día activo */
  const toggleDia = (diaId: number) => {
    setSelectedDias(prevDias => {
      if (prevDias.includes(diaId)) {
        if (prevDias.length === 1) {
          setError("Debe mantener al menos 1 día laboral activo.");
          return prevDias;
        }
        setError(null);
        return prevDias.filter(dia => dia !== diaId).sort((diaA, diaB) => diaA - diaB);
      } else {
        setError(null);
        return [...prevDias, diaId].sort((diaA, diaB) => diaA - diaB);
      }
    });
  };

  /** Valida y guarda los nuevos horarios del repartidor con actualización optimista */
  const handleGuardarHorarios = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRepartidor) return;

    if (horarioInicio >= horarioFin) {
      setError("El horario de inicio debe ser anterior al horario de fin.");
      return;
    }

    if (selectedDias.length === 0) {
      setError("Debe seleccionar al menos 1 día de atención.");
      return;
    }

    setLoading(true);
    setError(null);

    const repartidorId = editingRepartidor.id;
    const previousRepartidores = [...repartidores];

    // Optimistic Update
    setRepartidores(prevRepartidores =>
      prevRepartidores.map(item => item.id === repartidorId ? { ...item, dias: selectedDias, horario_inicio: horarioInicio, horario_fin: horarioFin } : item)
    );

    try {
      const res = await actualizarHorariosRepartidor(repartidorId, selectedDias, horarioInicio, horarioFin);
      if (res.success) {
        setEditingRepartidor(null);
        startTransition(() => {
          // Revalida rutas en Next.js
        });
      } else {
        setRepartidores(previousRepartidores);
        setError(res.error || "Error al actualizar los horarios.");
      }
    } catch (err: unknown) {
      setRepartidores(previousRepartidores);
      const errorMessage = err instanceof Error ? err.message : "Error de red al guardar.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.alertError}>
          <span className={styles.alertIcon}>error</span>
          {error}
        </div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitleGroup}>
            <h2 className={styles.tableTitle}>
              <span className={styles.tableTitleIcon}>schedule</span>
              Detalle por Repartidor/Ubicación
            </h2>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.thead}>
                  <th className={styles.th}>Repartidor / Ubicación</th>
                  <th className={styles.th}>Días disponible</th>
                  <th className={styles.th}>Horario</th>
                  <th className={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {repartidores.length > 0 ? (
                  repartidores.map((repartidor) => {
                    const diasLaborales = repartidor.dias && repartidor.dias.length > 0 ? repartidor.dias : [0, 1, 2, 3, 4, 5, 6];
                    const horarioInicioLocal = repartidor.horario_inicio || "09:00";
                    const horarioFinLocal = repartidor.horario_fin || "19:00";
                    const activeDaysSet = new Set(diasLaborales);

                    return (
                      <tr key={repartidor.id} className={styles.tr}>
                        {/* Repartidor / Ubicación */}
                        <td className={styles.tdRepartidor}>
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-white text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap">
                              {repartidor.nombre}
                              {!repartidor.activo && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase">
                                  Inactivo
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Días de Atención */}
                        <td className={styles.tdDias}>
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <div className={styles.dayPillGrid}>
                              {DIAS_SEMANA.map((dia) => {
                                const isActive = activeDaysSet.has(dia.id);
                                return (
                                  <span
                                    key={dia.id}
                                    title={`${dia.nombre}: ${isActive ? 'Laboral' : 'Descanso'}`}
                                    className={isActive ? styles.dayPillActive : styles.dayPillInactive}
                                  >
                                    {dia.inicial}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Horarios */}
                        <td className={styles.tdHorarios}>
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={styles.badgeTime}>
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              {horarioInicioLocal} - {horarioFinLocal} hs
                            </span>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className={styles.tdActions}>
                          <button
                            type="button"
                            onClick={() => startEdit(repartidor)}
                            className={styles.btnEdit}
                            title="Editar Horarios y Días"
                          >
                            <span className={styles.btnIcon}>edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                      No hay repartidores o ubicaciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Edición de Horarios */}
      {editingRepartidor && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBackdrop} onClick={closeEdit} />
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className="space-y-1.5">
                <h3 className={styles.modalTitle}>
                  Configurar Horarios
                </h3>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-secondary/15 text-secondary border border-secondary/30 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
                    {editingRepartidor.nombre}
                  </span>
                </div>
              </div>
              <button type="button" onClick={closeEdit} className={styles.modalCloseBtn}>
                <span className="material-symbols-outlined text-lg leading-none block select-none">close</span>
              </button>
            </div>

            <form onSubmit={handleGuardarHorarios} className="space-y-5">
              {/* Selector de Días */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className="material-symbols-outlined text-sm text-secondary">calendar_month</span>
                  Días laborales
                </label>
                <div className={styles.daySelectContainer}>
                  {DIAS_SEMANA.map((dia) => {
                    const isSelected = selectedDias.includes(dia.id);
                    return (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => toggleDia(dia.id)}
                        className={`${styles.daySelectBtn} ${isSelected ? styles.daySelectBtnActive : styles.daySelectBtnInactive}`}
                      >
                        <span>{dia.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rango Horario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                    Horario Inicio
                  </label>
                  <select
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    required
                    className={styles.selectInput}
                    style={{ colorScheme: 'dark' }}
                  >
                    {GENERATED_TIME_OPTIONS.map((time) => (
                      <option key={`start-${time}`} value={time} className="bg-slate-950 text-white">
                        {time} hs
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                    Horario Fin
                  </label>
                  <select
                    value={horarioFin}
                    onChange={(e) => setHorarioFin(e.target.value)}
                    required
                    className={styles.selectInput}
                    style={{ colorScheme: 'dark' }}
                  >
                    {GENERATED_TIME_OPTIONS.map((time) => (
                      <option key={`end-${time}`} value={time} className="bg-slate-950 text-white">
                        {time} hs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botonera */}
              <div className={styles.modalBtnGroup}>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.modalBtnSubmit}
                >
                  {loading ? (
                    <>
                      <div className={styles.btnSpinner} />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      Confirmar Horarios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
