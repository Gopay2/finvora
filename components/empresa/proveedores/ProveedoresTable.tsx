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
  editCostsPayjoy: { [id: string]: string };
  setEditCostsPayjoy: React.Dispatch<React.SetStateAction<{ [id: string]: string }>>;
  savingMapPayjoy: { [id: string]: boolean };
  savedMapPayjoy: { [id: string]: boolean };
  handleSaveCostoPayjoy: (id: string, originalCostoPayjoy: number) => void;
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
  editCostsPayjoy,
  setEditCostsPayjoy,
  savingMapPayjoy,
  savedMapPayjoy,
  handleSaveCostoPayjoy,
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
        <table className="w-full min-w-[780px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-4 min-w-[90px]">Marca</th>
              <th className="px-5 py-4 min-w-[110px]">Modelo</th>
              <th className="px-5 py-4 min-w-[150px]">Especificación</th>
              <th className="px-4 py-4 text-center min-w-[140px]" style={{ width: "18%" }}>Costo Equipo</th>
              <th className="px-4 py-4 text-center min-w-[140px]" style={{ width: "18%" }}>Costo PayJoy</th>
              <th className="px-4 py-4 text-center min-w-[80px]" style={{ width: "10%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {activeAssignedCosts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                  No se han asignado productos a Proveedor {proveedorActive} aún.
                </td>
              </tr>
            ) : (
              activeAssignedCosts.map((costoRecord) => {
                const productInfo = costoRecord.producto;
                const name = productInfo ? `${productInfo.marca} ${productInfo.modelo}` : "Producto Desconocido";
                const costoPayjoyVal = costoRecord.costo_payjoy ?? 0;

                return (
                  <tr key={costoRecord.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="px-5 py-4 text-slate-200 font-medium">
                      {productInfo ? productInfo.marca : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-200 font-medium">
                      {productInfo ? productInfo.modelo : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {productInfo ? (
                        <span>
                          {productInfo.color} • {productInfo.almacenamiento}
                          {productInfo.ram && ` • ${productInfo.ram} RAM`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Columna: Costo Equipo */}
                    <td className="px-4 py-4 text-center">
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
                            className={`bg-slate-950 border rounded-xl pl-6 pr-3 py-1.5 text-[15px] sm:text-xs text-center text-slate-200 w-28 sm:w-32 focus:outline-none transition-all ${savedMap[costoRecord.id]
                                ? "border-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.15)] bg-green-500/5"
                                : savingMap[costoRecord.id]
                                  ? "border-secondary/40"
                                  : "border-slate-800 focus:border-secondary"
                              }`}
                            suppressHydrationWarning
                          />
                          <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center whitespace-nowrap shrink-0">
                            {savingMap[costoRecord.id] ? (
                              <span className="animate-spin h-3 w-3 border-2 border-secondary border-t-transparent rounded-full pointer-events-none" />
                            ) : savedMap[costoRecord.id] ? (
                              <span className="material-symbols-outlined text-green-400 text-sm font-bold animate-bounce pointer-events-none">
                                check
                              </span>
                            ) : (
                              editCosts[costoRecord.id] !== undefined && editCosts[costoRecord.id] !== costoRecord.costo.toString() && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveCosto(costoRecord.id, costoRecord.costo)}
                                  className="sm:hidden flex items-center justify-center w-4 h-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md cursor-pointer active:scale-95 transition-all"
                                  title="Guardar costo"
                                >
                                  <span className="material-symbols-outlined text-[12px] font-black">done</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Columna: Costo PayJoy */}
                    <td className="px-4 py-4 text-center">
                      <div className="relative flex items-center justify-center w-full">
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-slate-400 font-bold text-xs pointer-events-none">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editCostsPayjoy[costoRecord.id] !== undefined ? editCostsPayjoy[costoRecord.id] : costoPayjoyVal.toString()}
                            onFocus={(e) => {
                              const currentVal = editCostsPayjoy[costoRecord.id] !== undefined ? editCostsPayjoy[costoRecord.id] : costoPayjoyVal.toString();
                              if (currentVal === "0") {
                                setEditCostsPayjoy((prev) => ({ ...prev, [costoRecord.id]: "" }));
                              }
                              e.target.select();
                            }}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (/^0\d+$/.test(val)) {
                                val = val.replace(/^0+/, "");
                              }
                              if (val === "" || /^\d*$/.test(val)) {
                                setEditCostsPayjoy((prev) => ({ ...prev, [costoRecord.id]: val }));
                              }
                            }}
                            onBlur={() => {
                              const currentVal = editCostsPayjoy[costoRecord.id];
                              if (currentVal !== undefined && (currentVal === "" || currentVal.trim() === "")) {
                                setEditCostsPayjoy((prev) => ({ ...prev, [costoRecord.id]: "0" }));
                              }
                              handleSaveCostoPayjoy(costoRecord.id, costoPayjoyVal);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveCostoPayjoy(costoRecord.id, costoPayjoyVal);
                                e.currentTarget.blur();
                              }
                            }}
                            className={`bg-slate-950 border rounded-xl pl-6 pr-3 py-1.5 text-[15px] sm:text-xs text-center text-slate-200 w-28 sm:w-32 focus:outline-none transition-all ${savedMapPayjoy[costoRecord.id]
                                ? "border-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.15)] bg-green-500/5"
                                : savingMapPayjoy[costoRecord.id]
                                  ? "border-secondary/40"
                                  : "border-slate-800 focus:border-secondary"
                              }`}
                            suppressHydrationWarning
                          />
                          <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center whitespace-nowrap shrink-0">
                            {savingMapPayjoy[costoRecord.id] ? (
                              <span className="animate-spin h-3 w-3 border-2 border-secondary border-t-transparent rounded-full pointer-events-none" />
                            ) : savedMapPayjoy[costoRecord.id] ? (
                              <span className="material-symbols-outlined text-green-400 text-sm font-bold animate-bounce pointer-events-none">
                                check
                              </span>
                            ) : (
                              editCostsPayjoy[costoRecord.id] !== undefined && editCostsPayjoy[costoRecord.id] !== costoPayjoyVal.toString() && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveCostoPayjoy(costoRecord.id, costoPayjoyVal)}
                                  className="sm:hidden flex items-center justify-center w-4 h-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md cursor-pointer active:scale-95 transition-all"
                                  title="Guardar costo PayJoy"
                                >
                                  <span className="material-symbols-outlined text-[12px] font-black">done</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Columna: Acciones */}
                    <td className="px-4 py-4 text-center">
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
