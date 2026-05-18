'use client';

import React, { useState } from 'react';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function RepartosCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Hoy
  const today = new Date();
  const isToday = (d: number) => {
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  };

  // Arreglo para los casilleros vacíos antes del día 1
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  // Arreglo con los días del mes
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <div className="flex flex-col h-full w-full min-h-[600px]">
      {/* Header (Controles) */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
        <h3 className="text-xl md:text-3xl font-black text-white capitalize tracking-wide">
          {monthNames[month]} <span className="text-secondary font-light ml-1">{year}</span>
        </h3>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 h-10 flex items-center justify-center rounded-xl bg-secondary text-slate-950 hover:bg-secondary/90 transition-all border border-transparent text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            Hoy
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={prevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button 
              onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grilla del Calendario */}
      <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] overflow-hidden">
        {/* Cabecera de días de la semana */}
        <div className="col-span-7 grid grid-cols-7 border-b border-slate-800 bg-slate-900/40">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Cuerpo del calendario (filas que ocupan el espacio sobrante) */}
        <div className="col-span-7 grid grid-cols-7 auto-rows-fr h-full">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="border-r border-b border-slate-800/50 bg-slate-950/20 p-2 opacity-50">
            </div>
          ))}
          {days.map((d) => {
            const todayFlag = isToday(d);
            return (
              <div 
                key={`day-${d}`} 
                className={`
                  border-r border-b border-slate-800/50 p-3 flex flex-col transition-all group relative
                  ${todayFlag ? 'bg-secondary/5 z-10' : 'bg-transparent hover:bg-slate-800/30'}
                `}
              >
                {/* Borde flúor y resplandor para el cuadrado completo */}
                {todayFlag && (
                  <div className="absolute inset-0 border-2 border-secondary shadow-[0_0_20px_rgba(16,185,129,0.4),inset_0_0_20px_rgba(16,185,129,0.15)] pointer-events-none" />
                )}

                <div className="flex items-start justify-between relative z-10">
                  <span className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all
                    ${todayFlag 
                      ? 'text-secondary font-black text-base' 
                      : 'text-slate-400 group-hover:text-white'}
                  `}>
                    {d}
                  </span>
                  
                  {/* Espacio reservado para el futuro: insignias de cantidad de envíos */}
                  {/* <span className="mt-1 mr-1 text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    2
                  </span> */}
                </div>

                {/* Área de contenido para inyectar los repartos a futuro */}
                <div className="flex-1 mt-3 overflow-y-auto space-y-2 relative z-10">
                   {/* Tarjetitas de repartos irán acá */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
