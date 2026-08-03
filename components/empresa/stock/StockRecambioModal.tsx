'use client';

import React from 'react';
import { createPortal } from 'react-dom';

interface Vendedor {
  id: string;
  username: string | null;
  role: string;
}

interface StockRecambioModalProps {
  showRecambioModal: boolean;
  mounted: boolean;
  solicitadoPor: string;
  setSolicitadoPor: (val: string) => void;
  motivoRecambio: string;
  setMotivoRecambio: (val: string) => void;
  vendedoresList: Vendedor[];
  error: string | null;
  setError: (err: string | null) => void;
  handleCancelRecambio: () => void;
  handleConfirmRecambio: () => void;
}

export function StockRecambioModal({
  showRecambioModal,
  mounted,
  solicitadoPor,
  setSolicitadoPor,
  motivoRecambio,
  setMotivoRecambio,
  vendedoresList,
  error,
  setError,
  handleCancelRecambio,
  handleConfirmRecambio
}: StockRecambioModalProps) {
  if (!showRecambioModal || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in duration-200">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-secondary text-4xl">published_with_changes</span>
          <h3 className="text-lg font-bold text-white">Registrar Recambio</h3>
          <p className="text-slate-400 text-sm">Completa los datos para registrar la garantía del equipo.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Solicitado por</label>
            <select 
              value={solicitadoPor}
              onChange={(e) => {
                setSolicitadoPor(e.target.value);
                if (error) setError(null);
              }}
              className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-slate-100 focus:outline-none transition-all appearance-none cursor-pointer ${error && !solicitadoPor ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-secondary'}`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="">Elegir solicitante...</option>
              {vendedoresList.map(vendedor => {
                const name = vendedor.username || 'Sin nombre';
                const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
                return (
                  <option key={vendedor.id} value={vendedor.id}>
                    {vendedor.role ? `[${vendedor.role}]` : "[Closer]"} {capitalizedName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Motivo del Recambio</label>
            <textarea 
              value={motivoRecambio}
              onChange={(e) => {
                setMotivoRecambio(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Describa el motivo detalladamente..."
              className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-slate-100 focus:outline-none transition-all min-h-[100px] resize-none ${error && !motivoRecambio.trim() ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-secondary'}`}
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1 animate-in fade-in slide-in-from-top-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={handleCancelRecambio}
            className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-all text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirmRecambio}
            className="flex-1 px-4 py-2.5 bg-secondary text-slate-950 rounded-xl font-bold hover:bg-white transition-all text-sm shadow-lg shadow-secondary/20 cursor-pointer"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
