'use client';

import React, { useState } from "react";
import { actualizarZonaStock } from "@/app/empresa/webapp/stock/stock-actions";

interface RepartidorOption {
  id: string;
  nombre: string;
}

interface StockUbicacionSelectorProps {
  imei: string;
  ubicacionActual: string | null;
  repartidores: RepartidorOption[];
  disabled?: boolean;
}

export default function StockUbicacionSelector({
  imei,
  ubicacionActual,
  repartidores,
  disabled = false
}: StockUbicacionSelectorProps) {
  const [ubicacion, setUbicacion] = useState(ubicacionActual || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;

    const nuevaUbicacion = e.target.value;
    setLoading(true);
    setError(null);

    const result = await actualizarZonaStock(imei, nuevaUbicacion === "" ? null : nuevaUbicacion);

    if (result.success) {
      setUbicacion(nuevaUbicacion);
    } else {
      setError("Error");
      setTimeout(() => setError(null), 2000);
    }
    setLoading(false);
  };

  const nombreActual = repartidores.find(r => r.id === ubicacion)?.nombre || "Sin Asignar";

  if (disabled) {
    return (
      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${
        ubicacion 
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
          : "bg-slate-800 text-slate-500 border-slate-700/50"
      }`}>
        {nombreActual}
      </span>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <select
          value={ubicacion}
          onChange={handleChange}
          disabled={loading}
          className={`
            appearance-none cursor-pointer rounded-lg text-[10px] font-bold uppercase border transition-all
            ${ubicacion 
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
              : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300"
            }
            ${loading ? 'opacity-50' : 'opacity-100'}
            outline-none m-0 p-0 h-6 min-w-[145px] text-center
          `}
          style={{ 
            colorScheme: 'dark',
            textAlignLast: 'center',
            paddingLeft: '4px',
            paddingRight: '4px'
          }}
        >
          <option value="" className="bg-slate-950 text-slate-500 italic">Sin Asignar</option>
          {repartidores.map(r => (
            <option key={r.id} value={r.id} className="bg-slate-950 text-white">
              {r.nombre}
            </option>
          ))}
        </select>
        
        {loading && (
          <span className="absolute -right-6 animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full" />
        )}
      </div>

      {error && (
        <div className="absolute -bottom-6 w-max">
          <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
