'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import type { UltimoPedidoResumen } from '@/types/pedidos-stock';

interface ResumenPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumen: UltimoPedidoResumen | null;
}

export default function ResumenPedidoModal({
  isOpen,
  onClose,
  resumen,
}: ResumenPedidoModalProps) {
  if (!isOpen || !resumen) return null;

  const handleDescargarExcel = () => {
    const dataParaExcel = resumen.items.map((item) => ({
      'ID Pedido': resumen.pedidoId,
      'Fecha Pedido': new Date(resumen.fechaPedido).toLocaleString('es-MX', {
        timeZone: 'America/Tijuana',
      }),
      'Vendedor': resumen.vendedorNombre,
      'Ciudad / Zona': resumen.zona,
      'Marca': item.marca,
      'Modelo': item.modelo,
      'Almacenamiento': item.almacenamiento || '—',
      'RAM': item.ram || '—',
      'Color': item.color || '—',
      'Cantidad': item.cantidad,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedido Stock');

    const hoy = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Pedido_Stock_${hoy}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Cabecera de éxito */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-950/40 via-slate-950/80 to-slate-950 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">Pedido registrado con éxito</h3>
        </div>

        {/* Acciones con alturas idénticas y diseño coherente en móvil y escritorio */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleDescargarExcel}
            className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
            title="Descargar Excel"
          >
            <span className="material-symbols-outlined text-xl block">download</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center h-10 sm:h-11 px-5 sm:px-6 bg-secondary text-slate-950 hover:bg-secondary/90 font-bold text-xs sm:text-sm rounded-xl border border-secondary/20 transition-all shadow-lg shadow-secondary/20 cursor-pointer shrink-0 active:scale-95"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
