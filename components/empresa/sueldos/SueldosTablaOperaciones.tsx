'use client';

import React from 'react';
import type { ComprobanteRecord } from '@/types/sueldos';
import { formatCurrency } from '../comprobantes-types';

interface SueldosTablaOperacionesProps {
  isRepartidorSelected: boolean;
  filteredList: ComprobanteRecord[];
  selectedUserId: string;
  rowEntregaOverrides: { [id: string]: string };
  entregaVal: number;
  plataformaVal: number;
  comisionPercent: number;
  activeRowId: string | null;
  setActiveRowId: (id: string | null) => void;
}

const formatTijuanaOnlyDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Tijuana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

export function SueldosTablaOperaciones({
  isRepartidorSelected,
  filteredList,
  selectedUserId,
  rowEntregaOverrides,
  entregaVal,
  plataformaVal,
  comisionPercent,
  activeRowId,
  setActiveRowId
}: SueldosTablaOperacionesProps) {
  const styles = {
    tableWrapper: "overflow-x-auto custom-scrollbar",
    table: "w-full border-collapse text-center text-sm",
    thead: "bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider",
  };

  const customTh = "px-1.5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap";
  const customTd = "px-1.5 py-3.5 text-center text-slate-300 font-medium text-[13px] whitespace-nowrap";
  const customTdEquipo = "px-1.5 py-3.5 text-center text-slate-300 font-medium text-[13px] max-w-[90px] break-words";

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          {isRepartidorSelected ? (
            <tr>
              <th className={customTh} style={{ width: "20%" }}>Fecha</th>
              <th className={`${customTh} max-w-[120px]`} style={{ width: "20%" }}>Equipo</th>
              <th className={customTh} style={{ width: "20%" }}>Entrega</th>
              <th className={customTh} style={{ width: "20%" }}>Pago Recibido</th>
              <th className={customTh} style={{ width: "20%" }}>Comisión</th>
            </tr>
          ) : (
            <tr>
              <th className={customTh} style={{ width: "10%" }}>Fecha</th>
              <th className={`${customTh} max-w-[90px]`} style={{ width: "10%" }}>Equipo</th>
              <th className={customTh} style={{ width: "10%" }}>Precio Compra</th>
              <th className={customTh} style={{ width: "10%" }}>Costo equipo</th>
              <th className={customTh} style={{ width: "11%" }}>Pago Inicial</th>
              <th className={customTh} style={{ width: "10%" }}>Plataforma</th>
              <th className={customTh} style={{ width: "10%" }}>Entrega</th>
              <th className={customTh} style={{ width: "10%" }}>Pago Recibido</th>
              <th className={customTh} style={{ width: "10%" }}>Sub-Total</th>
              <th className={customTh} style={{ width: "9%" }}>Comisión</th>
            </tr>
          )}
        </thead>
        <tbody>
          {filteredList.length === 0 ? (
            <tr>
              <td colSpan={isRepartidorSelected ? 5 : 10} className="px-6 py-12 text-center text-slate-500 italic">
                {selectedUserId === ""
                  ? "Por favor, selecciona un empleado para consultar las operaciones."
                  : "No se encontraron operaciones registradas con los filtros seleccionados."}
              </td>
            </tr>
          ) : (
            filteredList.map((item) => {
              const costoEquipo = Number(item.costo_equipo) || 0;
              const precioCompra = Number(item.precio_compra) || 0;
              const pagoInicial = Number(item.pago_inicial) || 0;
              const pagoRecibido = Number(item.pago_recibido) || 0;
              const rowEntrega = rowEntregaOverrides[item.id] !== undefined
                ? (Number(rowEntregaOverrides[item.id]) || 0)
                : entregaVal;
              const subTotal = precioCompra - costoEquipo - pagoInicial - plataformaVal - rowEntrega + pagoRecibido;
              const comision = isRepartidorSelected
                ? (rowEntrega - pagoRecibido)
                : (subTotal * (comisionPercent / 100));
              
              const hasOverride = rowEntregaOverrides[item.id] !== undefined &&
                rowEntregaOverrides[item.id] !== String(entregaVal);

              return (
                <tr
                  key={item.id}
                  onClick={() => {
                    setActiveRowId(activeRowId === item.id ? null : item.id);
                  }}
                  className={`border-b border-slate-800/50 transition-all duration-200 cursor-pointer ${
                    activeRowId === item.id
                      ? "bg-slate-700/60 border-y border-secondary/70 shadow-[inset_0_0_12px_rgba(224,242,254,0.12)]"
                      : "hover:bg-slate-900/30"
                  }`}
                  title="Haz clic para modificar la entrega de esta fila individualmente"
                >
                  <td className={customTd} style={{ width: isRepartidorSelected ? "20%" : "10%" }}>
                    <span className="text-slate-100">{formatTijuanaOnlyDate(item.created_at)}</span>
                  </td>
                  <td className={customTdEquipo} style={{ width: isRepartidorSelected ? "20%" : "10%" }}>
                    {item.celular ? (
                      <div className="flex flex-col items-center">
                        <span className="text-slate-100 text-xs font-bold">{item.celular}</span>
                        {item.color_celular && <span className="text-[10px] text-slate-500">{item.color_celular}</span>}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  
                  {!isRepartidorSelected && (
                    <>
                      <td className={customTd} style={{ width: "10%" }}>
                        <span className="text-slate-300">{formatCurrency(item.precio_compra)}</span>
                      </td>
                      <td className={customTd} style={{ width: "10%" }}>
                        <span className="text-slate-300">{formatCurrency(-costoEquipo)}</span>
                      </td>
                      <td className={customTd} style={{ width: "11%" }}>
                        <span className="text-slate-300">{formatCurrency(-item.pago_inicial)}</span>
                      </td>
                      <td className={customTd} style={{ width: "10%" }}>
                        <span className="text-slate-300">{formatCurrency(-plataformaVal)}</span>
                      </td>
                    </>
                  )}

                  <td className={customTd} style={{ width: isRepartidorSelected ? "20%" : "10%" }}>
                    <span className={hasOverride ? "text-secondary font-bold" : "text-slate-300"}>
                      {formatCurrency(isRepartidorSelected ? rowEntrega : -rowEntrega)}
                    </span>
                  </td>

                  <td className={customTd} style={{ width: isRepartidorSelected ? "20%" : "10%" }}>
                    <span className="text-slate-300">
                      {formatCurrency(isRepartidorSelected ? -pagoRecibido : pagoRecibido)}
                    </span>
                  </td>

                  {!isRepartidorSelected && (
                    <td className={customTd} style={{ width: "10%" }}>
                      <span className="text-slate-100 font-bold">{formatCurrency(subTotal)}</span>
                    </td>
                  )}

                  <td className={customTd} style={{ width: isRepartidorSelected ? "20%" : "9%" }}>
                    <span className="text-secondary font-bold">{formatCurrency(comision)}</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
