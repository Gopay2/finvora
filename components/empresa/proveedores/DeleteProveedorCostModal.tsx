'use client';

import React from 'react';

interface DeleteProveedorCostModalProps {
  deleteModal: { id: string; name: string } | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProveedorCostModal({
  deleteModal,
  isDeleting,
  onClose,
  onConfirm
}: DeleteProveedorCostModalProps) {
  if (!deleteModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !isDeleting && onClose()}
      />
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/60 p-6 w-full max-w-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto">
          <span className="material-symbols-outlined text-red-400 text-2xl">delete</span>
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="text-slate-100 font-bold text-base">Eliminar asignación</h3>
          <p className="text-slate-400 text-sm">
            ¿Estás seguro de que querés quitar{" "}
            <span className="text-slate-200 font-semibold">{deleteModal.name}</span>{" "}
            de este proveedor?
          </p>
          <p className="text-slate-500 text-xs">Esta acción no se puede deshacer.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <span className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
            ) : (
              <span className="material-symbols-outlined text-base">delete</span>
            )}
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
