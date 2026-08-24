'use client';

import React from 'react';
import { formatCurrency } from '../comprobantes-types';

export interface EmpleadoConsolidado {
  id: string;
  username: string;
  role: string;
  operacionesCount: number;
  totalPagar: number;
}

interface SueldosTablaConsolidadaProps {
  empleados: EmpleadoConsolidado[];
  totalOperaciones: number;
  granTotalPagar: number;
  hasDateFilter: boolean;
  onSelectEmpleado: (id: string) => void;
}

export function SueldosTablaConsolidada({
  empleados,
  totalOperaciones,
  granTotalPagar,
  hasDateFilter,
  onSelectEmpleado,
}: SueldosTablaConsolidadaProps) {
  const customTh = "px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap";
  const customTd = "px-4 py-3.5 text-center text-slate-300 font-medium text-[13px] whitespace-nowrap";

  const getRoleBadge = (role: string) => {
    const roleLower = (role || "").toLowerCase();
    if (roleLower === "repartidor") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Repartidor
        </span>
      );
    }
    if (roleLower === "supervisor") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          Supervisor
        </span>
      );
    }
    if (roleLower === "admin" || roleLower === "developer") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
        Vendedor
      </span>
    );
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full border-collapse text-center text-sm">
        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
          <tr>
            <th className={`${customTh} text-left pl-6`} style={{ width: "35%" }}>Empleado</th>
            <th className={customTh} style={{ width: "20%" }}>Rol</th>
            <th className={customTh} style={{ width: "20%" }}>Operaciones</th>
            <th className={`${customTh} text-right pr-6`} style={{ width: "25%" }}>Total a Pagar</th>
          </tr>
        </thead>
        <tbody>
          {!hasDateFilter ? (
            <tr>
              <td colSpan={4} className="py-16 text-center text-slate-400 text-sm">
                <span className="material-symbols-outlined text-4xl mb-3 block text-slate-500">date_range</span>
                <span className="font-semibold text-slate-200 block text-base mb-1">Selecciona un rango de fechas</span>
                <span className="text-xs text-slate-500">Elige una fecha <strong>Desde</strong> o <strong>Hasta</strong> en el filtro superior para calcular la liquidación de todos los empleados.</span>
              </td>
            </tr>
          ) : empleados.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-12 text-center text-slate-500 text-sm">
                <span className="material-symbols-outlined text-3xl mb-2 block opacity-40">group_off</span>
                No hay operaciones registradas en el período seleccionado.
              </td>
            </tr>
          ) : (
            empleados.map((emp) => {
              const displayName = emp.username.charAt(0).toUpperCase() + emp.username.slice(1);
              return (
                <tr
                  key={emp.id}
                  onClick={() => onSelectEmpleado(emp.id)}
                  className="border-b border-slate-800/50 hover:bg-slate-850/50 transition-all duration-200 cursor-pointer group"
                  title={`Ver detalle de liquidación de ${displayName}`}
                >
                  {/* Empleado */}
                  <td className={`${customTd} text-left pl-6`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-secondary font-bold text-xs shrink-0 group-hover:border-secondary/40 transition-colors">
                        {displayName.charAt(0)}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-slate-200 group-hover:text-secondary transition-colors">
                          {displayName}
                        </span>
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-400">
                          Click para ver detalle individual →
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td className={customTd}>
                    {getRoleBadge(emp.role)}
                  </td>

                  {/* Operaciones */}
                  <td className={customTd}>
                    <span className="text-slate-300 font-medium">
                      {emp.operacionesCount} {emp.operacionesCount === 1 ? 'operación' : 'operaciones'}
                    </span>
                  </td>

                  {/* Total a Pagar */}
                  <td className={`${customTd} text-right pr-6`}>
                    <span className="text-secondary font-bold text-[14px]">
                      {formatCurrency(emp.totalPagar)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {empleados.length > 0 && (
          <tfoot>
            <tr className="bg-slate-950/90 border-t-2 border-slate-700/80">
              <td className="px-6 py-4 text-left font-bold text-slate-100 text-sm">
                TOTAL GENERAL APROX
              </td>
              <td className="px-4 py-4 text-center text-slate-400 text-xs font-semibold">
                Todos los empleados
              </td>
              <td className="px-4 py-4 text-center text-slate-300 font-semibold text-xs">
                {totalOperaciones} operaciones
              </td>
              <td className="px-6 py-4 text-right font-extrabold text-secondary text-base">
                {formatCurrency(granTotalPagar)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
