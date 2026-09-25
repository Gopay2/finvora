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
    const zonaLimpia = resumen.zona.replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Pedido_Stock_${zonaLimpia}_${hoy}.xlsx`);
  };

  const fechaFormateada = new Date(resumen.fechaPedido).toLocaleString('es-MX', {
    timeZone: 'America/Tijuana',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Cabecera de éxito */}
        <div className="p-6 bg-gradient-to-b from-emerald-950/40 via-slate-950/80 to-slate-950 border-b border-slate-800/80 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <h3 className="text-xl font-bold text-white">¡Pedido Registrado con Éxito!</h3>
          <p className="text-xs text-slate-400 mt-1">
            Se ha guardado correctamente en la base de datos de inventario
          </p>
        </div>

        {/* Metadatos del pedido */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/60 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">Ciudad / Zona</span>
            <span className="font-semibold text-slate-200 text-sm">{resumen.zona}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">Fecha / Hora</span>
            <span className="font-semibold text-slate-200">{fechaFormateada}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">Solicitado Por</span>
            <span className="font-semibold text-slate-200">{resumen.vendedorNombre}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold">Total Equipos</span>
            <span className="font-extrabold text-secondary text-sm">{resumen.totalEquipos} unidades</span>
          </div>
        </div>

        {/* Listado de equipos */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-2 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Detalle del Pedido:
          </span>
          {resumen.items.map((item) => (
            <div
              key={item.producto_id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[10px] uppercase font-bold text-secondary mr-1.5">{item.marca}</span>
                <span className="font-semibold text-slate-200">{item.modelo}</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                  {item.almacenamiento && <span>{item.almacenamiento}</span>}
                  {item.ram && <span>• RAM {item.ram}</span>}
                  {item.color && <span>• {item.color}</span>}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-black text-sm shrink-0">
                x{item.cantidad}
              </span>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDescargarExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
            title="Descargar este pedido en Excel"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Descargar Excel</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-secondary text-slate-950 hover:bg-secondary/90 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-secondary/20 cursor-pointer"
          >
            Aceptar / Nuevo Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
