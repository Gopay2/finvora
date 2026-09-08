import React from 'react';
import { PROVEEDORES } from '@/utils/recibo';

interface ProveedorSelectorProps {
  selectedProveedor: string;
  onSelectProveedor: (proveedorLabel: string) => void;
}

export default function ProveedorSelector({
  selectedProveedor,
  onSelectProveedor,
}: ProveedorSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-base font-semibold text-slate-200 ml-0.5">
        Selecciona el área del proveedor
      </label>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {PROVEEDORES.map((proveedor) => {
          const isActive = selectedProveedor === proveedor.label;
          return (
            <button
              key={proveedor.label}
              type="button"
              onClick={() => onSelectProveedor(proveedor.label)}
              className={`px-3.5 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-secondary border-secondary text-slate-950'
                  : 'bg-[#0a1120] border-[#16233a] text-slate-300 hover:border-slate-700 hover:text-white hover:bg-[#0f192d]'
              }`}
            >
              {proveedor.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
