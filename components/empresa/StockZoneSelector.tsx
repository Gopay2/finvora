'use client';

import React, { useState } from "react";
import { actualizarZonaStock } from "@/app/empresa/webapp/stock/stock-actions";

interface StockZoneSelectorProps {
  imei: string;
  zonaActual: string;
  disabled?: boolean;
}

export default function StockZoneSelector({ imei, zonaActual, disabled = false }: StockZoneSelectorProps) {
  const [zona, setZona] = useState(zonaActual);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zones = [
    "Repartidor Angel",
    "Repartidor Felix",
    "Repartidor Eleazar",
    "Repartidor Humberto",
    "Repartidor JR (CT)",
    "Repartidor Hector (CT)",
    "Local Fusion Tech",
    "Local Rosarito",
    "Local CyM 1",
    "Local CyM 2",
    "Local Olgin",
    "Monterrey",
    "Cambaceo Victor",
    "Cambaceo Esteban",
    "Proveedor Android"
  ];

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    
    const nuevaZona = e.target.value;
    setLoading(true);
    setError(null);

    const result = await actualizarZonaStock(imei, nuevaZona);
    
    if (result.success) {
      setZona(nuevaZona);
    } else {
      setError("Error");
      setTimeout(() => setError(null), 2000);
    }
    setLoading(false);
  };

  if (disabled) {
    return (
      <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
        {zona}
      </span>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <select
          value={zona}
          onChange={handleChange}
          disabled={loading}
          className={`
            appearance-none cursor-pointer rounded-lg text-[10px] font-bold uppercase border transition-all
            bg-blue-500/10 text-blue-400 border-blue-500/20
            ${loading ? 'opacity-50' : 'opacity-100'}
            outline-none m-0 p-0 h-6 min-w-[140px] text-center
          `}
          style={{ 
            colorScheme: 'dark',
            textAlignLast: 'center',
            paddingLeft: '0',
            paddingRight: '0'
          }}
        >
          {zones.map(z => (
            <option key={z} value={z} className="bg-slate-950 text-white">
              {z}
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
