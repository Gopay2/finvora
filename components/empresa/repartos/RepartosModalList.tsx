'use client';

import React from 'react';
import { getDriverRestDayInfo } from '@/utils/driver-schedule';

interface RepartosModalListProps {
  year: number;
  month: number;
  selectedDay: number | null;
  repartidoresFiltradosLogistica: any[];
  selectedRepartidorTab: string | null;
  setSelectedRepartidorTab: (id: string | null) => void;
  repartosDelDiaSeleccionado: any[];
  timezoneDiffText: string | null;
  canCreateOrDelete: boolean;
  actionLoading: boolean;
  userRole?: string;
  handleEliminarReparto: (id: string) => void;
  setFormHorario: (horario: string) => void;
  setFormRepartidor: (id: string) => void;
  setIsFormOpen: (open: boolean) => void;
  setFormError: (error: string | null) => void;
  setIsModalOpen: (open: boolean) => void;
}

export function RepartosModalList({
  year,
  month,
  selectedDay,
  repartidoresFiltradosLogistica,
  selectedRepartidorTab,
  setSelectedRepartidorTab,
  repartosDelDiaSeleccionado,
  timezoneDiffText,
  canCreateOrDelete,
  actionLoading,
  userRole,
  handleEliminarReparto,
  setFormHorario,
  setFormRepartidor,
  setIsFormOpen,
  setFormError,
  setIsModalOpen
}: RepartosModalListProps) {
  const styles = {
    tabsContainer: "flex flex-col gap-2 border-b border-slate-800/80 pb-3 pt-2 md:pb-4 md:pt-3 shrink-0",
    tabsList: "flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1",
    tabBtn: "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border cursor-pointer",
    tabBtnActive: "bg-secondary/10 border-secondary text-secondary shadow-[0_0_15px_rgba(16,185,129,0.08)] font-extrabold",
    tabBtnInactive: "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-750",
    tabBadge: "px-2 py-0.5 rounded-full text-[9px] font-black",
    tabBadgeActive: "bg-secondary text-slate-950",
    tabBadgeInactive: "bg-slate-800/80 text-slate-300",
    timezoneBadge: "text-xs text-blue-400 font-bold flex items-center gap-2 ml-1 mt-1.5 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl w-fit shadow-[0_0_15px_rgba(59,130,246,0.05)]",
    noDriversWarning: "p-4 bg-slate-950/30 border border-slate-800 text-slate-500 text-xs rounded-2xl text-center my-3 shrink-0",
    repartosList: "flex-1 overflow-y-auto py-2 md:py-4 space-y-2 pr-1 custom-scrollbar min-h-0 my-2",
    restDayBanner: "p-3 mb-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 text-center animate-in fade-in duration-300",
    timeRow: "flex gap-2 md:gap-4 items-stretch group/row min-h-12",
    timeColumn: "w-14 md:w-20 flex flex-col items-center justify-center shrink-0 border-r border-slate-800 pr-2 md:pr-3 relative",
    timeText: "text-xs font-black text-slate-300 font-mono tracking-tight",
    periodText: "text-[9px] text-slate-600 uppercase tracking-widest font-semibold",
    lineTop: "absolute right-[-1px] top-1/2 bottom-0 w-[2px] bg-slate-800 group-last/row:hidden",
    lineBottom: "absolute right-[-1px] top-0 bottom-1/2 w-[2px] bg-slate-800 group-first/row:hidden",
    timeNode: "absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 rounded-full border",
    timeNodeActive: "bg-secondary border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.6)] w-2.5 h-2.5 right-[-5px]",
    timeNodeEmpty: "bg-slate-900 border-slate-800 h-2 w-2",
    contentCol: "flex-1 pb-2",
    card: "relative bg-slate-950/40 border border-slate-800 rounded-2xl p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 hover:border-slate-700 transition-all shadow-inner group overflow-hidden pr-10 md:pr-4",
    cardActiveStrip: "absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    cardContent: "space-y-1.5 md:space-y-2 flex-1 min-w-0 pl-1 md:pl-2",
    cardBadgeRow: "flex flex-wrap items-center gap-1.5",
    cardZoneBadge: "px-2 py-0.5 text-[9px] md:text-[10px] md:px-2.5 font-bold uppercase rounded-md bg-emerald-500/10 text-secondary border border-emerald-500/20",
    cardTitle: "text-white font-bold text-sm md:text-base truncate",
    cardDetails: "flex flex-wrap gap-x-3 gap-y-0.5 md:gap-x-4 md:gap-y-1 text-[11px] md:text-xs text-slate-400",
    cardDetailItem: "flex items-center gap-1 md:gap-1.5",
    cardDetailVal: "text-slate-200",
    cardDeleteBtn: "absolute top-3 right-3 md:relative md:top-auto md:right-auto p-1.5 md:p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer md:self-center disabled:opacity-50",
    emptySlotBtn: "w-full text-left py-2.5 px-4 rounded-xl border border-dashed transition-all flex items-center justify-between group/btn",
    emptySlotActive: "border-slate-800 hover:border-secondary/30 bg-transparent hover:bg-secondary/5 text-slate-600 hover:text-secondary cursor-pointer",
    emptySlotDisabled: "border-slate-800/40 bg-slate-950/5 text-slate-700 cursor-not-allowed opacity-40",
    emptySlotText: "text-xs italic select-none",
    emptySlotIcon: "material-symbols-outlined text-sm opacity-0 group-hover/btn:opacity-100 transition-all text-secondary",
    emptyListState: "flex flex-col items-center justify-center py-12 text-slate-500 italic text-sm",
    emptyListIcon: "material-symbols-outlined text-4xl mb-2 opacity-50",
    footer: "flex items-center justify-end gap-3 border-t border-slate-800 pt-3 md:pt-4 shrink-0",
    footerCloseBtn: "px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all cursor-pointer border border-slate-700",
    footerCreateBtn: "px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <>
      {repartidoresFiltradosLogistica.length > 0 ? (
        <div className={styles.tabsContainer}>
          <div className={styles.tabsList}>
            {repartidoresFiltradosLogistica.map((rep) => {
              const isActive = selectedRepartidorTab === rep.id;
              const countRepartos = repartosDelDiaSeleccionado.filter(reparto => reparto.repartidores?.id === rep.id).length;
              
              let tzShort = 'GMT-6';
              try {
                const formatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: rep.zona_horaria,
                  timeZoneName: 'shortOffset'
                });
                tzShort = formatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'GMT-6';
              } catch (e) {}

              return (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setSelectedRepartidorTab(rep.id)}
                  className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : styles.tabBtnInactive}`}
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>{rep.nombre}</span>
                  <span className="text-[10px] opacity-60 font-semibold">({tzShort})</span>
                  {countRepartos > 0 && (
                    <span className={`${styles.tabBadge} ${isActive ? styles.tabBadgeActive : styles.tabBadgeInactive}`}>
                      {countRepartos}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {timezoneDiffText && (
            <div className={styles.timezoneBadge}>
              <span className="material-symbols-outlined text-sm text-blue-400 animate-pulse">schedule</span>
              <span>{timezoneDiffText}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noDriversWarning}>
          ⚠️ No hay repartidores activos registrados para ver agendas. Ve a Configuración de Repartidores primero.
        </div>
      )}

      <div className={styles.repartosList}>
        {selectedRepartidorTab ? (() => {
          const driverReps = repartosDelDiaSeleccionado.filter(rep => rep.repartidores?.id === selectedRepartidorTab);
          const currentTabDriverObj = repartidoresFiltradosLogistica.find(r => r.id === selectedRepartidorTab);
          const isTabDriverCT = (currentTabDriverObj?.nombre || "").toLowerCase() === "repartidor ct";

          const formattedDayStr = selectedDay !== null 
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
            : '';
          const driverRestInfo = getDriverRestDayInfo(currentTabDriverObj?.nombre, formattedDayStr);

          const minStandardHour = isTabDriverCT ? 10 : 9;
          const maxStandardHour = isTabDriverCT ? 17 : 19;

          const standardSlots: string[] = [];
          for (let h = minStandardHour; h <= maxStandardHour; h++) {
            const hStr = String(h).padStart(2, '0');
            standardSlots.push(`${hStr}:00`);
            if (h < maxStandardHour) {
              standardSlots.push(`${hStr}:30`);
            }
          }

          const extraSlots = new Set<string>();
          driverReps.forEach(rep => {
            if (!rep.horario) return;
            const timePart = rep.horario.slice(0, 5);
            if (timePart && !standardSlots.includes(timePart)) {
              extraSlots.add(timePart);
            }
          });

          const allSlotStrings = Array.from(new Set([...standardSlots, ...Array.from(extraSlots)])).sort((a, b) => a.localeCompare(b));

          return (
            <>
              {driverRestInfo.isRestDay && (
                <div className={styles.restDayBanner}>
                  <span className="material-symbols-outlined text-base select-none">event_busy</span>
                  <span>{currentTabDriverObj?.nombre || 'El repartidor'} no realiza entregas los días {driverRestInfo.restDayNames.join(", ")} (Día de descanso).</span>
                </div>
              )}
              {allSlotStrings.map((slotStr) => {
                const [hour, minute] = slotStr.split(':').map(Number);
                
                const rep = repartidoresFiltradosLogistica.find(r => r.id === selectedRepartidorTab);
                const tz = rep?.zona_horaria || 'America/Mexico_City';
                const driverNowString = new Date().toLocaleString('en-US', { timeZone: tz });
                const driverNow = new Date(driverNowString);
                const minAllowed = new Date(driverNow.getTime() + 60 * 60 * 1000);
                const slotDate = new Date(year, month, selectedDay || 1, hour, minute);
                const isPrivileged = userRole === 'Admin' || userRole === 'Developer' || userRole === 'Supervisor' || userRole === 'Repartidor';
                const isPastOrUnavailable = (!isPrivileged && slotDate < minAllowed) || driverRestInfo.isRestDay;
                
                const repsInSlot = driverReps.filter(rep => {
                  if (!rep.horario) return false;
                  return rep.horario.slice(0, 5) === slotStr;
                });

                return (
                  <div key={slotStr} className={styles.timeRow}>
                    <div className={styles.timeColumn}>
                      <span className={styles.timeText}>{slotStr}</span>
                      <span className={styles.periodText}>{hour >= 12 ? 'pm' : 'am'}</span>
                      <div className={styles.lineTop} />
                      <div className={styles.lineBottom} />
                      <div className={`
                        ${styles.timeNode}
                        ${repsInSlot.length > 0 ? styles.timeNodeActive : styles.timeNodeEmpty}
                      `} />
                    </div>

                    <div className={styles.contentCol}>
                      {repsInSlot.length > 0 ? (
                        <div className="space-y-2">
                          {repsInSlot.map((rep) => (
                            <div key={rep.id} className={styles.card}>
                              <div className={styles.cardActiveStrip} />
                              <div className={styles.cardContent}>
                                <div className={styles.cardBadgeRow}>
                                  <span className={styles.cardZoneBadge}>
                                    📍 {rep.zonas_reparto?.nombre_zona || 'Sin Zona'}
                                  </span>
                                </div>
                                <h4 className={styles.cardTitle}>
                                  {rep.productos?.marca} {rep.productos?.modelo}
                                </h4>
                                <div className={styles.cardDetails}>
                                  {rep.notas && (
                                    <span className={styles.cardDetailItem}>
                                      <span className="material-symbols-outlined text-sm text-secondary">account_circle</span>
                                      Cliente: <strong className={styles.cardDetailVal}>{rep.notas}</strong>
                                    </span>
                                  )}
                                  <span className={styles.cardDetailItem}>
                                    <span className="material-symbols-outlined text-sm text-slate-500">local_shipping</span>
                                    Repartidor: <strong className={styles.cardDetailVal}>{rep.repartidores?.nombre || 'No asignado'}</strong>
                                  </span>
                                  <span className={styles.cardDetailItem}>
                                    <span className="material-symbols-outlined text-sm text-slate-500">person</span>
                                    Vendedor: <strong className={styles.cardDetailVal}>
                                      {(() => {
                                        const rawName = rep.vendedor?.username || rep.vendedor?.email || 'N/A';
                                        return rawName !== 'N/A' ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'N/A';
                                      })()}
                                    </strong>
                                  </span>
                                  {rep.imei && (
                                    <span className={`${styles.cardDetailItem} font-mono text-[11px]`}>
                                      <span className="material-symbols-outlined text-sm text-slate-500">tag</span>
                                      IMEI: <strong className={styles.cardDetailVal}>{rep.imei}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {canCreateOrDelete && (
                                <button
                                  onClick={() => handleEliminarReparto(rep.id)}
                                  disabled={actionLoading}
                                  className={styles.cardDeleteBtn}
                                  title="Eliminar Reparto"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!canCreateOrDelete || isPastOrUnavailable) return;
                            setFormHorario(slotStr);
                            setFormRepartidor(selectedRepartidorTab || '');
                            setIsFormOpen(true);
                            setFormError(null);
                          }}
                          disabled={!canCreateOrDelete || isPastOrUnavailable}
                          className={`
                            ${styles.emptySlotBtn}
                            ${(!canCreateOrDelete || isPastOrUnavailable) ? styles.emptySlotDisabled : styles.emptySlotActive}
                          `}
                        >
                          <span className={styles.emptySlotText}>
                            {!canCreateOrDelete
                              ? 'Sin repartos programados'
                              : driverRestInfo.isRestDay
                                ? `Día de descanso (${driverRestInfo.restDayNames.join(", ")})`
                                : isPastOrUnavailable
                                  ? 'Horario no disponible (Pasado / Límite)'
                                  : 'Sin repartos programados'}
                          </span>
                          {canCreateOrDelete && !isPastOrUnavailable && (
                            <span className={styles.emptySlotIcon}>
                              add_circle
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()
        : (
          <div className={styles.emptyListState}>
            <span className={styles.emptyListIcon}>touch_app</span>
            Selecciona un repartidor en la barra superior para ver su agenda
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button 
          onClick={() => {
            setIsModalOpen(false);
            setSelectedRepartidorTab(null);
          }}
          className={styles.footerCloseBtn}
        >
          Cerrar
        </button>
        {canCreateOrDelete && (
          <button 
            onClick={() => {
              setFormRepartidor(selectedRepartidorTab || '');
              setIsFormOpen(true);
              setFormError(null);
            }}
            disabled={!selectedRepartidorTab}
            className={styles.footerCreateBtn}
          >
            + Agendar Reparto
          </button>
        )}
      </div>
    </>
  );
}
