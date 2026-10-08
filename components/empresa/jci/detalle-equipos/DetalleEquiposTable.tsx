'use client';

// ─── Grupo 1: React y Next.js ───────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Grupo 2: Tipos e Interfaces ────────────────────────────────────────────
import type {
  StockConcesionItem,
  VentaItem,
  DetalleEquiposTab,
} from '@/types/detalle-equipos-jci';

interface DetalleEquiposTableProps {
  activeTab: DetalleEquiposTab;
  paginatedData: (StockConcesionItem | VentaItem)[];
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
}

// Formateador reutilizable en zona horaria Tijuana para evitar instanciarlo en cada celda
const tijuanaDateFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Tijuana',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Formatea una fecha ISO a cadena corta DD/MM/AAAA en horario de Tijuana.
 */
function formatearFechaTijuana(fechaIso: string): string {
  try {
    return tijuanaDateFormatter.format(new Date(fechaIso));
  } catch {
    return '—';
  }
}

/**
 * Tabla unificada para la sección Detalle de Equipos.
 * Renderiza 4 columnas en concesión física y 5 columnas para equipos vendidos (concesión y crédito).
 */
export function DetalleEquiposTable({
  activeTab,
  paginatedData,
  totalPages,
  currentPage,
  handlePageChange,
}: DetalleEquiposTableProps) {
  const [copiedImei, setCopiedImei] = useState<string | null>(null);

  /**
   * Copia el IMEI al portapapeles con fallback seguro y activa feedback flotante estilo Seguimiento.
   */
  const handleCopyImei = async (imei: string) => {
    let copied = false;

    // Intento 1: Clipboard API moderna (requiere HTTPS / localhost)
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(imei);
        copied = true;
      } catch {
        copied = false;
      }
    }

    // Intento 2: Fallback universal execCommand para móviles e IP local (HTTP)
    if (!copied && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = imei;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand("copy");
        textArea.remove();
      } catch (err) {
        console.error("Error al copiar IMEI:", err);
      }
    }

    setCopiedImei(imei);
    setTimeout(() => setCopiedImei(null), 1500);
  };

  const styles = {
    tableWrapper: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl",
    table: "w-full text-center border-collapse",
    th: "px-6 py-4 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-800 text-center",
    td: "px-6 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-center",
    tr: "hover:bg-slate-800/20 transition-colors",
    imeiBadge: "inline-block font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-secondary text-xs font-bold cursor-pointer hover:border-secondary/40 active:scale-95 transition-all select-none",
    zonaBadge: "inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap",
    userBadge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700 whitespace-nowrap",
    pagination: "flex items-center justify-between border-t border-slate-800/60 px-6 py-4",
    paginationButton: (disabled: boolean) =>
      `px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold transition-all ${
        disabled
          ? "opacity-30 cursor-not-allowed text-slate-500"
          : "hover:bg-slate-700 hover:text-white cursor-pointer text-slate-300"
      }`,
  };

  return (
    <div className={styles.tableWrapper}>
      <div className="overflow-x-auto custom-scrollbar">
        {activeTab === 'concesion' ? (
          /* ─── TABLA 1: EQUIPOS EN STOCK A CONCESIÓN (4 COLUMNAS) ─────────────── */
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} text-left min-w-[290px] sm:min-w-[320px]`}>Modelo</th>
                <th className={`${styles.th} min-w-[170px]`}>IMEI</th>
                <th className={`${styles.th} min-w-[150px] whitespace-nowrap`}>Entrada</th>
                <th className={`${styles.th} min-w-[160px]`}>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                (paginatedData as StockConcesionItem[]).map((equipoConcesion) => (
                  <tr key={equipoConcesion.imei} className={styles.tr}>
                    {/* 1. Modelo (Producto) */}
                    <td className={`${styles.td} text-left`}>
                      <div className="flex flex-col items-start">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>
                            {equipoConcesion.productos?.marca || "—"} {equipoConcesion.productos?.modelo || "Modelo no asignado"}
                          </span>
                          {equipoConcesion.productos?.color && (
                            <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-2 ml-1 whitespace-nowrap">
                              {equipoConcesion.productos.color}
                            </span>
                          )}
                        </div>
                        {(equipoConcesion.productos?.ram || equipoConcesion.productos?.almacenamiento) && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800/60 whitespace-nowrap">
                            {equipoConcesion.productos?.ram && <span>RAM {equipoConcesion.productos.ram}</span>}
                            {equipoConcesion.productos?.ram && equipoConcesion.productos?.almacenamiento && <span>•</span>}
                            {equipoConcesion.productos?.almacenamiento && <span>ALM {equipoConcesion.productos.almacenamiento}</span>}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. IMEI */}
                    <td className={styles.td}>
                      <div className="relative flex items-center justify-center">
                        {copiedImei === equipoConcesion.imei && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 border border-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            ¡Copiado!
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyImei(equipoConcesion.imei)}
                          className={styles.imeiBadge}
                          title="Haz clic para copiar IMEI"
                        >
                          {equipoConcesion.imei}
                        </button>
                      </div>
                    </td>

                    {/* 3. Entrada (Fecha de Ingreso) */}
                    <td className={styles.td}>
                      <span className="text-slate-300 font-medium">
                        {formatearFechaTijuana(equipoConcesion.fecha_ingreso)}
                      </span>
                    </td>

                    {/* 4. Ubicación (Repartidor / Zona) */}
                    <td className={styles.td}>
                      <span className={styles.zonaBadge}>
                        {equipoConcesion.repartidores?.nombre || "Sin Asignar"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                    <span className="material-symbols-outlined text-3xl mb-1.5 block opacity-40">
                      inventory_2
                    </span>
                    No se encontraron equipos en stock a concesión con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          /* ─── TABLA 2 y 3: EQUIPOS VENDIDOS (5 COLUMNAS: CONCESIÓN Y CRÉDITO) ─── */
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} text-left min-w-[290px] sm:min-w-[320px]`}>Modelo</th>
                <th className={`${styles.th} min-w-[170px]`}>IMEI</th>
                <th className={`${styles.th} min-w-[150px] whitespace-nowrap`}>Entrada</th>
                <th className={`${styles.th} min-w-[150px] whitespace-nowrap`}>Salida</th>
                <th className={`${styles.th} min-w-[160px]`}>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                (paginatedData as VentaItem[]).map((equipoVendido) => (
                  <tr key={equipoVendido.id} className={styles.tr}>
                    {/* 1. Modelo (Producto) */}
                    <td className={`${styles.td} text-left`}>
                      <div className="flex flex-col items-start">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>
                            {equipoVendido.productos?.marca || "—"} {equipoVendido.productos?.modelo || "Modelo no asignado"}
                          </span>
                          {equipoVendido.productos?.color && (
                            <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-2 ml-1 whitespace-nowrap">
                              {equipoVendido.productos.color}
                            </span>
                          )}
                        </div>
                        {(equipoVendido.productos?.ram || equipoVendido.productos?.almacenamiento) && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800/60 whitespace-nowrap">
                            {equipoVendido.productos?.ram && <span>RAM {equipoVendido.productos.ram}</span>}
                            {equipoVendido.productos?.ram && equipoVendido.productos?.almacenamiento && <span>•</span>}
                            {equipoVendido.productos?.almacenamiento && <span>ALM {equipoVendido.productos.almacenamiento}</span>}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. IMEI */}
                    <td className={styles.td}>
                      <div className="relative flex items-center justify-center">
                        {copiedImei === equipoVendido.imei && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 border border-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            ¡Copiado!
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyImei(equipoVendido.imei)}
                          className={styles.imeiBadge}
                          title="Haz clic para copiar IMEI"
                        >
                          {equipoVendido.imei}
                        </button>
                      </div>
                    </td>

                    {/* 3. Entrada (Fecha de Ingreso a Stock) */}
                    <td className={styles.td}>
                      <span className="text-slate-300 font-medium">
                        {formatearFechaTijuana(equipoVendido.fecha_ingreso)}
                      </span>
                    </td>

                    {/* 4. Salida (Fecha de Venta Concretada) */}
                    <td className={styles.td}>
                      <span className="text-slate-300 font-medium">
                        {formatearFechaTijuana(equipoVendido.fecha_venta)}
                      </span>
                    </td>

                    {/* 5. Vendedor */}
                    <td className={styles.td}>
                      <div className={styles.userBadge}>
                        <span className="material-symbols-outlined text-[12px] text-slate-400">person</span>
                        <span>{equipoVendido.vendedor?.username || equipoVendido.vendedor_nombre || "Desconocido"}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                    <span className="material-symbols-outlined text-3xl mb-1.5 block opacity-40">
                      sell
                    </span>
                    {activeTab === 'vendidos_concesion'
                      ? "No se encontraron equipos vendidos a concesión con los filtros seleccionados."
                      : "No se encontraron equipos vendidos a crédito con los filtros seleccionados."}
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
            className={styles.paginationButton(currentPage === 1)}
          >
            Anterior
          </button>
          <span className="text-slate-400 text-xs">Página {currentPage} de {totalPages}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.paginationButton(currentPage === totalPages)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

