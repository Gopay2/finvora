import React from 'react';
import type { ReciboItem } from '@/types/recibo';
import { formatFecha, getColorHex } from '@/utils/recibo';

interface ReciboTableProps {
  items: ReciboItem[];
  isDeleting: boolean;
  itemToDeleteId?: string | null;
  userRole?: string;
  onExportExcel: () => void;
  onOpenEditModal: (item: ReciboItem) => void;
  onSelectItemToDelete: (item: ReciboItem) => void;
  onOpenCargarModal?: (item: ReciboItem) => void;
}

export default function ReciboTable({
  items,
  isDeleting,
  itemToDeleteId,
  userRole,
  onExportExcel,
  onOpenEditModal,
  onSelectItemToDelete,
  onOpenCargarModal,
}: ReciboTableProps) {
  return (
    <div className="space-y-4 pt-6">
      {/* Encabezado de la tabla con contador y botón de exportar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-white tracking-wide">
            Equipos registrados
          </h3>
          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#0c1424] text-secondary border border-[#1c2a44]">
            {items.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onExportExcel}
          disabled={items.length === 0}
          className={`flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl transition-all ${
            items.length === 0
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-slate-700 hover:text-white cursor-pointer'
          }`}
          title="Descargar Excel"
        >
          <span className="material-symbols-outlined text-base md:text-xl shrink-0">download</span>
        </button>
      </div>

      {/* Contenedor con scroll horizontal para móviles y estilo glassmorphism */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[580px] md:min-w-full">
            <colgroup>
              <col className="w-[48%] md:w-[26%]" />
              <col className="w-[15%] md:w-[22%]" />
              <col className="w-[11%] md:w-[15%]" />
              <col className="w-[14%] md:w-[21%]" />
              <col className="w-[12%] md:w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-800 bg-[#091122]/70 text-slate-400 uppercase tracking-wider font-semibold text-xs">
                <th className="py-4 pl-4 sm:pl-8 md:pl-11 pr-2 sm:pr-3 text-left min-w-[210px] sm:min-w-[250px]">PRODUCTO</th>
                <th className="py-4 px-1.5 sm:px-3 text-center">IMEI</th>
                <th className="py-4 px-3 text-center">
                  <span className="inline-block -translate-x-3 sm:-translate-x-4">COLOR</span>
                </th>
                <th className="py-4 px-3 text-center">FECHA INGRESO</th>
                <th className="py-4 pr-5 md:pr-6 pl-3 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500 italic text-sm">
                    No hay equipos registrados en esta lista de recibo aún.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const { fecha, hora } = formatFecha(item.fecha_ingreso);
                  const colorHex = getColorHex(item.productos?.color || '');
                  const isItemBeingDeleted = isDeleting && itemToDeleteId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/20 transition-colors group border-b border-slate-800/40"
                    >
                      {/* Producto: Marca, Modelo, RAM y Almacenamiento */}
                      <td className="py-4 pl-3.5 sm:pl-5 md:pl-6 pr-2 sm:pr-3 min-w-[210px] sm:min-w-[250px]">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="pt-0.5 sm:pt-1 text-slate-500 shrink-0 select-none">
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px] leading-none">
                              smartphone
                            </span>
                          </div>
                          <div className="flex flex-col items-start gap-1 min-w-0">
                            <span className="font-bold text-white text-xs sm:text-sm leading-snug">
                              {item.productos
                                ? `${item.productos.marca} ${item.productos.modelo}`
                                : 'Cargando modelo...'}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.productos?.ram && (
                                <span className="text-[10px] sm:text-[11px] font-bold bg-slate-800 text-slate-300 px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-tight">
                                  RAM {item.productos.ram}
                                </span>
                              )}
                              {item.productos?.almacenamiento && (
                                <span className="text-[10px] sm:text-[11px] font-bold bg-slate-800 text-slate-300 px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-tight">
                                  ALM {item.productos.almacenamiento}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* IMEI */}
                      <td className="py-4 px-1.5 sm:px-3 text-center whitespace-nowrap">
                        <span className="font-mono bg-slate-950 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-800 text-secondary text-[10px] sm:text-xs font-semibold inline-flex items-center justify-center shadow-sm tracking-tight sm:tracking-wider">
                          {item.imei}
                        </span>
                      </td>

                      {/* Color */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm"
                            style={{ backgroundColor: colorHex }}
                          />
                          <span className="text-slate-200 font-semibold text-sm">
                            {item.productos?.color || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Fecha de ingreso */}
                      <td className="py-4 px-3 text-center whitespace-nowrap" suppressHydrationWarning>
                        <div className="flex flex-col items-center justify-center leading-tight">
                          <span className="text-sm font-semibold text-slate-100">{fecha}</span>
                          <span className="text-[11px] font-mono text-slate-400">{hora}</span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 pr-5 md:pr-6 pl-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {userRole === 'Bodega' ? (
                            <button
                              type="button"
                              disabled
                              title="El rol Bodega no tiene permisos para cargar a stock"
                              className="text-slate-600 p-2 rounded-lg cursor-not-allowed opacity-40"
                            >
                              <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenCargarModal?.(item)}
                              title="Cargar a Stock Disponible"
                              className="text-emerald-400 hover:text-emerald-300 transition-all p-2 rounded-lg hover:bg-emerald-500/15 cursor-pointer shadow-sm hover:scale-105"
                            >
                              <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(item)}
                            title="Editar equipo"
                            className="text-slate-400 hover:text-secondary transition-colors p-2 rounded-lg hover:bg-secondary/10 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectItemToDelete(item)}
                            disabled={isItemBeingDeleted}
                            title="Eliminar de recibo"
                            className={`text-red-500/50 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10 cursor-pointer ${
                              isItemBeingDeleted ? 'opacity-30' : ''
                            }`}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {isItemBeingDeleted ? 'sync' : 'delete'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
