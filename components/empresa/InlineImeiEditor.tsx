'use client';

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { actualizarImeiStock } from "@/app/empresa/webapp/stock/stock-actions";

interface InlineImeiEditorProps {
  imei: string;
  canEdit: boolean;
  onImeiUpdated?: (oldImei: string, newImei: string) => void;
}

/**
 * Componente cliente para editar el IMEI abriendo un modal emergente alineado con el diseño Finvora.
 * Utiliza createPortal para evitar desplazar la tabla al abrirse.
 */
export default function InlineImeiEditor({
  imei,
  canEdit,
  onImeiUpdated
}: InlineImeiEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentImei, setCurrentImei] = useState(imei);
  const [tempImei, setTempImei] = useState(imei);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentImei(imei);
    setTempImei(imei);
  }, [imei]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit || loading) return;
    setError(null);
    setTempImei(currentImei);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (loading) return;
    setIsEditing(false);
    setError(null);
    setTempImei(currentImei);
  };

  const handleSave = async () => {
    const trimmed = tempImei.trim();
    if (!trimmed) {
      setError("El IMEI no puede estar vacío.");
      return;
    }
    if (trimmed === currentImei) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await actualizarImeiStock(currentImei, trimmed);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.success && res.nuevoImei) {
      const oldVal = currentImei;
      setCurrentImei(res.nuevoImei);
      setIsEditing(false);
      if (onImeiUpdated) {
        onImeiUpdated(oldVal, res.nuevoImei);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const modalContent = isEditing && mounted ? createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleCancel}
    >
      <div
        className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary">
              <span className="material-symbols-outlined text-lg block">edit_square</span>
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">Editar IMEI del Equipo</h3>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl block">close</span>
          </button>
        </div>

        {/* Formulario */}
        <div className="space-y-4 pt-1">
          {/* IMEI Actual */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              IMEI Actual
            </label>
            <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 font-mono text-base sm:text-sm text-slate-400 select-none flex items-center h-[42px]">
              {currentImei}
            </div>
          </div>

          {/* Nuevo IMEI (sin icono de código de barras) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-secondary uppercase tracking-wider flex items-center justify-between">
              <span>Nuevo IMEI</span>
              <span className="text-[10px] text-slate-500 font-normal">Requerido</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={tempImei}
              onChange={(e) => setTempImei(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 focus:border-secondary/70 rounded-xl px-4 py-2.5 font-mono text-base sm:text-sm text-white outline-none focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-slate-600 h-[42px]"
              placeholder="Ingrese nuevo IMEI..."
            />
          </div>

          {/* Banner de Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Acciones Footer con estilo Finvora (bg-secondary) */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800/60">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-secondary hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-secondary/10 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full block" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* Botón interactivo de IMEI en la tabla */}
      {canEdit ? (
        <button
          type="button"
          onClick={handleStartEditing}
          className="bg-slate-950 hover:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 hover:border-blue-500/50 text-secondary text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer group leading-none"
          title="Haz clic para editar este IMEI"
        >
          <span className="text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider leading-none group-hover:text-blue-400 transition-colors">IMEI</span>
          <span className="font-mono leading-none relative top-0 sm:top-[1px]">{currentImei}</span>
        </button>
      ) : (
        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-secondary text-xs inline-flex items-center gap-1.5 shadow-sm leading-none">
          <span className="text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider leading-none">IMEI</span>
          <span className="font-mono leading-none relative top-0 sm:top-[1px]">{currentImei}</span>
        </span>
      )}

      {/* Modal vía Portal */}
      {modalContent}
    </>
  );
}
