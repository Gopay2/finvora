'use client';

import React from 'react';
import { formatCurrency } from '../comprobantes-types';

interface SueldosTablaResumenProps {
  isRepartidorSelected: boolean;
  bonoVal: number;
  sueldoVal: number;
  publicidadVal: number;
  totalComision: number;
}

export function SueldosTablaResumen({
  isRepartidorSelected,
  bonoVal,
  sueldoVal,
  publicidadVal,
  totalComision
}: SueldosTablaResumenProps) {
  const customTh = "px-1.5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap";
  const customTd = "px-1.5 py-3.5 text-center text-slate-300 font-medium text-[13px] whitespace-nowrap";

  return (
    <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl mt-6">
      <div className="bg-slate-950 p-4 border-b border-slate-800">
        <h4 className="text-sm font-bold text-slate-200">Extras y total comisión</h4>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse text-center text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
            {isRepartidorSelected ? (
              <tr>
                <th className={customTh} colSpan={2} style={{ width: "40%" }}></th>
                <th className={customTh} style={{ width: "20%" }}>Bono</th>
                <th className={customTh} style={{ width: "20%" }}>Sueldo</th>
                <th className={customTh} style={{ width: "20%" }}>Total</th>
              </tr>
            ) : (
              <tr>
                <th className={customTh} style={{ width: "10%" }}></th>
                <th className={customTh} style={{ width: "10%" }}></th>
                <th className={customTh} style={{ width: "10%" }}></th>
                <th className={customTh} style={{ width: "10%" }}></th>
                <th className={customTh} style={{ width: "11%" }}></th>
                <th className={customTh} style={{ width: "10%" }}></th>
                <th className={customTh} style={{ width: "10%" }}>Bono</th>
                <th className={customTh} style={{ width: "10%" }}>Sueldo</th>
                <th className={customTh} style={{ width: "10%" }}>Publicidad</th>
                <th className={customTh} style={{ width: "9%" }}>Total</th>
              </tr>
            )}
          </thead>
          <tbody>
            <tr className="border-b border-slate-800/50 hover:bg-slate-900/20 transition-colors">
              {isRepartidorSelected ? (
                <>
                  <td className={customTd} colSpan={2} style={{ width: "40%" }}></td>
                  <td className={customTd} style={{ width: "20%" }}>
                    <span className="text-slate-300">{formatCurrency(bonoVal)}</span>
                  </td>
                  <td className={customTd} style={{ width: "20%" }}>
                    <span className="text-slate-300">{formatCurrency(sueldoVal)}</span>
                  </td>
                  <td className={customTd} style={{ width: "20%" }}>
                    <span className="text-secondary font-bold">{formatCurrency(totalComision + bonoVal + sueldoVal)}</span>
                  </td>
                </>
              ) : (
                <>
                  <td className={customTd} style={{ width: "10%" }}></td>
                  <td className={customTd} style={{ width: "10%" }}></td>
                  <td className={customTd} style={{ width: "10%" }}></td>
                  <td className={customTd} style={{ width: "10%" }}></td>
                  <td className={customTd} style={{ width: "11%" }}></td>
                  <td className={customTd} style={{ width: "10%" }}></td>
                  <td className={customTd} style={{ width: "10%" }}>
                    <span className="text-slate-300">{formatCurrency(bonoVal)}</span>
                  </td>
                  <td className={customTd} style={{ width: "10%" }}>
                    <span className="text-slate-300">{formatCurrency(sueldoVal)}</span>
                  </td>
                  <td className={customTd} style={{ width: "10%" }}>
                    <span className="text-slate-305">{formatCurrency(-publicidadVal)}</span>
                  </td>
                  <td className={customTd} style={{ width: "9%" }}>
                    <span className="text-secondary font-bold">{formatCurrency(totalComision + bonoVal + sueldoVal - publicidadVal)}</span>
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
