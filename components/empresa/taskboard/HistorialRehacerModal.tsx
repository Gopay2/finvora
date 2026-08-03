'use client';

import React from 'react';
import type { TareaTerminada } from './HistorialTable';

interface HistorialRehacerModalProps {
  tareaARehacer: TareaTerminada | null;
  setTareaARehacer: (tarea: TareaTerminada | null) => void;
  nuevaDescripcionRehacer: string;
  setNuevaDescripcionRehacer: (val: string) => void;
  handleConfirmarRehacer: (e: React.FormEvent) => void;
}

export function HistorialRehacerModal({
  tareaARehacer,
  setTareaARehacer,
  nuevaDescripcionRehacer,
  setNuevaDescripcionRehacer,
  handleConfirmarRehacer
}: HistorialRehacerModalProps) {
  if (!tareaARehacer) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-6 border-b border-slate-850">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">settings_backup_restore</span>
            Rehacer Tarea
          </h3>
          <button
            onClick={() => setTareaARehacer(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleConfirmarRehacer} className="p-6 space-y-4">
          <div className="space-y-1.5 text-left">
            <div className="text-sm font-semibold text-slate-200">
              Tarea: <span className="text-slate-400 font-normal">{tareaARehacer.titulo}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-400">Editar Descripción (Opcional)</label>
            <textarea
              placeholder="Detalles sobre lo que se necesita hacer..."
              value={nuevaDescripcionRehacer}
              onChange={(e) => setNuevaDescripcionRehacer(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all resize-none custom-scrollbar"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-3 border-t border-slate-850 mt-6">
            <button
              type="button"
              onClick={() => setTareaARehacer(null)}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-secondary/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Rehacer Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
