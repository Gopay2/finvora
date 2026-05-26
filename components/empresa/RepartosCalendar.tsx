'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRepartosCalendar } from './useRepartosCalendar';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const styles = {
  // Calendar base
  wrapper: "flex flex-col w-full relative",
  loadingOverlay: "absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[90] flex items-center justify-center",
  loadingSpinner: "w-12 h-12 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin",
  
  // Header controls
  header: "flex items-center justify-between py-3 px-4 border-b border-slate-800 bg-slate-900/60 shrink-0",
  headerTitle: "text-lg md:text-xl font-bold text-white capitalize tracking-wide",
  headerYear: "text-secondary font-light ml-1",
  controls: "flex items-center gap-3",
  todayBtn: "px-3 h-8 flex items-center justify-center rounded-lg bg-secondary text-slate-950 hover:bg-secondary/90 transition-all border border-transparent text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer",
  navGroup: "flex items-center gap-1.5",
  navBtn: "w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 cursor-pointer",
  
  // Grid
  daysOfWeekHeader: "grid grid-cols-7 border-b border-slate-800 bg-slate-900/40",
  dayOfWeekLabel: "py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-500",
  gridBody: "grid grid-cols-7 select-none",
  blankCell: "border-r border-b border-slate-800/20 bg-slate-950/10 h-20 md:h-28",
  dayCell: "border-r border-b border-slate-800/50 p-2 flex flex-col transition-all group relative cursor-pointer h-20 md:h-28 overflow-hidden",
  dayCellToday: "bg-secondary/5 z-10",
  dayCellDefault: "bg-transparent hover:bg-slate-800/20",
  todayGlow: "absolute inset-0 border-2 border-secondary shadow-[0_0_20px_rgba(16,185,129,0.4),inset_0_0_20px_rgba(16,185,129,0.15)] pointer-events-none",
  cellHeader: "flex items-start justify-between relative z-10 shrink-0 pr-4 md:pr-0",
  cellNumber: "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-all",
  cellNumberToday: "text-secondary font-black text-sm",
  cellNumberDefault: "text-slate-400 group-hover:text-white",
  badgeCount: "hidden md:block absolute top-1 right-1 text-[8px] md:text-[9px] font-black text-slate-950 bg-secondary px-1 md:px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in duration-300",
  cellContent: "flex-1 mt-1 overflow-y-auto space-y-0.5 relative z-10 custom-scrollbar pr-0.5 min-h-0 w-full",
  repartoCompact: "text-[9px] font-semibold bg-slate-950/60 text-slate-300 border border-slate-800/60 rounded-md px-1.5 py-0.5 flex items-center justify-between gap-1 shadow-sm hover:border-slate-750 hover:text-white transition-all truncate",
  moreLabel: "text-[9px] font-bold text-center text-secondary bg-secondary/10 border border-secondary/20 rounded-md py-0.5 mt-0.5",
  
  // Modal layout
  modalBackdrop: "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4",
  modalContainer: "w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] my-auto",
  modalHeader: "flex items-center justify-between border-b border-slate-800 pb-4 shrink-0",
  modalTitle: "text-xl md:text-2xl font-bold text-white",
  modalSubtitle: "text-slate-500 text-xs mt-1",
  modalCloseBtn: "w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer",
  
  // Tabs
  tabsContainer: "flex flex-col gap-2 border-b border-slate-800/80 pb-4 pt-3 shrink-0",
  tabsList: "flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1",
  tabBtn: "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border cursor-pointer",
  tabBtnActive: "bg-secondary/10 border-secondary text-secondary shadow-[0_0_15px_rgba(16,185,129,0.08)] font-extrabold",
  tabBtnInactive: "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-750",
  tabBadge: "px-2 py-0.5 rounded-full text-[9px] font-black",
  tabBadgeActive: "bg-secondary text-slate-950",
  tabBadgeInactive: "bg-slate-800/80 text-slate-300",
  timezoneBadge: "text-xs text-blue-400 font-bold flex items-center gap-2 ml-1 mt-1.5 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl w-fit shadow-[0_0_15px_rgba(59,130,246,0.05)]",
  noDriversWarning: "p-4 bg-slate-950/30 border border-slate-800 text-slate-500 text-xs rounded-2xl text-center my-3 shrink-0",
  
  // List details
  repartosList: "flex-1 overflow-y-auto py-4 space-y-2 pr-1 custom-scrollbar min-h-0 my-2",
  timeRow: "flex gap-4 items-stretch group/row min-h-12",
  timeColumn: "w-20 flex flex-col items-center justify-center shrink-0 border-r border-slate-800 pr-3 relative",
  timeText: "text-xs font-black text-slate-300 font-mono tracking-tight",
  periodText: "text-[9px] text-slate-600 uppercase tracking-widest font-semibold",
  lineTop: "absolute right-[-1px] top-1/2 bottom-0 w-[2px] bg-slate-800 group-last/row:hidden",
  lineBottom: "absolute right-[-1px] top-0 bottom-1/2 w-[2px] bg-slate-800 group-first/row:hidden",
  timeNode: "absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 rounded-full border",
  timeNodeActive: "bg-secondary border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.6)] w-2.5 h-2.5 right-[-5px]",
  timeNodeEmpty: "bg-slate-900 border-slate-800 h-2 w-2",
  contentCol: "flex-1 pb-2",
  
  // Reparto Card
  card: "relative bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-inner group overflow-hidden",
  cardActiveStrip: "absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  cardContent: "space-y-2 flex-1 min-w-0 pl-2",
  cardBadgeRow: "flex flex-wrap items-center gap-2",
  cardZoneBadge: "px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-secondary border border-emerald-500/20",
  cardTitle: "text-white font-bold text-base truncate",
  cardSpecs: "text-xs font-normal text-slate-500 ml-2",
  cardDetails: "flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400",
  cardDetailItem: "flex items-center gap-1.5",
  cardDetailVal: "text-slate-200",
  cardDeleteBtn: "p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer md:self-center self-end disabled:opacity-50",
  
  // Empty slot
  emptySlotBtn: "w-full text-left py-2.5 px-4 rounded-xl border border-dashed transition-all flex items-center justify-between group/btn",
  emptySlotActive: "border-slate-800 hover:border-secondary/30 bg-transparent hover:bg-secondary/5 text-slate-600 hover:text-secondary cursor-pointer",
  emptySlotDisabled: "border-slate-800/40 bg-slate-950/5 text-slate-700 cursor-not-allowed opacity-40",
  emptySlotText: "text-xs italic select-none",
  emptySlotIcon: "material-symbols-outlined text-sm opacity-0 group-hover/btn:opacity-100 transition-all text-secondary",
  emptyListState: "flex flex-col items-center justify-center py-12 text-slate-500 italic text-sm",
  emptyListIcon: "material-symbols-outlined text-4xl mb-2 opacity-50",
  
  // Footer
  footer: "flex items-center justify-end gap-3 border-t border-slate-800 pt-4 shrink-0",
  footerCloseBtn: "px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all cursor-pointer border border-slate-700",
  footerCreateBtn: "px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed",
  
  // Form elements
  formContainer: "flex-1 flex flex-col justify-between overflow-y-auto mt-4 min-h-0",
  formScroll: "space-y-4 pr-1 overflow-y-auto pb-4 custom-scrollbar",
  formError: "p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-pulse",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-4",
  formField: "space-y-1.5",
  formLabel: "text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1",
  formInput: "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none disabled:opacity-40 disabled:cursor-not-allowed",
};

interface RepartosCalendarProps {
  userRole?: string;
}

export default function RepartosCalendar({ userRole }: RepartosCalendarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    // Estados
    loading,
    actionLoading,
    selectedDay,
    isModalOpen,
    isFormOpen,
    selectedRepartidorTab,
    timezoneDiffText,
    formRepartidor,
    formZona,
    formVendedor,
    formStockImei,
    formHorario,
    formNotas,
    formError,
    
    // Auxiliares calculados
    year,
    month,
    blanks,
    days,
    monthNames,
    zonasFiltradas,
    repartosDelDiaSeleccionado,
    formDataOptions,
    repartidoresFiltradosLogistica,
    repartos,

    // Acciones y Setters
    setCurrentDate,
    setSelectedDay,
    setIsModalOpen,
    setIsFormOpen,
    setSelectedRepartidorTab,
    setFormRepartidor,
    setFormZona,
    setFormVendedor,
    setFormStockImei,
    setFormHorario,
    setFormNotas,
    setFormError,
    prevMonth,
    nextMonth,
    isToday,
    handleCrearReparto,
    handleEliminarReparto,
  } = useRepartosCalendar(userRole);

  return (
    <div className={styles.wrapper}>
      {/* Indicador de carga general */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}

      {/* Header (Controles) */}
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>
          {monthNames[month]} <span className={styles.headerYear}>{year}</span>
        </h3>
        <div className={styles.controls}>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className={styles.todayBtn}
          >
            Hoy
          </button>
          <div className={styles.navGroup}>
            <button 
              onClick={prevMonth}
              className={styles.navBtn}
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button 
              onClick={nextMonth}
              className={styles.navBtn}
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grilla del Calendario */}
      <div className="w-full flex flex-col">
        {/* Cabecera de días de la semana */}
        <div className={styles.daysOfWeekHeader}>
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className={styles.dayOfWeekLabel}>
              {day}
            </div>
          ))}
        </div>

        {/* Cuerpo del calendario */}
        <div className={styles.gridBody}>
          {blanks.map((b) => (
            <div key={`blank-${b}`} className={styles.blankCell}>
            </div>
          ))}
          {days.map((d) => {
            const todayFlag = isToday(d);
            const formattedDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const repartosDelDia = repartos.filter(reparto => reparto.fecha_reparto === formattedDayStr);

            return (
              <div 
                key={`day-${d}`} 
                onClick={() => {
                  setSelectedDay(d);
                  setIsModalOpen(true);
                  setIsFormOpen(false); // Abrir por defecto en listado
                }}
                className={`
                  ${styles.dayCell}
                  ${todayFlag ? styles.dayCellToday : styles.dayCellDefault}
                `}
              >
                {/* Borde flúor y resplandor para el cuadrado completo */}
                {todayFlag && (
                  <div className={styles.todayGlow} />
                )}

                <div className={styles.cellHeader}>
                  <span className={`
                    ${styles.cellNumber}
                    ${todayFlag ? styles.cellNumberToday : styles.cellNumberDefault}
                  `}>
                    {d}
                  </span>
                  
                  {/* Badge de cantidad de envíos si los hay */}
                  {repartosDelDia.length > 0 && (
                    <span className={styles.badgeCount}>
                      {repartosDelDia.length}
                    </span>
                  )}
                </div>

                {/* Área de contenido para renderizar repartos compactos */}
                <div className={styles.cellContent}>
                  {/* Vista Mobile: Puntos/Indicadores circulares pequeños */}
                  <div className="flex md:hidden flex-wrap gap-1 justify-center items-center mt-1">
                    {repartosDelDia.slice(0, 3).map((rep) => (
                      <div 
                        key={rep.id} 
                        className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_5px_rgba(16,185,129,0.6)] animate-in fade-in duration-300"
                        title={`${rep.productos?.marca} ${rep.productos?.modelo}`}
                      />
                    ))}
                    {repartosDelDia.length > 3 && (
                      <span className="text-[8px] text-secondary font-black animate-pulse">+</span>
                    )}
                  </div>

                  {/* Vista Desktop: Cards de repartos compactos completos */}
                  <div className="hidden md:flex flex-col space-y-0.5">
                    {repartosDelDia.slice(0, 2).map((rep) => {
                      // Extraer primer nombre del repartidor para que quede compacto
                      const primerNombreRep = rep.repartidores?.nombre?.replace("Repartidor ", "").split(' ')[0] || "S/R";
                      return (
                        <div 
                          key={rep.id} 
                          className={styles.repartoCompact}
                          title={`${rep.productos?.marca} ${rep.productos?.modelo} - ${rep.repartidores?.nombre} (${rep.zonas_reparto?.nombre_zona})`}
                        >
                          <span className="truncate max-w-[95%]">
                            📦 {rep.productos?.marca} {rep.productos?.modelo} ({primerNombreRep})
                          </span>
                        </div>
                      );
                    })}
                    {repartosDelDia.length > 2 && (
                      <div className={styles.moreLabel}>
                        + {repartosDelDia.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DETALLES / AGENDAR REPARTO */}
      {isMounted && isModalOpen && selectedDay !== null && createPortal(
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContainer}>
            
            {/* Header del Modal */}
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>
                  {isFormOpen ? "Agendar Nuevo Reparto" : `Repartos — ${selectedDay} de ${monthNames[month]} de ${year}`}
                </h2>
                <p className={styles.modalSubtitle}>
                  {isFormOpen 
                    ? "Completa los datos del envío" 
                    : `${repartosDelDiaSeleccionado.length} entregas agendadas`}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                  setSelectedRepartidorTab(null);
                }}
                className={styles.modalCloseBtn}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* CUERPO DEL MODAL (LISTADO) */}
            {!isFormOpen && (
              <>
                {/* Selector de Pestañas de Repartidores */}
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
                            className={`
                              ${styles.tabBtn}
                              ${isActive ? styles.tabBtnActive : styles.tabBtnInactive}
                            `}
                          >
                            <span className="material-symbols-outlined text-sm">person</span>
                            <span>{rep.nombre}</span>
                            <span className="text-[10px] opacity-60 font-semibold">({tzShort})</span>
                            {countRepartos > 0 && (
                              <span className={`
                                ${styles.tabBadge}
                                ${isActive ? styles.tabBadgeActive : styles.tabBadgeInactive}
                              `}>
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
                    const extraHours = new Set<number>();
                    driverReps.forEach(rep => {
                      if (!rep.horario) return;
                      const match = rep.horario.match(/^(\d+)/);
                      if (match) {
                        const hour = parseInt(match[1], 10);
                        if (hour < 8 || hour > 20) {
                          extraHours.add(hour);
                        }
                      }
                    });
                    const standardHours = Array.from({ length: 13 }, (_, i) => i + 8);
                    const allHours = Array.from(new Set([...standardHours, ...Array.from(extraHours)])).sort((a, b) => a - b);

                    return allHours.map((hour) => {
                      const formattedHour = `${String(hour).padStart(2, '0')}:00`;
                      
                      // Calcular si esta hora en el día seleccionado ya pasó o tiene menos de 1 hora de anticipación en la zona horaria del repartidor
                      const rep = repartidoresFiltradosLogistica.find(r => r.id === selectedRepartidorTab);
                      const tz = rep?.zona_horaria || 'America/Mexico_City';
                      const driverNowString = new Date().toLocaleString('en-US', { timeZone: tz });
                      const driverNow = new Date(driverNowString);
                      const minAllowed = new Date(driverNow.getTime() + 60 * 60 * 1000);
                      const slotDate = new Date(year, month, selectedDay || 1, hour, 0);
                      const isPrivileged = userRole === 'Admin' || userRole === 'Developer' || userRole === 'Supervisor';
                      const isPastOrUnavailable = !isPrivileged && (slotDate < minAllowed);
                      
                      // Buscar repartos para esta hora asignados a este repartidor específico
                      const repsInHour = driverReps.filter(rep => {
                        if (!rep.horario) return false;
                        if (rep.horario === formattedHour || rep.horario === `${hour}:00`) return true;
                        const match = rep.horario.match(/^(\d+)/);
                        if (match) {
                          return parseInt(match[1], 10) === hour;
                        }
                        return false;
                      });

                      return (
                        <div key={hour} className={styles.timeRow}>
                          {/* Indicador de Hora (Local del Repartidor) */}
                          <div className={styles.timeColumn}>
                            <span className={styles.timeText}>
                              {formattedHour}
                            </span>
                            <span className={styles.periodText}>
                              {hour >= 12 ? 'pm' : 'am'}
                            </span>
                            {/* Línea vertical conectora */}
                            <div className={styles.lineTop} />
                            <div className={styles.lineBottom} />
                            {/* Nodo central */}
                            <div className={`
                              ${styles.timeNode}
                              ${repsInHour.length > 0 ? styles.timeNodeActive : styles.timeNodeEmpty}
                            `} />
                          </div>

                          {/* Contenido (Tarjeta o Vacío) */}
                          <div className={styles.contentCol}>
                            {repsInHour.length > 0 ? (
                              <div className="space-y-2">
                                {repsInHour.map((rep) => (
                                  <div 
                                    key={rep.id} 
                                    className={styles.card}
                                  >
                                    {/* Línea decorativa izquierda flúor */}
                                    <div className={styles.cardActiveStrip} />

                                    <div className={styles.cardContent}>
                                      <div className={styles.cardBadgeRow}>
                                        <span className={styles.cardZoneBadge}>
                                          📍 {rep.zonas_reparto?.nombre_zona || 'Sin Zona'} ({rep.zonas_reparto?.descripcion || 'Sin descripción'})
                                        </span>
                                      </div>
                                      
                                      <h4 className={styles.cardTitle}>
                                        {rep.productos?.marca} {rep.productos?.modelo} 
                                        <span className={styles.cardSpecs}>({rep.productos?.color} - {rep.productos?.almacenamiento})</span>
                                      </h4>
                                      
                                      <div className={styles.cardDetails}>
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
                                    
                                    <button
                                      onClick={() => handleEliminarReparto(rep.id)}
                                      disabled={actionLoading}
                                      className={styles.cardDeleteBtn}
                                      title="Eliminar Reparto"
                                    >
                                      <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Slot Vacío */
                              <button
                                onClick={() => {
                                  if (isPastOrUnavailable) return;
                                  setFormHorario(formattedHour);
                                  setFormRepartidor(selectedRepartidorTab || '');
                                  setIsFormOpen(true);
                                  setFormError(null);
                                }}
                                disabled={isPastOrUnavailable}
                                className={`
                                  ${styles.emptySlotBtn}
                                  ${isPastOrUnavailable ? styles.emptySlotDisabled : styles.emptySlotActive}
                                `}
                              >
                                <span className={styles.emptySlotText}>
                                  {isPastOrUnavailable ? 'Horario no disponible (Pasado / Límite)' : 'Sin repartos programados'}
                                </span>
                                {!isPastOrUnavailable && (
                                  <span className={styles.emptySlotIcon}>
                                    add_circle
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()
                  : (
                    <div className={styles.emptyListState}>
                      <span className={styles.emptyListIcon}>touch_app</span>
                      Selecciona un repartidor en la barra superior para ver su agenda
                    </div>
                  )}
                </div>

                {/* Footer del Modal (Listado) */}
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
                </div>
              </>
            )}

            {/* CUERPO DEL MODAL (FORMULARIO CREACIÓN) */}
            {isFormOpen && (
              <form onSubmit={handleCrearReparto} className={styles.formContainer}>
                <div className={styles.formScroll}>
                  
                  {formError && (
                    <div className={styles.formError}>
                      <span className="material-symbols-outlined text-base">error</span>
                      {formError}
                    </div>
                  )}

                  <div className={styles.formGrid}>
                    {/* Vendedor */}
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Vendedor</label>
                      <select
                         value={formVendedor}
                         onChange={(e) => setFormVendedor(e.target.value)}
                         required
                         className={styles.formInput}
                         style={{ colorScheme: 'dark' }}
                       >
                        <option value="">Seleccionar Vendedor</option>
                        {formDataOptions.vendedores.map(vendedor => {
                          const rawName = vendedor.username ? vendedor.username : (vendedor.email || '');
                          const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : '';
                          const roleLabel = vendedor.role ? `[${vendedor.role}] ` : '';
                          return (
                            <option key={vendedor.id} value={vendedor.id}>
                              {roleLabel}{displayName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Stock disponible (IMEI) */}
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Equipo (IMEI)</label>
                      <select
                         value={formStockImei}
                         onChange={(e) => setFormStockImei(e.target.value)}
                         required
                         className={styles.formInput}
                         style={{ colorScheme: 'dark' }}
                       >
                        <option value="">Seleccionar de Stock</option>
                        {formDataOptions.stock.map(stock => (
                          <option key={stock.imei} value={stock.imei}>
                            {stock.productos?.marca} {stock.productos?.modelo} ({stock.productos?.color}, {stock.productos?.almacenamiento}) - IMEI: {stock.imei}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Repartidor */}
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Repartidor</label>
                      <select
                         value={formRepartidor}
                         onChange={(e) => {
                           setFormRepartidor(e.target.value);
                           setFormZona(''); // Resetear zona cuando cambia repartidor
                         }}
                         required
                         className={styles.formInput}
                         style={{ colorScheme: 'dark' }}
                       >
                        <option value="">Seleccionar Repartidor</option>
                        {repartidoresFiltradosLogistica.map(repartidor => (
                          <option key={repartidor.id} value={repartidor.id}>
                            {repartidor.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Zonas dinámicas según repartidor */}
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Zona asignada</label>
                      <select
                         value={formZona}
                         onChange={(e) => setFormZona(e.target.value)}
                         required
                         disabled={!formRepartidor}
                         className={styles.formInput}
                         style={{ colorScheme: 'dark' }}
                       >
                        <option value="">
                          {!formRepartidor ? 'Elige un repartidor primero' : 'Seleccionar Zona'}
                        </option>
                        {zonasFiltradas.map(zona => (
                          <option key={zona.id} value={zona.id}>
                            {zona.nombre_zona} ({zona.descripcion || 'Sin descripción'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Horario de entrega */}
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Horario de entrega</label>
                    <select
                      value={formHorario}
                      onChange={(e) => setFormHorario(e.target.value)}
                      required
                      className={styles.formInput}
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="">Seleccionar Hora</option>
                      {Array.from({ length: 13 }, (_, i) => {
                        const hour = i + 8;
                        const formattedHour = `${String(hour).padStart(2, '0')}:00`;
                        const rep = repartidoresFiltradosLogistica.find(r => r.id === formRepartidor);
                        const tz = rep?.zona_horaria || 'America/Mexico_City';
                        const driverNowString = new Date().toLocaleString('en-US', { timeZone: tz });
                        const driverNow = new Date(driverNowString);
                        const minAllowed = new Date(driverNow.getTime() + 60 * 60 * 1000);
                        const slotDate = new Date(year, month, selectedDay || 1, hour, 0);
                        const isPrivileged = userRole === 'Admin' || userRole === 'Developer' || userRole === 'Supervisor';
                        const isPastOrUnavailable = !isPrivileged && (slotDate < minAllowed);
                        return (
                          <option 
                            key={formattedHour} 
                            value={formattedHour} 
                            disabled={isPastOrUnavailable}
                            className={isPastOrUnavailable ? "text-slate-600 bg-slate-950" : "text-white bg-slate-950"}
                          >
                            {formattedHour} hs {isPastOrUnavailable ? "(No disponible)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Footer del Formulario */}
                <div className={styles.footer}>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setFormError(null);
                    }}
                    className={styles.footerCloseBtn}
                    disabled={actionLoading}
                  >
                    Volver al Listado
                  </button>
                  <button 
                    type="submit"
                    className={styles.footerCreateBtn}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Confirmar Reparto"
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
