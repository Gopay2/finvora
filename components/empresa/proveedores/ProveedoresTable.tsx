'use client';

import React from 'react';
import type { SupplierCostRecord, ProveedorNombre } from '@/types/proveedores';

interface ProveedoresTableProps {
  proveedorActive: ProveedorNombre;
  activeAssignedCosts: SupplierCostRecord[];
  editCosts: { [id: string]: string };
  setEditCosts: React.Dispatch<React.SetStateAction<{ [id: string]: string }>>;
  savingMap: { [id: string]: boolean };
  savedMap: { [id: string]: boolean };
  handleSaveCosto: (id: string, originalCosto: number) => void;
  handleEliminar: (id: string, name: string) => void;
}

export function ProveedoresTable({
  proveedorActive,
  activeAssignedCosts,
  editCosts,
  setEditCosts,
  savingMap,
  savedMap,
  handleSaveCosto,
  handleEliminar
}: ProveedoresTableProps) {
  return (
    <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/85 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-200">
          Productos en Proveedor {proveedorActive} ({activeAssignedCosts.length})
        </h4>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 min-w-[100px]">Marca</th>
              <th className="px-6 py-4 min-w-[120px]">Modelo</th>
              <th className="px-6 py-4 min-w-[160px]">Especificación</th>
              <th className="px-6 py-4 text-center min-w-[160px]" style={{ width: "20%" }}>Costo Equipo</th>
              <th className="px-6 py-4 text-center min-w-[90px]" style={{ width: "15%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {activeAssignedCosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                  No se han asignado productos a Proveedor {proveedorActive} aún.
                </td>
              </tr>
            ) : (
              activeAssignedCosts.map((costoRecord) => {
                const productInfo = costoRecord.producto;
                const name = productInfo ? `${productInfo.marca} ${productInfo.modelo}` : "Producto Desconocido";

                return (
                  <tr key={costoRecord.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="px-6 py-4 text-slate-200 font-medium">
                      {productInfo ? productInfo.marca : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-medium">
                      {productInfo ? productInfo.modelo : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {productInfo ? (
                        <span>
                          {productInfo.color} • {productInfo.almacenamiento}
                          {productInfo.ram && ` • ${productInfo.ram} RAM`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative flex items-center justify-center w-full">
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-slate-400 font-bold text-xs pointer-events-none">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editCosts[costoRecord.id] !== undefined ? editCosts[costoRecord.id] : costoRecord.costo.toString()}
                            onFocus={(e) => {
                              const currentVal = editCosts[costoRecord.id] !== undefined ? editCosts[costoRecord.id] : costoRecord.costo.toString();
                              if (currentVal === "0") {
                                setEditCosts((prev) => ({ ...prev, [costoRecord.id]: "" }));
                              }
                              e.target.select();
                            }}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (/^0\d+$/.test(val)) {
                                val = val.replace(/^0+/, "");
                              }
                              if (val === "" || /^\d*$/.test(val)) {
                                setEditCosts((prev) => ({ ...prev, [costoRecord.id]: val }));
                              }
                            }}
                            onBlur={() => {
                              const currentVal = editCosts[costoRecord.id];
                              if (currentVal !== undefined && (currentVal === "" || currentVal.trim() === "")) {
                                setEditCosts((prev) => ({ ...prev, [costoRecord.id]: "0" }));
                              }
                              handleSaveCosto(costoRecord.id, costoRecord.costo);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveCosto(costoRecord.id, costoRecord.costo);
                                e.currentTarget.blur();
                              }
                            }}
                            className={`bg-slate-950 border rounded-xl pl-6 pr-4 py-1.5 text-[16px] sm:text-xs text-center text-slate-200 w-32 focus:outline-none transition-all ${savedMap[costoRecord.id]
                                ? "border-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.15)] bg-green-500/5"
                                : savingMap[costoRecord.id]
                                  ? "border-secondary/40"
                                  : "border-slate-800 focus:border-secondary"
                              }`}
                            suppressHydrationWarning
                          />
                          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center whitespace-nowrap shrink-0">
                            {savingMap[costoRecord.id] ? (
                              <span className="animate-spin h-3.5 w-3.5 border-2 border-secondary border-t-transparent rounded-full pointer-events-none" />
                            ) : savedMap[costoRecord.id] ? (
                              <span className="material-symbols-outlined text-green-400 text-sm font-bold animate-bounce pointer-events-none">
                                check
                              </span>
                            ) : (
                              editCosts[costoRecord.id] !== undefined && editCosts[costoRecord.id] !== costoRecord.costo.toString() && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveCosto(costoRecord.id, costoRecord.costo)}
                                  className="sm:hidden flex items-center justify-center w-5 h-5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md cursor-pointer active:scale-95 transition-all"
                                  title="Guardar costo"
                                >
                                  <span className="material-symbols-outlined text-[14px] font-black">done</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleEliminar(costoRecord.id, name)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors hover:bg-red-500/10 rounded-xl cursor-pointer"
                        title="Eliminar asignación"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
