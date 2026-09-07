'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ManualImeiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imei: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ManualImeiModal({
  isOpen,
  onClose,
  onSubmit,
}: ManualImeiModalProps) {
  const [mounted, setMounted] = useState(false);
  const [imei, setImei] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Auto-enfoque y reseteo al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setImei('');
      setError('');
      setIsSubmitting(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanImei = imei.trim();
    if (!cleanImei) {
      setError('Por favor, ingresa el IMEI del equipo.');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit(cleanImei);
      if (res.success) {
        setImei('');
        onClose();
      } else if (res.error) {
        setError(res.error);
        inputRef.current?.focus();
      }
    } catch {
      setError('Ocurrió un error inesperado al registrar el equipo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Encabezado estándar de la web de Finvora */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl block">
                keyboard
              </span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
                Ingreso manual
              </h3>
              <p className="text-xs text-slate-400">
                Ingresa el IMEI del equipo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl block">close</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 bg-slate-900" autoComplete="off">
          <div className="space-y-2">
            <label
              htmlFor="manual-imei-input"
              className="block text-xs font-semibold text-slate-300 ml-0.5 tracking-wider uppercase"
            >
              IMEI
            </label>
            <div className="relative">
              <input
                id="manual-imei-input"
                ref={inputRef}
                type="text"
                value={imei}
                onChange={(e) => {
                  setImei(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ingresar IMEI"
                required
                autoComplete="off"
                data-lpignore="true"
                disabled={isSubmitting}
                /* font-size: 16px estricto para evitar zoom automático en Safari iOS y Chrome móvil */
                style={{ fontSize: '16px' }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-secondary rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all font-mono tracking-wider text-base h-12"
              />
              {imei && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => {
                    setImei('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 transition-colors cursor-pointer"
                  title="Borrar"
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Alerta de error si falla */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Botón de acción */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !imei.trim()}
              className="w-full py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-secondary/10 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </span>
              ) : (
                <span>Registrar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
