'use client';

import React from 'react';
import type { MappedUser } from '@/types/sueldos';

interface SueldosFiltrosProps {
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  usersList: MappedUser[];
  comisionPercent: number;
  setComisionPercent: (percent: number) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  handleClearFilters: () => void;
  isRepartidorSelected: boolean;
  plataformaInput: string;
  setPlataformaInput: (val: string) => void;
  entregaInput: string;
  setEntregaInput: (val: string) => void;
  activeRowId: string | null;
  rowEntregaOverrides: { [id: string]: string };
  setRowEntregaOverrides: React.Dispatch<React.SetStateAction<{ [id: string]: string }>>;
  publicidadInput: string;
  setPublicidadInput: (val: string) => void;
  bonoInput: string;
  setBonoInput: (val: string) => void;
  sueldoInput: string;
  setSueldoInput: (val: string) => void;
  plataformaVal: number;
  entregaVal: number;
}

export function SueldosFiltros({
  selectedUserId,
  setSelectedUserId,
  usersList,
  comisionPercent,
  setComisionPercent,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  handleClearFilters,
  isRepartidorSelected,
  plataformaInput,
  setPlataformaInput,
  entregaInput,
  setEntregaInput,
  activeRowId,
  rowEntregaOverrides,
  setRowEntregaOverrides,
  publicidadInput,
  setPublicidadInput,
  bonoInput,
  setBonoInput,
  sueldoInput,
  setSueldoInput,
  plataformaVal,
  entregaVal
}: SueldosFiltrosProps) {
  const styles = {
    dateInput: "w-full sm:w-[130px] bg-slate-950 border border-slate-800 rounded-lg px-3 h-[44px] sm:h-[34px] text-[16px] sm:text-xs text-center focus:outline-none focus:border-secondary transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
    btnClearFilters: "px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
    btnClearFiltersMobile: "w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
  };

  const hasActiveFilters = selectedUserId !== "" || dateFrom || dateTo || plataformaVal !== 500 || entregaVal !== 500 || comisionPercent !== 50 || bonoInput !== "0" || sueldoInput !== "0" || publicidadInput !== "0";

  return (
    <div className="bg-slate-900/50 p-6 border-b border-slate-800/60 flex flex-col gap-6 text-sm">
      {/* Fila 1: Empleado y Comisión */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-slate-400 text-base">person</span>
            <span className="text-slate-300 font-semibold text-sm">Empleado:</span>
          </div>
          <div className="relative flex items-center w-40 sm:w-72 shrink-0">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2 text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all cursor-pointer h-[38px] w-full appearance-none"
              style={{ colorScheme: 'dark' }}
              suppressHydrationWarning
            >
              <option value="">Elegir...</option>
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username.charAt(0).toUpperCase() + user.username.slice(1)} ({user.role})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 pointer-events-none text-slate-500 text-base">
              keyboard_arrow_down
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto lg:justify-end">
          <span className="text-slate-300 font-semibold text-sm shrink-0">Comisión Empleado:</span>
          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl gap-1">
            {[50, 80].map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => setComisionPercent(percent)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  comisionPercent === percent
                    ? "bg-secondary text-slate-950"
                    : "bg-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fila 2: Fechas */}
      <div className="flex flex-col lg:flex-row gap-6 pb-6 border-b border-slate-800/40 lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 min-w-[80px]">
            <span className="material-symbols-outlined text-slate-400 text-base">calendar_month</span>
            <span className="text-slate-300 font-semibold text-sm">Fechas:</span>
          </div>
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
                  } catch (error) { }
                }}
                className={`${styles.dateInput} ${dateFrom ? "text-slate-200" : "text-transparent"}`}
                style={{ colorScheme: 'dark' }}
                suppressHydrationWarning
              />
              {!dateFrom && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
                  dd/mm/aaaa
                </span>
              )}
            </div>
          </div>
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
                  } catch (error) { }
                }}
                className={`${styles.dateInput} ${dateTo ? "text-slate-200" : "text-transparent"}`}
                style={{ colorScheme: 'dark' }}
                suppressHydrationWarning
              />
              {!dateTo && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
                  dd/mm/aaaa
                </span>
              )}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="hidden lg:flex items-center gap-3 justify-end w-full lg:w-auto md:mb-1">
            <button
              type="button"
              onClick={handleClearFilters}
              className={styles.btnClearFilters}
            >
              Limpiar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Fila 3: Ajustes de Costos e Ingresos */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-6">
        {/* Plataforma */}
        <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
          <span className="text-slate-300 font-semibold text-sm shrink-0">Plataforma:</span>
          <div className="relative flex items-center w-full sm:w-32">
            <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">-</span>
            <input
              type="text"
              inputMode="numeric"
              value={isRepartidorSelected ? "0" : plataformaInput}
              disabled={isRepartidorSelected}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*$/.test(val)) {
                  setPlataformaInput(val);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all h-[38px] w-full text-center disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-900"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Entrega */}
        <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
          <span className="text-slate-300 font-semibold text-sm shrink-0">Entrega:</span>
          <div className="relative flex items-center w-full sm:w-32">
            <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">{isRepartidorSelected ? "$" : "-"}</span>
            <input
              type="text"
              inputMode="numeric"
              value={
                activeRowId !== null
                  ? (rowEntregaOverrides[activeRowId] !== undefined ? rowEntregaOverrides[activeRowId] : entregaInput)
                  : entregaInput
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*$/.test(val)) {
                  if (activeRowId !== null) {
                    setRowEntregaOverrides((prev) => ({ ...prev, [activeRowId]: val }));
                  } else {
                    setEntregaInput(val);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  e.currentTarget.blur();
                }
              }}
              className={`bg-slate-950 border rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] transition-all h-[38px] w-full text-center ${
                activeRowId
                  ? "border-secondary shadow-[0_0_10px_rgba(224,242,254,0.15)] text-secondary font-bold"
                  : "border-slate-800 text-slate-200 focus:border-secondary"
              }`}
              placeholder={activeRowId ? "Fila activa..." : "General..."}
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Publicidad */}
        <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
          <span className="text-slate-300 font-semibold text-sm shrink-0">Publicidad:</span>
          <div className="relative flex items-center w-full sm:w-32">
            <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">-</span>
            <input
              type="text"
              inputMode="numeric"
              value={isRepartidorSelected ? "0" : publicidadInput}
              disabled={isRepartidorSelected}
              onFocus={() => { if (publicidadInput === "0") setPublicidadInput(""); }}
              onBlur={() => { if (publicidadInput === "") setPublicidadInput("0"); }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*$/.test(val)) {
                  setPublicidadInput(val);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all h-[38px] w-full text-center disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-900"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Bono */}
        <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
          <span className="text-slate-300 font-semibold text-sm shrink-0">Bono:</span>
          <div className="relative flex items-center w-full sm:w-32">
            <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={bonoInput}
              onFocus={() => { if (bonoInput === "0") setBonoInput(""); }}
              onBlur={() => { if (bonoInput === "") setBonoInput("0"); }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*$/.test(val)) {
                  setBonoInput(val);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all h-[38px] w-full text-center"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Sueldo */}
        <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
          <span className="text-slate-300 font-semibold text-sm shrink-0">Sueldo:</span>
          <div className="relative flex items-center w-full sm:w-32">
            <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={sueldoInput}
              onFocus={() => { if (sueldoInput === "0") setSueldoInput(""); }}
              onBlur={() => { if (sueldoInput === "") setSueldoInput("0"); }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*$/.test(val)) {
                  setSueldoInput(val);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all h-[38px] w-full text-center"
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex lg:hidden items-center justify-start w-full mt-2">
          <button
            type="button"
            onClick={handleClearFilters}
            className={styles.btnClearFiltersMobile}
          >
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
