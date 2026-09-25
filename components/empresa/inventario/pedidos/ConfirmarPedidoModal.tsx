'use client';

import React from 'react';
import type { PedidoItemInput } from '@/types/pedidos-stock';

interface ConfirmarPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  zona: string;
  items: PedidoItemInput[];
  onUpdateCantidad: (productoId: string, delta: number) => void;
  onRemoveItem: (productoId: string) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function ConfirmarPedidoModal({
  isOpen,
  onClose,
  zona,
  items,
  onUpdateCantidad,
  onRemoveItem,
  onConfirm,
  isSubmitting,
}: ConfirmarPedidoModalProps) {
  if (!isOpen) return null;

  const totalEquipos = items.reduce((acc, it) => acc + it.cantidad, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl">checklist_rtl</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">Revisar Pedido</h3>
              <p className="text-xs text-slate-400 truncate">
                Destino: <span className="text-secondary font-semibold">{zona}</span> • {totalEquipos} equipo(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Listado con scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-3 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <span className="material-symbols-outlined text-3xl mb-2 block opacity-40">remove_shopping_cart</span>
              No hay equipos seleccionados en este pedido.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.producto_id}
                className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all"
              >
                {/* Info del producto */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-secondary">
                      {item.marca}
                    </span>
                    <span className="text-sm font-bold text-slate-100 truncate">
                      {item.modelo}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {item.almacenamiento && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                        {item.almacenamiento}
                      </span>
                    )}
                    {item.ram && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                        RAM {item.ram}
                      </span>
                    )}
                    {item.color && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800/60 border border-slate-700/40">
                        {item.color}
                      </span>
                    )}
                  </div>
                </div>

                {/* Controles táctiles compactos */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => onUpdateCantidad(item.producto_id, -1)}
                      disabled={isSubmitting}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center font-bold text-base transition-colors cursor-pointer disabled:opacity-50"
                      title="Disminuir"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-black text-white text-sm">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateCantidad(item.producto_id, 1)}
                      disabled={isSubmitting}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center font-bold text-base transition-colors cursor-pointer disabled:opacity-50"
                      title="Aumentar"
                    >
                      +
                    </button>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.producto_id)}
                    disabled={isSubmitting}
                    className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                    title="Eliminar de este pedido"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie y acciones */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Total a registrar: <span className="font-bold text-white text-sm">{totalEquipos} unidades</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting || items.length === 0 || totalEquipos === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-slate-950 hover:bg-secondary/90 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-secondary/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Confirmar Pedido</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
