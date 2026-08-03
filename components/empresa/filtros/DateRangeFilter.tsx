'use client';

import React from 'react';

interface DateRangeFilterProps {
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  label?: string;
  onClear?: () => void;
  showClearButton?: boolean;
}

export function DateRangeFilter({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  label = "Fechas:",
  onClear,
  showClearButton = false
}: DateRangeFilterProps) {
  const dateInputStyle = "h-10 px-4 w-44 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-secondary transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer text-transparent text-center text-base md:text-sm font-semibold";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {label && (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-base">calendar_month</span>
          <span className="text-slate-300 font-semibold text-sm">{label}</span>
        </div>
      )}

      {/* Desde */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <label className="text-xs sm:text-sm text-slate-400 font-semibold min-w-[50px] sm:min-w-0 shrink-0">Desde:</label>
        <div className="relative flex items-center flex-1 sm:flex-initial">
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            onKeyDown={(event) => event.preventDefault()}
            onClick={(event) => {
              try {
                event.currentTarget.showPicker();
              } catch {}
            }}
            className={dateInputStyle}
            style={{ colorScheme: 'dark' }}
            suppressHydrationWarning
          />
          <span className={`absolute inset-0 flex items-center justify-center text-xs md:text-sm font-semibold pointer-events-none select-none ${dateFrom ? 'text-slate-200' : 'text-slate-400'}`}>
            {dateFrom ? dateFrom.split('-').reverse().join('/') : 'dd/mm/aaaa'}
          </span>
        </div>
      </div>

      {/* Hasta */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <label className="text-xs sm:text-sm text-slate-400 font-semibold min-w-[50px] sm:min-w-0 shrink-0">Hasta:</label>
        <div className="relative flex items-center flex-1 sm:flex-initial">
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            onKeyDown={(event) => event.preventDefault()}
            onClick={(event) => {
              try {
                event.currentTarget.showPicker();
              } catch {}
            }}
            className={dateInputStyle}
            style={{ colorScheme: 'dark' }}
            suppressHydrationWarning
          />
          <span className={`absolute inset-0 flex items-center justify-center text-xs md:text-sm font-semibold pointer-events-none select-none ${dateTo ? 'text-slate-200' : 'text-slate-400'}`}>
            {dateTo ? dateTo.split('-').reverse().join('/') : 'dd/mm/aaaa'}
          </span>
        </div>
      </div>

      {showClearButton && (dateFrom || dateTo) && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
        >
          Limpiar Fechas
        </button>
      )}
    </div>
  );
}
