'use client';

import React from 'react';

interface RepartosCalendarHeaderProps {
  monthName: string;
  year: number;
  onToday: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function RepartosCalendarHeader({
  monthName,
  year,
  onToday,
  onPrevMonth,
  onNextMonth
}: RepartosCalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
      <h3 className="text-lg md:text-xl font-bold text-white capitalize tracking-wide">
        {monthName} <span className="text-secondary font-light ml-1">{year}</span>
      </h3>
      <div className="flex items-center gap-3">
        <button 
          onClick={onToday}
          className="px-3 h-8 flex items-center justify-center rounded-lg bg-secondary text-slate-950 hover:bg-secondary/90 transition-all border border-transparent text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
        >
          Hoy
        </button>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={onPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 cursor-pointer"
            title="Mes anterior"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button 
            onClick={onNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 cursor-pointer"
            title="Mes siguiente"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
