import React from 'react';
import type { TipoEquipo } from '@/types/recibo';

interface TipoEquipoSelectorProps {
  selectedTipoEquipo: TipoEquipo;
  onSelectTipoEquipo: (tipo: TipoEquipo) => void;
}

const OPCIONES_TIPO_EQUIPO: Array<{
  id: TipoEquipo;
  titulo: string;
  descripcion: string;
}> = [
  {
    id: 'credito',
    titulo: 'Equipos a crédito',
    descripcion: 'Equipos destinados a ventas a crédito.',
  },
  {
    id: 'concesion',
    titulo: 'Equipos concesión',
    descripcion: 'Equipos para ventas de concesión.',
  },
];

export default function TipoEquipoSelector({
  selectedTipoEquipo,
  onSelectTipoEquipo,
}: TipoEquipoSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-base font-semibold text-slate-200 ml-0.5">
        Tipo de equipos
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OPCIONES_TIPO_EQUIPO.map((opcion) => {
          const isSelected = selectedTipoEquipo === opcion.id;
          return (
            <div
              key={opcion.id}
              onClick={() => onSelectTipoEquipo(opcion.id)}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-secondary/15 border-secondary/70 shadow-lg shadow-secondary/10'
                  : 'bg-[#060b18] border-[#16233a] hover:border-slate-700 hover:bg-[#0a1120]'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-secondary text-slate-950 shadow-md'
                    : 'bg-[#0c1424] text-slate-400 border border-[#1c2a44]'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">smartphone</span>
              </div>
              <div className="space-y-1">
                <h4
                  className={`text-base font-bold ${
                    isSelected ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  {opcion.titulo}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {opcion.descripcion}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
