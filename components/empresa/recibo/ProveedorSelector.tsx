import React from 'react';
import { PROVEEDORES } from '@/utils/recibo';

interface ProveedorSelectorProps {
  selectedArea?: string;
  selectedProveedor?: string;
  onSelectAreaProveedor?: (area: string, proveedor: string) => void;
  // Compatibilidad hacia atrás si algún componente aún envía onSelectProveedor
  onSelectProveedor?: (proveedorLabel: string) => void;
}

export default function ProveedorSelector({
  selectedArea,
  selectedProveedor,
  onSelectAreaProveedor,
  onSelectProveedor,
}: ProveedorSelectorProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <label className="block text-sm sm:text-lg font-medium text-slate-200 ml-0.5 tracking-wide">
        Selecciona el área del proveedor
      </label>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl">
        {PROVEEDORES.map((opcion) => {
          const isActive = selectedArea
            ? selectedArea === opcion.area
            : (selectedProveedor === opcion.area || selectedProveedor === opcion.proveedor || selectedProveedor === opcion.label);

          return (
            <button
              key={opcion.area}
              type="button"
              onClick={() => {
                if (onSelectAreaProveedor) {
                  onSelectAreaProveedor(opcion.area, opcion.proveedor);
                } else if (onSelectProveedor) {
                  onSelectProveedor(opcion.area);
                }
              }}
              className={`flex flex-col items-center justify-center px-1.5 sm:px-6 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer min-w-0 ${
                isActive
                  ? 'bg-secondary border-secondary text-slate-950 shadow-lg shadow-secondary/15'
                  : 'bg-[#060b18] hover:bg-[#0c1424] border-[#14243d] hover:border-slate-700/80 text-white shadow-md'
              }`}
            >
              {/* Área del Proveedor (Ciudad) */}
              <span
                className={`text-[11px] sm:text-lg tracking-tight sm:tracking-wide leading-tight truncate max-w-full text-center ${
                  isActive ? 'text-slate-950 font-semibold' : 'text-white font-normal'
                }`}
              >
                {opcion.area}
              </span>

              {/* Línea divisoria */}
              <div
                className={`w-full border-t my-1 sm:my-2 transition-colors ${
                  isActive ? 'border-slate-950/20' : 'border-[#14243d]'
                }`}
              />

              {/* Proveedor */}
              <span
                className={`text-[10px] sm:text-sm tracking-tight sm:tracking-wide leading-tight truncate max-w-full text-center ${
                  isActive ? 'text-slate-950 font-bold' : 'text-secondary font-medium'
                }`}
              >
                {opcion.proveedor}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
