'use client';

import React from 'react';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface RepartosCalendarGridProps {
  year: number;
  month: number;
  blanks: number[];
  days: number[];
  repartos: any[];
  isToday: (day: number) => boolean;
  onSelectDay: (day: number) => void;
}

export function RepartosCalendarGrid({
  year,
  month,
  blanks,
  days,
  repartos,
  isToday,
  onSelectDay
}: RepartosCalendarGridProps) {
  const styles = {
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
  };

  return (
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
          <div key={`blank-${b}`} className={styles.blankCell} />
        ))}
        {days.map((day) => {
          const todayFlag = isToday(day);
          const formattedDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const repartosDelDia = repartos.filter(reparto => reparto.fecha_reparto === formattedDayStr);

          return (
            <div 
              key={`day-${day}`} 
              onClick={() => onSelectDay(day)}
              className={`
                ${styles.dayCell}
                ${todayFlag ? styles.dayCellToday : styles.dayCellDefault}
              `}
            >
              {todayFlag && <div className={styles.todayGlow} />}

              <div className={styles.cellHeader}>
                <span className={`
                  ${styles.cellNumber}
                  ${todayFlag ? styles.cellNumberToday : styles.cellNumberDefault}
                `}>
                  {day}
                </span>
                
                {repartosDelDia.length > 0 && (
                  <span className={styles.badgeCount}>
                    {repartosDelDia.length}
                  </span>
                )}
              </div>

              <div className={styles.cellContent}>
                {/* Mobile View */}
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

                {/* Desktop View */}
                <div className="hidden md:flex flex-col space-y-0.5">
                  {repartosDelDia.slice(0, 2).map((rep) => {
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
  );
}
