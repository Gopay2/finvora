'use client';

import React from 'react';
import type { Venta, OrdenEntrega, Garantia, OrdenGarantia, RegistrosTab } from "@/types/registros";

interface RegistrosTableProps {
  activeTab: RegistrosTab;
  paginatedData: (Venta | OrdenEntrega | Garantia | OrdenGarantia)[];
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
}

export function RegistrosTable({
  activeTab,
  paginatedData,
  totalPages,
  currentPage,
  handlePageChange
}: RegistrosTableProps) {
  const styles = {
    tableWrapper: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl",
    table: "w-full text-center border-collapse",
    th: "px-6 py-4 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-800 text-center",
    td: "px-6 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-center",
    tr: "hover:bg-slate-800/20 transition-colors",
    imeiBadge: "font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-secondary text-xs font-bold",
    folioBadge: "font-mono bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800 text-blue-400 text-[12px] font-black uppercase tracking-wider whitespace-nowrap",
    zonaBadge: "inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap",
    userBadge: "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700 whitespace-nowrap",
    pagination: "flex items-center justify-between border-t border-slate-800/60 px-6 py-4",
    pBtn: (disabled: boolean) =>
      `px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold transition-all ${disabled
        ? "opacity-30 cursor-not-allowed text-slate-500"
        : "hover:bg-slate-700 hover:text-white cursor-pointer"
      }`
  };

  return (
    <div className={styles.tableWrapper}>
      <div className="overflow-x-auto custom-scrollbar">
        {activeTab === "ventas" ? (
          /* TABLA DE VENTAS */
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>IMEI</th>
                <th className={`${styles.th} w-56 min-w-[200px]`}>Producto</th>
                <th className={`${styles.th} w-28 min-w-[90px]`}>Vendedor</th>
                <th className={styles.th}>Repartidor / Ubicación</th>
                <th className={styles.th}>Costo</th>
                <th className={`${styles.th} w-32 min-w-[120px] whitespace-nowrap`}>Fecha Venta</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                (paginatedData as Venta[]).map((venta) => (
                  <tr key={venta.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.imeiBadge}>{venta.imei}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white flex items-center gap-2 justify-center">
                          {venta.productos?.marca} {venta.productos?.modelo}
                          <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-2 ml-1">
                            {venta.productos?.color}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 justify-center text-[10px] text-slate-400 font-bold bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800/60">
                          <span>RAM {venta.productos?.ram}</span>
                          <span>•</span>
                          <span>ALM {venta.productos?.almacenamiento}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.userBadge}>
                        <span className="material-symbols-outlined text-[10px]">person</span>
                        {venta.vendedor?.username || venta.vendedor_nombre || "Desconocido"}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.zonaBadge}>
                        {venta.repartidor?.nombre || "Sin Asignar"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className="text-secondary font-mono font-bold">
                        ${new Intl.NumberFormat("es-AR").format(venta.precio_costo)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <span className="text-slate-300 font-medium">
                          {new Date(venta.fecha_venta).toLocaleDateString("es-MX", {
                            timeZone: "America/Tijuana",
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-slate-500 text-[10px] uppercase">
                          {new Date(venta.fecha_venta).toLocaleTimeString("es-MX", {
                            timeZone: "America/Tijuana",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                    No se encontraron ventas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : activeTab === "garantias" ? (
          /* TABLA DE GARANTÍAS */
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} w-[15%] min-w-[130px]`}>IMEI</th>
                <th className={`${styles.th} w-[20%] min-w-[160px]`}>Producto</th>
                <th className={`${styles.th} w-[12%] min-w-[100px]`}>Solicitado por</th>
                <th className={`${styles.th} w-[13%] min-w-[110px]`}>Repartidor / Ubicación</th>
                <th className={`${styles.th} w-[25%] min-w-[180px]`}>Motivo</th>
                <th className={`${styles.th} w-[15%] min-w-[130px] whitespace-nowrap`}>Fecha Garantía</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                (paginatedData as Garantia[]).map((garantia) => (
                  <tr key={garantia.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.imeiBadge}>{garantia.imei}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white flex items-center gap-2 justify-center">
                          {garantia.productos?.marca} {garantia.productos?.modelo}
                          <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-2 ml-1">
                            {garantia.productos?.color}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 justify-center text-[10px] text-slate-400 font-bold bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800/60">
                          <span>RAM {garantia.productos?.ram}</span>
                          <span>•</span>
                          <span>ALM {garantia.productos?.almacenamiento}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.userBadge}>
                        <span className="material-symbols-outlined text-[10px]">person</span>
                        {garantia.solicitante?.username || garantia.solicitante_nombre || "Desconocido"}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.zonaBadge}>
                        {garantia.repartidor?.nombre || "Sin Asignar"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className="text-left text-xs text-slate-400 line-clamp-2 hover:line-clamp-none transition-all duration-300 w-full" title={garantia.motivo}>
                        {garantia.motivo}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <span className="text-slate-300 font-medium">
                          {new Date(garantia.fecha_garantia).toLocaleDateString("es-MX", {
                            timeZone: "America/Tijuana",
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-slate-500 text-[10px] uppercase">
                          {new Date(garantia.fecha_garantia).toLocaleTimeString("es-MX", {
                            timeZone: "America/Tijuana",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                    No se encontraron garantías con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : activeTab === "ordenes" ? (
          /* TABLA DE ÓRDENES DE ENTREGA */
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} w-44 min-w-[170px] whitespace-nowrap`}>Folio</th>
                <th className={`${styles.th} w-32`}>Cliente / Teléfono</th>
                <th className={`${styles.th} w-36`}>Celular</th>
                <th className={`${styles.th} w-20`}>Vendedor</th>
                <th className={`${styles.th} w-28`}>Zona / Repartidor</th>
                <th className={`${styles.th} w-28`}>Entrega programada</th>
                <th className={`${styles.th} w-20`}>Creada</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                (paginatedData as OrdenEntrega[]).map((orden) => (
                  <tr key={orden.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.folioBadge}>{orden.folio}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white">{orden.nombre_cliente}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{orden.telefono}</div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white">{orden.celular}</div>
                        <div className="text-[10px] text-slate-500 uppercase mt-0.5">{orden.color_celular}</div>
                        {orden.imei && (
                          <span className="mt-1 text-[9px] bg-slate-950 text-slate-400 px-1 py-0.5 rounded font-mono border border-slate-800">
                            IMEI: {orden.imei}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div className={styles.userBadge}>
                        <span className="material-symbols-outlined text-[10px]">person</span>
                        {orden.vendedor?.username || orden.vendedor_nombre || "Desconocido"}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center gap-1">
                        <span className={styles.zonaBadge}>{orden.zona}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {orden.repartidor || orden.repartidores?.nombre || "Sin Asignar"}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {orden.fecha_entrega ? (
                        <div className="flex flex-col items-center">
                          <span className="text-slate-300 font-medium text-xs">
                            {(() => {
                              const [y, m, d] = orden.fecha_entrega.split('-').map(Number);
                              return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", {
                                timeZone: "UTC",
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              });
                            })()}
                          </span>
                          {orden.hora_entrega && (
                            <span className="text-slate-500 text-[10px]">{orden.hora_entrega.slice(0, 5)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Sin fecha</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className="text-xs text-slate-500">
                        {new Date(orden.created_at).toLocaleDateString("es-MX", {
                          timeZone: "America/Tijuana",
                          day: "2-digit",
                          month: "short"
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                    No se encontraron órdenes con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          /* TABLA DE ÓRDENES DE GARANTÍA */
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} w-44 min-w-[170px] whitespace-nowrap`}>Folio</th>
                <th className={`${styles.th} w-32`}>Cliente / Teléfono</th>
                <th className={`${styles.th} w-36`}>Equipo</th>
                <th className={`${styles.th} w-20`}>Vendedor</th>
                <th className={`${styles.th} w-28`}>Zona</th>
                <th className={`${styles.th} w-56 min-w-[200px]`}>Motivo y Falla</th>
                <th className={`${styles.th} w-20`}>Creada</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                (paginatedData as OrdenGarantia[]).map((orden) => (
                  <tr key={orden.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.folioBadge}>{orden.folio}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white">{orden.nombre_cliente}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{orden.telefono}</div>
                        {orden.tag && (
                          <span className="mt-1.5 px-2.5 py-0.5 text-xs bg-slate-950 border border-slate-800 rounded font-mono text-secondary font-bold uppercase tracking-wider">
                            TAG: {orden.tag}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white">{orden.modelo}</div>
                        {orden.imei && (
                          <span className="mt-1 text-[9px] bg-slate-950 text-slate-400 px-1 py-0.5 rounded font-mono border border-slate-800">
                            IMEI: {orden.imei}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.userBadge}>
                        <span className="material-symbols-outlined text-[10px]">person</span>
                        {orden.vendedor?.username || orden.vendedor_nombre || "Desconocido"}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.zonaBadge}>{orden.zona}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white text-xs line-clamp-1" title={orden.motivo_garantia}>
                          {orden.motivo_garantia}
                        </div>
                        <div 
                          className="text-[10px] text-slate-400 mt-1 line-clamp-2 hover:line-clamp-none transition-all duration-300 w-full text-center" 
                          title={orden.descripcion_falla}
                        >
                          {orden.descripcion_falla}
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className="text-xs text-slate-500">
                        {new Date(orden.created_at).toLocaleDateString("es-MX", {
                          timeZone: "America/Tijuana",
                          day: "2-digit",
                          month: "short"
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                    No se encontraron órdenes de garantía con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.pBtn(currentPage === 1)}
          >
            Anterior
          </button>
          <span className="text-slate-400 text-xs">Página {currentPage} de {totalPages}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.pBtn(currentPage === totalPages)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
