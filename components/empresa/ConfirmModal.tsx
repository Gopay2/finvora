'use client';

import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Icono de advertencia */}
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          
          {/* Contenedor de mensaje con ancho controlado y salto de línea forzado */}
          <div className="w-full">
            <p className="text-slate-400 text-sm leading-relaxed whitespace-normal break-words">
              {message}
            </p>
          </div>
          
          {/* Botones en paralelo (vuelven a su sitio) */}
          <div className="grid grid-cols-2 gap-4 w-full mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all text-sm shadow-lg shadow-red-500/20 cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
