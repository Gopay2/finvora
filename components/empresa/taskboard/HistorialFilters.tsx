'use client';

import React from 'react';

interface Perfil {
  id: string;
  username: string;
  role: string;
}

interface HistorialFiltersProps {
  buscar: string;
  setBuscar: (val: string) => void;
  filtroUsuario: string;
  setFiltroUsuario: (val: string) => void;
  setPaginaActual: (val: number) => void;
  perfiles: Perfil[];
}

export function HistorialFilters({
  buscar,
  setBuscar,
  filtroUsuario,
  setFiltroUsuario,
  setPaginaActual,
  perfiles
}: HistorialFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800 backdrop-blur-xl">
      {/* Buscador */}
      <div className="space-y-1.5 col-span-1 md:col-span-2">
        <label className="text-xs font-semibold text-slate-400">Buscar tarea</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={buscar}
            onChange={(e) => {
              setBuscar(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-base md:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all"
          />
        </div>
      </div>

      {/* Selector de Usuario */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400">Filtrar por Asignado</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-xl">
            filter_alt
          </span>
          <select
            value={filtroUsuario}
            onChange={(e) => {
              setFiltroUsuario(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-10 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary transition-all appearance-none"
          >
            <option value="">Todos los usuarios</option>
            {perfiles.map((perfil) => (
              <option key={perfil.id} value={perfil.id}>
                {perfil.username}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-base">
            keyboard_arrow_down
          </span>
        </div>
      </div>
    </div>
  );
}
