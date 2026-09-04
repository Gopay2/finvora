'use client';

// ─── React & State Imports ──────────────────────────────────────────────────
import React, { useState } from "react";

// ─── Component Imports ──────────────────────────────────────────────────────
import StockStatusSelector from "@/components/empresa/StockStatusSelector";
import StockUbicacionSelector from "@/components/empresa/StockUbicacionSelector";
import DeleteStockButton from "@/components/empresa/DeleteStockButton";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";
import InlineImeiEditor from "@/components/empresa/InlineImeiEditor";

// ─── Types and Interfaces ───────────────────────────────────────────────────
interface RepartidorOption {
  id: string;
  nombre: string;
}

interface ProductoInfo {
  marca: string;
  modelo: string;
  color: string | null;
  almacenamiento: string;
  ram: string;
}

interface StockItem {
  imei: string;
  zona: string | null;
  estado: string;
  fecha_ingreso: string;
  fecha_en_envio?: string | null;
  productos?: ProductoInfo;
}

interface Vendedor {
  id: string;
  username: string | null;
  role: string;
}

interface StockClientViewProps {
  unidades: StockItem[];
  marcas: string[];
  repartidores: RepartidorOption[];
  estados: string[];
  canEdit: boolean;
  vendedores: Vendedor[];
}

// ─── Styles Object ──────────────────────────────────────────────────────────
const styles = {
  tableWrapper: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden",
  table: "min-w-[800px] w-full border-collapse table-fixed",
  th: "px-3 md:px-4 py-4 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-800 text-center",
  thLeft: "px-5 md:px-8 py-4 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800 text-left",
  td: "px-3 md:px-4 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-center",
  tdLeft: "px-5 md:px-8 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-left",
  tr: "hover:bg-slate-800/20 transition-colors",
  imeiBadge: "font-mono bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800 text-secondary text-xs inline-flex items-center gap-1.5 shadow-sm",
  filterGrid: "grid grid-cols-2 md:flex md:flex-wrap md:items-end gap-3 md:gap-4",
  filterCol: "col-span-1 flex flex-col",
  label: "text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1",
  select: "w-full md:w-44 bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 text-slate-300 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-[11px] md:text-xs font-bold uppercase tracking-tight focus:outline-none focus:border-secondary/65 transition-colors appearance-none cursor-pointer text-center",
};

// ─── Main Component ─────────────────────────────────────────────────────────
/**
 * Componente cliente para visualizar, buscar y filtrar en memoria
 * el listado de Stock Disponible en tiempo real, resolviendo ubicaciones y estados.
 */
export default function StockClientView({
  unidades = [],
  marcas = [],
  repartidores = [],
  estados = [],
  canEdit = false,
  vendedores = []
}: StockClientViewProps) {
  // Estados reactivos para los filtros en memoria
  const [selectedMarca, setSelectedMarca] = useState<string>("");
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>("");
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);

  // Lista de estados disponibles
  const statusList = estados.length > 0 ? estados : ["Disponible", "A consultar", "En envío", "Vendido", "Recambio"];

  // Toggle de filtro por estado
  const toggleEstado = (st: string) => {
    setSelectedEstados((prev) =>
      prev.includes(st) ? prev.filter((e) => e !== st) : [...prev, st]
    );
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSelectedMarca("");
    setSelectedUbicacion("");
    setSelectedEstados([]);
  };

  // Filtrado instantáneo en el cliente
  const filteredUnidades = unidades.filter((item) => {
    const matchMarca = !selectedMarca || (item.productos?.marca ? item.productos.marca.toUpperCase() === selectedMarca.toUpperCase() : false);
    const matchEstado = selectedEstados.length === 0 || selectedEstados.includes(item.estado);
    const matchUbicacion = !selectedUbicacion || item.zona === selectedUbicacion;
    return matchMarca && matchEstado && matchUbicacion;
  });

  const hasActiveFilters = selectedMarca !== "" || selectedUbicacion !== "" || selectedEstados.length > 0;

  // Helper para estilos de los chips de estado
  const getStatusChipStyle = (estadoName: string, isSelected: boolean) => {
    const norm = estadoName.toLowerCase();
    if (norm.includes("disponible")) {
      return isSelected
        ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/80 shadow-emerald-950/50"
        : "bg-slate-950/40 text-emerald-500/80 border-emerald-900/40 hover:border-emerald-500/40 hover:text-emerald-300";
    }
    if (norm.includes("consultar")) {
      return isSelected
        ? "bg-purple-950/60 text-purple-300 border-purple-500/80 shadow-purple-950/50"
        : "bg-slate-950/40 text-purple-500/80 border-purple-900/40 hover:border-purple-500/40 hover:text-purple-300";
    }
    if (norm.includes("envío") || norm.includes("envio")) {
      return isSelected
        ? "bg-amber-950/60 text-amber-300 border-amber-500/80 shadow-amber-950/50"
        : "bg-slate-950/40 text-amber-500/80 border-amber-900/40 hover:border-amber-500/40 hover:text-amber-300";
    }
    if (norm.includes("vendido")) {
      return isSelected
        ? "bg-blue-950/60 text-blue-300 border-blue-500/80 shadow-blue-950/50"
        : "bg-slate-950/40 text-blue-500/80 border-blue-900/40 hover:border-blue-500/40 hover:text-blue-300";
    }
    return isSelected
      ? "bg-rose-950/60 text-rose-300 border-rose-500/80 shadow-rose-950/50"
      : "bg-slate-950/40 text-rose-500/80 border-rose-900/40 hover:border-rose-500/40 hover:text-rose-300";
  };

  const getStatusBadgeStyle = (estadoName: string, isSelected: boolean) => {
    const norm = estadoName.toLowerCase();
    if (norm.includes("disponible")) {
      return isSelected
        ? "bg-emerald-500 text-slate-950 font-bold"
        : "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40";
    }
    if (norm.includes("consultar")) {
      return isSelected
        ? "bg-purple-500 text-white font-bold"
        : "bg-purple-950/80 text-purple-400 border border-purple-800/40";
    }
    if (norm.includes("envío") || norm.includes("envio")) {
      return isSelected
        ? "bg-amber-500 text-slate-950 font-bold"
        : "bg-amber-950/80 text-amber-400 border border-amber-800/40";
    }
    if (norm.includes("vendido")) {
      return isSelected
        ? "bg-blue-500 text-white font-bold"
        : "bg-blue-950/80 text-blue-400 border border-blue-800/40";
    }
    return isSelected
      ? "bg-rose-500 text-white font-bold"
      : "bg-rose-950/80 text-rose-400 border border-rose-800/40";
  };

  return (
    <div className="space-y-6">
      {/* Barra de filtros premium en memoria */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-lg animate-in fade-in duration-300 space-y-4">
        {/* Fila 1: Selects de Marca y Ubicación */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {/* Selector de Marca */}
          <div className="flex flex-col">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">smartphone</span>
              Marca
            </label>
            <div className="relative w-36 md:w-44 group">
              <div className={`${styles.select} flex items-center justify-center text-center truncate select-none group-focus-within:border-secondary/65`}>
                <span className="truncate uppercase">{(selectedMarca || "Todas").toUpperCase()}</span>
              </div>
              <select
                value={selectedMarca}
                onChange={(event) => setSelectedMarca(event.target.value)}
                suppressHydrationWarning
                aria-label="Filtrar por marca"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer uppercase text-left text-xs"
                style={{ colorScheme: "dark", fontSize: "12px" }}
              >
                <option value="" className="bg-slate-950 text-slate-400 font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                  {'\u00A0\u00A0'}TODAS
                </option>
                {marcas.map((marca) => (
                  <option key={marca} value={marca} className="bg-slate-950 text-white font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    {'\u00A0\u00A0' + marca.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Ubicación */}
          <div className="flex flex-col">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">location_on</span>
              Ubicación
            </label>
            <div className="relative w-36 md:w-44 group">
              <div className={`${styles.select} flex items-center justify-center text-center truncate select-none group-focus-within:border-secondary/65`}>
                <span className="truncate uppercase">{(repartidores.find(r => r.id === selectedUbicacion)?.nombre || "Todas").toUpperCase()}</span>
              </div>
              <select
                value={selectedUbicacion}
                onChange={(event) => setSelectedUbicacion(event.target.value)}
                suppressHydrationWarning
                aria-label="Filtrar por ubicación"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer uppercase text-left text-xs"
                style={{ colorScheme: "dark", fontSize: "12px" }}
              >
                <option value="" className="bg-slate-950 text-slate-400 font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                  {'\u00A0\u00A0'}TODAS
                </option>
                {repartidores.map((repartidor) => (
                  <option key={repartidor.id} value={repartidor.id} className="bg-slate-950 text-white font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    {'\u00A0\u00A0' + repartidor.nombre.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fila 2: Salto de línea con Estado y Acciones (Limpiar Filtros Rojo + Descargar Excel) */}
        <div className="pt-3.5 border-t border-slate-800/60 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0 max-w-full">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">published_with_changes</span>
              Estado
            </label>
            <div className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 sm:gap-2.5 overflow-x-auto custom-scrollbar pb-1 max-w-full">
              {statusList.map((st) => {
                const isSelected = selectedEstados.includes(st);
                const count = unidades.filter(u =>
                  u.estado === st &&
                  (!selectedMarca || u.productos?.marca?.toUpperCase() === selectedMarca.toUpperCase()) &&
                  (!selectedUbicacion || u.zona === selectedUbicacion)
                ).length;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleEstado(st)}
                    className={`
                      inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none shadow-sm shrink-0 sm:shrink
                      ${getStatusChipStyle(st, isSelected)}
                    `}
                  >
                    <span className="material-symbols-outlined text-[15px] sm:text-[16px] leading-none">
                      {isSelected ? "check_box" : "check_box_outline_blank"}
                    </span>
                    <span className="whitespace-nowrap">{st}</span>
                    <span className={`h-5 min-w-[20px] px-1.5 inline-flex items-center justify-center rounded-full text-[11px] sm:text-[12px] font-extrabold leading-none text-center ${getStatusBadgeStyle(st, isSelected)}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acciones de Limpieza (Rojo) y Descarga en la Parte Baja (Extremo Derecho) */}
          <div className="flex items-center gap-2.5 ml-auto self-end mt-auto">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/5"
                title="Limpiar Filtros"
              >
                <span className="material-symbols-outlined text-base md:text-xl shrink-0">filter_alt_off</span>
                <span className="hidden sm:inline text-xs font-bold uppercase">Limpiar Filtros</span>
              </button>
            )}
            <DownloadExcelButton
              data={filteredUnidades}
              type="stock"
              repartidores={repartidores}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Stock con los registros filtrados en tiempo real */}
      <div className={styles.tableWrapper}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.thLeft} ${canEdit ? "w-[35%]" : "w-[42%]"}`}>UBICACIÓN / ESTADO / INGRESO</th>
                <th className={`${styles.thLeft} ${canEdit ? "w-[51%]" : "w-[58%]"}`}>PRODUCTO / IMEI</th>
                {canEdit && <th className={`${styles.th} w-[14%] pr-8 md:pr-4 text-center`}>ACCIONES</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUnidades.length > 0 ? (
                filteredUnidades.map((unidad: StockItem) => (
                  <tr key={unidad.imei} className={styles.tr}>
                    <td className={styles.tdLeft}>
                      <div className="flex items-start gap-3">
                        <div className="pt-1 text-blue-500 shrink-0 select-none">
                          <span className="material-symbols-outlined text-[20px] leading-none">location_on</span>
                        </div>
                        <div className="flex flex-col items-start gap-1.5 min-w-0">
                          <StockUbicacionSelector
                            imei={unidad.imei}
                            ubicacionActual={unidad.zona}
                            repartidores={repartidores}
                            disabled={!canEdit}
                          />
                          <StockStatusSelector
                            imei={unidad.imei}
                            estadoActual={unidad.estado}
                            fechaEnEnvio={unidad.fecha_en_envio}
                            fechaIngreso={unidad.fecha_ingreso}
                            disabled={!canEdit}
                            vendedores={vendedores}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdLeft}>
                      <div className="flex items-start gap-3">
                        <div className="pt-1 text-slate-500 shrink-0 select-none">
                          <span className="material-symbols-outlined text-[20px] leading-none">smartphone</span>
                        </div>
                        <div className="flex flex-col items-start gap-1.5 min-w-0 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">
                              {unidad.productos?.marca} {unidad.productos?.modelo}
                            </span>
                            {unidad.productos?.color && (
                              <span className="text-[10px] font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded uppercase tracking-wider border border-slate-700/50">
                                {unidad.productos?.color}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto no-scrollbar max-w-full">
                            <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight shrink-0">
                              RAM {unidad.productos?.ram}
                            </span>
                            <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight shrink-0">
                              ALM {unidad.productos?.almacenamiento}
                            </span>
                            <div className="shrink-0">
                              <InlineImeiEditor
                                imei={unidad.imei}
                                canEdit={canEdit}
                                onImeiUpdated={(oldImei, newImei) => {
                                  unidad.imei = newImei;
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    {canEdit && (
                      <td className={`${styles.td} pr-8 md:pr-4`}>
                        <div className="flex items-center justify-center">
                          <DeleteStockButton imei={unidad.imei} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 3 : 2} className="px-6 py-20 text-center text-slate-500 italic">
                    {unidades.length === 0
                      ? "No hay unidades cargadas. Agregue en la sección Stock."
                      : "Ninguna unidad coincide con los filtros aplicados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
