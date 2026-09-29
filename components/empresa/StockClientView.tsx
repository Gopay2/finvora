'use client';

// ─── React & State Imports ──────────────────────────────────────────────────
import React, { useState, useMemo } from "react";

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
  activo?: boolean;
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
  estado_previo?: string | null;
  producto_id?: string;
  productos?: ProductoInfo;
  costo?: number;
  plaza?: string;
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
  table: "min-w-[1060px] md:min-w-[800px] w-full border-collapse table-fixed",
  th: "px-3 md:px-4 py-4 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-800 text-center whitespace-nowrap",
  thLeft: "px-5 md:px-8 py-4 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800 text-left whitespace-nowrap",
  td: "px-3 md:px-4 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-center",
  tdLeft: "px-5 md:px-8 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-left",
  tr: "hover:bg-slate-800/20 transition-colors",
  imeiBadge: "font-mono bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800 text-secondary text-xs inline-flex items-center gap-1.5 shadow-sm",
  filterGrid: "grid grid-cols-2 md:flex md:flex-wrap md:items-end gap-3 md:gap-4",
  filterCol: "col-span-1 flex flex-col",
  label: "text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1",
  select: "w-full md:w-44 h-[34px] md:h-[38px] bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 text-slate-300 rounded-xl px-3 md:px-4 text-[11px] md:text-xs font-bold uppercase tracking-tight focus:outline-none focus:border-secondary/65 transition-colors appearance-none cursor-pointer text-center",
  totalCostCard: "w-full h-[34px] md:h-[38px] bg-slate-950/80 border border-slate-800 text-emerald-400 rounded-xl px-2.5 md:px-3 text-xs md:text-sm font-bold tracking-tight flex items-center justify-center text-center select-none shadow-sm",
  btnClearFilters: "flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/5",
  costBadge: "font-bold text-emerald-400 text-xs sm:text-sm bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shadow-sm",
};

// ─── Pure Utility Functions ──────────────────────────────────────────────────
/**
 * Formatea valores numéricos monetarios separando miles con puntos.
 */
function formatPriceWithDots(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "0";
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Resuelve las clases de estilo Tailwind para el chip de estado seleccionado o en reposo.
 */
function getStatusChipStyle(estadoName: string, isSelected: boolean): string {
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
      ? "bg-yellow-950/60 text-yellow-300 border-yellow-400/80 shadow-yellow-950/50"
      : "bg-slate-950/40 text-yellow-400 border-yellow-500/60 hover:border-yellow-400/70 hover:text-yellow-300";
  }
  if (norm.includes("concesion") || norm.includes("concesión")) {
    return isSelected
      ? "bg-orange-950/60 text-orange-300 border-orange-500/80 shadow-orange-950/50"
      : "bg-slate-950/40 text-orange-500/80 border-orange-900/40 hover:border-orange-500/40 hover:text-orange-300";
  }
  if (norm.includes("vendido")) {
    return isSelected
      ? "bg-blue-950/60 text-blue-300 border-blue-500/80 shadow-blue-950/50"
      : "bg-slate-950/40 text-blue-500/80 border-blue-900/40 hover:border-blue-500/40 hover:text-blue-300";
  }
  if (norm.includes("test")) {
    return isSelected
      ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/80 shadow-cyan-950/50"
      : "bg-slate-950/40 text-cyan-400 border-cyan-900/40 hover:border-cyan-500/40 hover:text-cyan-300";
  }
  return isSelected
    ? "bg-rose-950/60 text-rose-300 border-rose-500/80 shadow-rose-950/50"
    : "bg-slate-950/40 text-rose-500/80 border-rose-900/40 hover:border-rose-500/40 hover:text-rose-300";
}

/**
 * Resuelve las clases de estilo para el badge circular de conteo de cada estado.
 */
function getStatusBadgeStyle(estadoName: string, isSelected: boolean): string {
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
      ? "bg-yellow-400 text-slate-950 font-bold"
      : "bg-yellow-950/80 text-yellow-400 border border-yellow-500/60";
  }
  if (norm.includes("concesion") || norm.includes("concesión")) {
    return isSelected
      ? "bg-orange-500 text-slate-950 font-bold"
      : "bg-orange-950/80 text-orange-400 border border-orange-800/40";
  }
  if (norm.includes("vendido")) {
    return isSelected
      ? "bg-blue-500 text-white font-bold"
      : "bg-blue-950/80 text-blue-400 border border-blue-800/40";
  }
  if (norm.includes("test")) {
    return isSelected
      ? "bg-cyan-400 text-slate-950 font-bold"
      : "bg-cyan-950/80 text-cyan-400 border border-cyan-500/60";
  }
  return isSelected
    ? "bg-rose-500 text-white font-bold"
    : "bg-rose-950/80 text-rose-400 border border-rose-800/40";
}

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
  const statusList = estados.length > 0 ? estados : ["Disponible", "A consultar", "En envío", "Concesión", "Vendido", "Recambio"];

  // Toggle de filtro por estado
  const toggleEstado = (targetEstado: string) => {
    setSelectedEstados((prevSelected) =>
      prevSelected.includes(targetEstado)
        ? prevSelected.filter((itemEstado) => itemEstado !== targetEstado)
        : [...prevSelected, targetEstado]
    );
  };

  // Limpiar todos los filtros activos
  const handleClearFilters = () => {
    setSelectedMarca("");
    setSelectedUbicacion("");
    setSelectedEstados([]);
  };

  // Filtrado instantáneo en memoria en el cliente
  const filteredUnidades = useMemo(() => {
    return unidades.filter((stockUnit) => {
      const matchMarca = !selectedMarca || (stockUnit.productos?.marca ? stockUnit.productos.marca.toUpperCase() === selectedMarca.toUpperCase() : false);
      const matchEstado = selectedEstados.length === 0 || selectedEstados.includes(stockUnit.estado);
      const matchUbicacion = !selectedUbicacion || stockUnit.zona === selectedUbicacion;
      return matchMarca && matchEstado && matchUbicacion;
    });
  }, [unidades, selectedMarca, selectedEstados, selectedUbicacion]);

  const hasActiveFilters = selectedMarca !== "" || selectedUbicacion !== "" || selectedEstados.length > 0;

  const totalGeneralCost = useMemo(() => {
    return filteredUnidades.reduce((totalAccumulator, currentUnit) => totalAccumulator + (Number(currentUnit.costo) || 0), 0);
  }, [filteredUnidades]);

  return (
    <div className="space-y-6">
      {/* Barra de filtros premium en memoria */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-lg animate-in fade-in duration-300 space-y-4">
        {/* Fila 1: Selects de Marca, Ubicación y Valor en Stock dinámico */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-3 md:gap-4">
          {/* Selector de Marca */}
          <div className="col-span-1 flex flex-col min-w-0">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">smartphone</span>
              Marca
            </label>
            <div className="relative w-full md:w-44 group">
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
                {marcas.map((marcaItem) => (
                  <option key={marcaItem} value={marcaItem} className="bg-slate-950 text-white font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    {'\u00A0\u00A0' + marcaItem.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Ubicación */}
          <div className="col-span-1 flex flex-col min-w-0">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">location_on</span>
              Ubicación
            </label>
            <div className="relative w-full md:w-44 group">
              <div className={`${styles.select} flex items-center justify-center text-center truncate select-none group-focus-within:border-secondary/65`}>
                <span className="truncate uppercase">{(() => {
                  const foundRepartidor = repartidores.find((repartidorItem) => repartidorItem.id === selectedUbicacion);
                  if (!foundRepartidor) return "Todas";
                  return foundRepartidor.nombre + (foundRepartidor.activo === false ? " (INACTIVO)" : "");
                })().toUpperCase()}</span>
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
                {repartidores
                  .filter((repartidorItem) => repartidorItem.activo !== false || unidades.some((unit) => unit.zona === repartidorItem.id))
                  .map((repartidorItem) => (
                    <option key={repartidorItem.id} value={repartidorItem.id} className="bg-slate-950 text-white font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                      {'\u00A0\u00A0' + repartidorItem.nombre.toUpperCase() + (repartidorItem.activo === false ? " (INACTIVO)" : "")}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Valor en Stock dinámico según ubicación/filtros */}
          <div className="col-span-2 md:col-span-1 flex flex-col min-w-0">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">payments</span>
              Valor en Stock
            </label>
            <div className="w-full md:w-44">
              <div className={styles.totalCostCard}>
                <span className="truncate">
                  ${formatPriceWithDots(totalGeneralCost)} MXN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2: Salto de línea con Estado y Acciones (Limpiar Filtros Rojo + Descargar Excel) */}
        <div className="pt-3.5 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div className="flex flex-col gap-2 w-full sm:w-auto min-w-0">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">published_with_changes</span>
              Estado
            </label>
            {/* Filtros de estado con desplazamiento horizontal en celular y ancho uniforme */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto custom-scrollbar no-scrollbar-on-mobile py-1 sm:flex-wrap">
              {statusList.map((estadoOption) => {
                const isSelected = selectedEstados.includes(estadoOption);
                const count = unidades.filter((unit) =>
                  unit.estado === estadoOption &&
                  (!selectedMarca || unit.productos?.marca?.toUpperCase() === selectedMarca.toUpperCase()) &&
                  (!selectedUbicacion || unit.zona === selectedUbicacion)
                ).length;

                return (
                  <button
                    key={estadoOption}
                    type="button"
                    onClick={() => toggleEstado(estadoOption)}
                    className={`
                      inline-flex items-center justify-between gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none shadow-sm shrink-0 whitespace-nowrap min-w-[125px] sm:min-w-[148px]
                      ${getStatusChipStyle(estadoOption, isSelected)}
                    `}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[15px] sm:text-[16px] leading-none shrink-0">
                        {isSelected ? "check_box" : "check_box_outline_blank"}
                      </span>
                      <span className="truncate whitespace-nowrap">{estadoOption}</span>
                    </div>
                    <span className={`h-5 min-w-[20px] px-1.5 inline-flex items-center justify-center rounded-full text-[11px] sm:text-[12px] font-extrabold leading-none text-center shrink-0 ${getStatusBadgeStyle(estadoOption, isSelected)}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acciones de Limpieza (Rojo) y Descarga en la Parte Baja (Extremo Derecho) */}
          <div className="flex items-center gap-2.5 self-end ml-auto mt-auto pt-1 sm:pt-0 shrink-0">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className={styles.btnClearFilters}
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
                <th className={`${styles.thLeft} ${canEdit ? "w-[29%] md:w-[30%]" : "w-[32%] md:w-[34%]"}`}>UBICACIÓN / ESTADO / INGRESO</th>
                <th className={`${styles.thLeft} ${canEdit ? "w-[39%] md:w-[38%]" : "w-[44%] md:w-[44%]"}`}>PRODUCTO / IMEI</th>
                <th className={`${styles.th} ${canEdit ? "w-[22%] md:w-[20%]" : "w-[24%] md:w-[22%]"} text-center`}>COSTO</th>
                {canEdit && <th className={`${styles.th} ${canEdit ? "w-[10%] md:w-[12%]" : ""} pr-8 md:pr-4 text-center`}>ACCIONES</th>}
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
                            estadoPrevio={unidad.estado_previo}
                            fechaIngreso={unidad.fecha_ingreso}
                            disabled={!canEdit}
                            vendedores={vendedores}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdLeft}>
                      <div className="flex items-start gap-3 w-full">
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
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
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
                    <td className={styles.td}>
                      {unidad.costo && unidad.costo > 0 ? (
                        <div className="flex items-center justify-center">
                          <span className={styles.costBadge}>
                            ${formatPriceWithDots(unidad.costo)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">
                          —
                        </span>
                      )}
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
                  <td colSpan={canEdit ? 4 : 3} className="px-6 py-20 text-center text-slate-500 italic">
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


