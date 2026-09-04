'use client';

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  requiredText?: string;
}

/**
 * Modal de confirmación genérico de Finvora.
 * Admite el parámetro opcional `requiredText` para exigir la escritura de una palabra clave (ej. "confirmar")
 * antes de habilitar la acción destructiva.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  requiredText
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConfirmInput("");
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const isTextMatch = !requiredText || confirmInput.trim().toLowerCase() === requiredText.trim().toLowerCase();

  const handleConfirm = () => {
    if (!isTextMatch) return;
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isTextMatch) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Icono de advertencia */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-5">
            <span className="material-symbols-outlined text-3xl sm:text-4xl">warning</span>
          </div>
          
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h2>
          
          {/* Mensaje */}
          <div className="w-full mb-4">
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed whitespace-normal break-words">
              {message}
            </p>
          </div>

          {/* Campo de texto requerido para confirmación estricta */}
          {requiredText && (
            <div className="w-full mb-5 text-left">
              <label className="block text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2 text-center">
                Escribe &quot;<span className="text-white font-mono lowercase">{requiredText}</span>&quot; para eliminar:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Escribe "${requiredText}"`}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/80 rounded-xl px-4 py-2.5 font-mono text-base sm:text-sm text-white text-center outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-slate-600"
              />
            </div>
          )}
          
          {/* Botones */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 sm:py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-700/60 transition-all text-xs sm:text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isTextMatch}
              className={`px-5 py-2.5 sm:py-3 font-bold rounded-xl transition-all text-xs sm:text-sm shadow-lg cursor-pointer ${
                isTextMatch
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                  : "bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50 shadow-none"
              }`}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
