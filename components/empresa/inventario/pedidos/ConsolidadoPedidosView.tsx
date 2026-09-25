'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { DateRangeFilter } from '@/components/empresa/filtros/DateRangeFilter';
import { obtenerConsolidadoPedidos } from '@/app/empresa/webapp/inventario/pedidos/pedidos-actions';
import type { ConsolidadoPedidoItem } from '@/types/pedidos-stock';

interface VendedorOption {
  id: string;
  username: string | null;
  role: string;
}

interface ConsolidadoPedidosViewProps {
  vendedores: VendedorOption[];
}

export default function ConsolidadoPedidosView({ vendedores }: ConsolidadoPedidosViewProps) {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedVendedorId, setSelectedVendedorId] = useState<string>('');
  const [items, setItems] = useState<ConsolidadoPedidoItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchConsolidado = useCallback(() => {
    startTransition(async () => {
      setErrorMessage(null);
      const res = await obtenerConsolidadoPedidos({
        fechaDesde: dateFrom || undefined,
        fechaHasta: dateTo || undefined,
        vendedorId: selectedVendedorId || undefined,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setItems(res.items || []);
      }
    });
  }, [dateFrom, dateTo, selectedVendedorId]);

  useEffect(() => {
    fetchConsolidado();
  }, [fetchConsolidado]);

  const totalCantidad = items.reduce((acc, it) => acc + it.cantidad, 0);

  const handleDescargarExcel = () => {
    if (items.length === 0) return;

    const dataParaExcel = items.map((it) => ({
      'Ciudad / Zona': it.zona,
      'Marca': it.marca,
      'Modelo': it.modelo,
      'Almacenamiento': it.almacenamiento || '—',
      'RAM': it.ram || '—',
      'Cantidad Total': it.cantidad,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado');

    const hoy = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Consolidado_Pedidos_Stock_${hoy}.xlsx`);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedVendedorId('');
  };

  const hasFilters = Boolean(dateFrom || dateTo || selectedVendedorId);

  return (
    <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Cabecera del consolidado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">analytics</span>
            <h3 className="text-lg sm:text-xl font-bold text-white">Consolidado de Pedidos</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Resumen acumulado para auditoría, compras y planeación de stock
          </p>
        </div>

        {/* Acciones superiores */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleDescargarExcel}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl transition-all text-xs font-bold cursor-pointer shadow-sm"
              title="Descargar este reporte consolidado en Excel"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Exportar Excel</span>
            </button>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all text-xs font-bold cursor-pointer"
              title="Limpiar todos los filtros"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros: Fechas (Desde / Hasta) y Vendedor */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filtro de Rango de Fechas */}
        <div className="w-full lg:w-auto">
          <DateRangeFilter
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            label="Rango de fecha:"
          />
        </div>

        {/* Filtro de Vendedor */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <label className="text-xs sm:text-sm text-slate-400 font-semibold shrink-0 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">person</span>
            Vendedor:
          </label>
          <div className="relative flex-1 sm:w-60">
            <select
              value={selectedVendedorId}
              onChange={(e) => setSelectedVendedorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 pr-10 text-xs sm:text-sm text-slate-200 font-semibold focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="">TODOS LOS VENDEDORES</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.username || 'Sin nombre'} ({v.role})
                </option>
              ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none text-xl">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de error si ocurre */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabla Consolidada: Zona | Modelo | Cantidad */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5" style={{ width: '30%' }}>Zona</th>
                <th className="px-5 py-3.5" style={{ width: '50%' }}>Modelo</th>
                <th className="px-5 py-3.5 text-center" style={{ width: '20%' }}>Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {isPending ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center text-slate-400 text-sm">
                    <div className="flex items-center justify-center gap-2.5">
                      <span className="animate-spin h-5 w-5 border-2 border-secondary border-t-transparent rounded-full" />
                      <span>Cargando consolidado de pedidos...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center text-slate-500 italic text-sm">
                    <span className="material-symbols-outlined text-3xl mb-1.5 block opacity-40">inventory</span>
                    No se encontraron pedidos registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                items.map((fila, idx) => (
                  <tr key={`${fila.zona}_${fila.modelo}_${idx}`} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-100 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base shrink-0">location_on</span>
                        <span>{fila.zona}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-200 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[10px] uppercase tracking-wider text-secondary">
                          {fila.marca}
                        </span>
                        <span className="font-semibold text-white">{fila.modelo}</span>
                        {(fila.almacenamiento || fila.ram) && (
                          <div className="flex items-center gap-1">
                            {fila.almacenamiento && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                                {fila.almacenamiento}
                              </span>
                            )}
                            {fila.ram && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                                RAM {fila.ram}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-black text-secondary text-sm sm:text-base">
                      {fila.cantidad}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Pie de tabla con total acumulado */}
            {!isPending && items.length > 0 && (
              <tfoot className="bg-slate-950 border-t-2 border-slate-800 font-bold">
                <tr>
                  <td colSpan={2} className="px-5 py-3.5 text-left text-xs uppercase tracking-wider text-slate-300">
                    Total Acumulado Solicitado
                  </td>
                  <td className="px-5 py-3.5 text-center text-secondary font-black text-base bg-secondary/10 border-l border-slate-800">
                    {totalCantidad}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </section>
  );
}
