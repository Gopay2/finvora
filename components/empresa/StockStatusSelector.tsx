'use client';

import React, { useState, useRef, useEffect } from "react";
import { actualizarEstadoStock, registrarVenta } from "@/app/empresa/webapp/stock/stock-actions";

interface StockStatusSelectorProps {
  imei: string;
  estadoActual: string;
  disabled?: boolean;
}

export default function StockStatusSelector({ imei, estadoActual, disabled = false }: StockStatusSelectorProps) {
  const [estado, setEstado] = useState(estadoActual);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const colors: Record<string, string> = {
    Disponible: "bg-green-500/10 text-green-400 border-green-500/20",
    "En envío": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Vendido: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      ejecutarVentaDefinitiva();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft]);

  const ejecutarVentaDefinitiva = async () => {
    setLoading(true);
    const result = await registrarVenta(imei);
    if (result.error) {
      alert(result.error);
      setEstado(estadoActual);
      setTimeLeft(null);
    }
    setLoading(false);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    
    const nuevoEstado = e.target.value;
    
    if (nuevoEstado === "Vendido") {
      setEstado("Vendido");
      setTimeLeft(20);
      return;
    }

    if (timeLeft !== null) {
      setTimeLeft(null);
    }

    setLoading(true);
    const result = await actualizarEstadoStock(imei, nuevoEstado);
    if (result.success) {
      setEstado(nuevoEstado);
    } else {
      alert("Error al actualizar estado");
    }
    setLoading(false);
  };

  // Si está desactivado, mostramos un badge estático en lugar de un select
  if (disabled) {
    return (
      <div className={`
        inline-flex items-center justify-center px-4 h-6 min-w-[110px] rounded-lg text-[10px] font-bold uppercase border
        ${colors[estado] || colors.Disponible}
      `}>
        {estado}
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <select
          value={estado}
          onChange={handleChange}
          disabled={loading}
          className={`
            appearance-none cursor-pointer rounded-lg text-[10px] font-bold uppercase border transition-all
            ${colors[estado] || colors.Disponible}
            ${loading ? 'opacity-50' : 'opacity-100'}
            outline-none m-0 p-0 h-6 min-w-[110px] text-center
          `}
          style={{ 
            colorScheme: 'dark',
            textAlignLast: 'center',
            paddingLeft: '0',
            paddingRight: '0'
          }}
        >
          <option value="Disponible" className="bg-slate-950 text-white">Disponible</option>
          <option value="En envío" className="bg-slate-950 text-white">En envío</option>
          <option value="Vendido" className="bg-slate-950 text-white">Vendido</option>
        </select>
        
        {loading && !timeLeft && (
          <span className="absolute -right-6 animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full" />
        )}
      </div>

      {timeLeft !== null && (
        <div className="mt-1">
          <span className="text-[11px] text-red-400 font-black tracking-tighter animate-pulse uppercase">
            Confirmando en {timeLeft}...
          </span>
        </div>
      )}
    </div>
  );
}
