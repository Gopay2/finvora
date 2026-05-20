'use client';

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { actualizarEstadoStock, registrarVenta, getVendedores } from "@/app/empresa/webapp/stock/stock-actions";

interface StockStatusSelectorProps {
  imei: string;
  estadoActual: string;
  disabled?: boolean;
  vendedores?: Vendedor[];
}

interface Vendedor {
  id: string;
  username: string | null;
  role: string;
}

export default function StockStatusSelector({ imei, estadoActual, disabled = false, vendedores = [] }: StockStatusSelectorProps) {
  const [estado, setEstado] = useState(estadoActual);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [vendedoresList, setVendedoresList] = useState<Vendedor[]>(vendedores);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colors: Record<string, string> = {
    Disponible: "bg-green-500/10 text-green-400 border-green-500/20",
    "En envío": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Vendido: "bg-red-500/10 text-red-400 border-red-500/20",
    "A consultar": "bg-purple-500/10 text-purple-400 border-purple-500/20"
  };

  useEffect(() => {
    if (vendedores && vendedores.length > 0) {
      setVendedoresList(vendedores);
      return;
    }
    async function loadVendedores() {
      const data = await getVendedores();
      setVendedoresList(data as Vendedor[]);
    }
    loadVendedores();
  }, [vendedores]);

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
    const result = await registrarVenta(imei, vendedorSeleccionado || undefined);
    if (result.error) {
      setError(result.error);
      setEstado(estadoActual);
      setTimeLeft(null);
    }
    setLoading(false);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    
    const nuevoEstado = e.target.value;
    
    if (nuevoEstado === "Vendido") {
      setError(null);
      setShowSellerModal(true);
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
      setError("Error al actualizar estado");
      // Desaparecer error después de 3 segundos
      setTimeout(() => setError(null), 3000);
    }
    setLoading(false);
  };

  const handleConfirmVenta = () => {
    if (!vendedorSeleccionado) {
      setError("Debes seleccionar quién realizó la venta");
      return;
    }
    setError(null);
    setShowSellerModal(false);
    setEstado("Vendido");
    setTimeLeft(20);
  };

  const handleCancelVenta = () => {
    setError(null);
    setShowSellerModal(false);
    setEstado(estadoActual);
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
          <option value="A consultar" className="bg-slate-950 text-white">A consultar</option>
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

      {error && !showSellerModal && (
        <div className="absolute -bottom-6 w-max">
          <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            {error}
          </span>
        </div>
      )}

      {/* Modal de Selección de Vendedor - Usando Portal para evitar recortes de la tabla */}
      {showSellerModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-secondary text-4xl">person_search</span>
              <h3 className="text-lg font-bold text-white">¿Quién realizó la venta?</h3>
              <p className="text-slate-400 text-sm">Selecciona al vendedor para registrar la venta correctamente.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Vendedor</label>
              <select 
                value={vendedorSeleccionado}
                onChange={(e) => {
                  setVendedorSeleccionado(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-slate-100 focus:outline-none transition-all appearance-none cursor-pointer ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-secondary'}`}
                style={{ colorScheme: 'dark' }}
              >
                <option value="">Elegir vendedor...</option>
                {vendedoresList.map(v => {
                  const name = v.username || 'Sin nombre';
                  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
                  return (
                    <option key={v.id} value={v.id}>
                      {v.role ? `[${v.role}]` : "[Closer]"} {capitalizedName}
                    </option>
                  );
                })}
              </select>
              
              {error && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1 animate-in fade-in slide-in-from-top-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleCancelVenta}
                className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-all text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmVenta}
                className="flex-1 px-4 py-2.5 bg-secondary text-slate-950 rounded-xl font-bold hover:bg-white transition-all text-sm shadow-lg shadow-secondary/20 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
