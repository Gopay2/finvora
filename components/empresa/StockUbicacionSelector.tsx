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

  const nombreActual = repartidores.find(repartidor => repartidor.id === ubicacion)?.nombre || "Sin Asignar";

  if (disabled) {
    return (
      <span className={`inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border min-w-[120px] text-center ${ubicacion
          ? "bg-blue-950/40 text-blue-400 border-blue-500/40"
          : "bg-slate-900/40 text-slate-400 border-slate-700/60"
        }`}>
        {nombreActual.toUpperCase()}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center" suppressHydrationWarning>
      {/* Chip visual perfectamente centrado y con padding simétrico */}
      <div
        className={`
          inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-all text-center select-none
          ${ubicacion
            ? "bg-blue-950/40 text-blue-400 border-blue-500/40 hover:border-blue-400/80"
            : "bg-slate-900/40 text-slate-400 border-slate-700/60 hover:border-slate-500"
          }
          ${loading ? 'opacity-50' : 'opacity-100'}
        `}
      >
        <span className="uppercase tracking-wider">{nombreActual.toUpperCase()}</span>
      </div>

      {/* Select invisible superpuesto para capturar clicks y abrir el menú nativo */}
      <select
        value={ubicacion}
        onChange={handleChange}
        disabled={loading}
        suppressHydrationWarning
        aria-label="Seleccionar ubicación"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer uppercase text-center text-xs"
        style={{
          colorScheme: 'dark',
          textAlign: 'center',
          textAlignLast: 'center',
          fontSize: '12px'
        }}
      >
        <option value="" className="bg-slate-950 text-slate-400 italic text-center text-xs" style={{ fontSize: '12px' }}>
          SIN ASIGNAR
        </option>
        {repartidores.map(repartidor => (
          <option key={repartidor.id} value={repartidor.id} className="bg-slate-950 text-white font-sans text-center text-xs" style={{ fontSize: '12px' }}>
            {repartidor.nombre.toUpperCase()}
          </option>
        ))}
      </select>

      {loading && (
        <span className="absolute -right-5 animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full" />
      )}

      {error && (
        <div className="absolute -bottom-5 left-0 w-max z-10">
          <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
