'use client';

// ─── React & State Imports ──────────────────────────────────────────────────
import React, { useState } from "react";

// ─── Component Imports ──────────────────────────────────────────────────────
import StockStatusSelector from "@/components/empresa/StockStatusSelector";
import StockUbicacionSelector from "@/components/empresa/StockUbicacionSelector";
import DeleteStockButton from "@/components/empresa/DeleteStockButton";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";

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
  table: "w-[980px] lg:w-full text-center border-collapse table-fixed",
  th: "px-3 md:px-4 py-4 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-800 text-center",
  td: "px-3 md:px-4 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-center",
  tr: "hover:bg-slate-800/20 transition-colors",
  imeiBadge: "font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-secondary text-xs",
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
  const [selectedEstado, setSelectedEstado] = useState<string>("");

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSelectedMarca("");
    setSelectedUbicacion("");
    setSelectedEstado("");
  };

  // Filtrado instantáneo en el cliente
  const filteredUnidades = unidades.filter((item) => {
    const matchMarca = !selectedMarca || item.productos?.marca === selectedMarca;
    const matchEstado = !selectedEstado || item.estado === selectedEstado;
    const matchUbicacion = !selectedUbicacion || item.zona === selectedUbicacion;
    return matchMarca && matchEstado && matchUbicacion;
  });

  const hasActiveFilters = selectedMarca !== "" || selectedUbicacion !== "" || selectedEstado !== "";

  return (
    <div className="space-y-6">
      {/* Barra de filtros premium en memoria */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-lg animate-in fade-in duration-300">
        <div className={styles.filterGrid}>
          {/* Selector de Marca */}
          <div className={styles.filterCol}>
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">smartphone</span>
              Marca
            </label>
            <select
              value={selectedMarca}
              onChange={(event) => setSelectedMarca(event.target.value)}
              className={styles.select}
              style={{ colorScheme: "dark" }}
            >
              <option value="">Todas</option>
              {marcas.map((marca) => (
                <option key={marca} value={marca} className="bg-slate-950 text-white font-sans text-left">
                  {marca}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Ubicación */}
          <div className={styles.filterCol}>
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">location_on</span>
              Ubicación
            </label>
            <select
              value={selectedUbicacion}
              onChange={(event) => setSelectedUbicacion(event.target.value)}
              className={styles.select}
              style={{ colorScheme: "dark" }}
            >
              <option value="">Todas</option>
              {repartidores.map((repartidor) => (
                <option key={repartidor.id} value={repartidor.id} className="bg-slate-950 text-white font-sans text-left">
                  {repartidor.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Estado */}
          <div className={styles.filterCol}>
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">published_with_changes</span>
              Estado
            </label>
            <select
              value={selectedEstado}
              onChange={(event) => setSelectedEstado(event.target.value)}
              className={styles.select}
              style={{ colorScheme: "dark" }}
            >
              <option value="">Todas</option>
              {estados.map((estado) => (
                <option key={estado} value={estado} className="bg-slate-950 text-white font-sans text-left">
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {/* Acciones de Limpieza y Descarga en el Extremo Derecho */}
          <div className="col-span-1 flex items-center justify-end gap-3.5 md:gap-2 md:ml-auto self-end mt-auto">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center md:gap-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl text-[11px] md:text-xs font-bold uppercase transition-all cursor-pointer shadow-lg shadow-red-500/5"
                title="Limpiar Filtros"
              >
                <span className="material-symbols-outlined text-base md:text-xl">filter_alt_off</span>
                <span className="hidden md:inline">Limpiar</span>
              </button>
            )}

            {canEdit && (
              <DownloadExcelButton
                data={filteredUnidades}
                type="stock"
                repartidores={repartidores}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Stock con los registros filtrados en tiempo real */}
      <div className={styles.tableWrapper}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} ${canEdit ? "w-[17%]" : "w-[18%]"}`}>IMEI</th>
                <th className={`${styles.th} ${canEdit ? "w-[24%]" : "w-[30%]"}`}>Producto</th>
                <th className={`${styles.th} ${canEdit ? "w-[19%]" : "w-[21%]"}`}>Repartidor/Ubicación</th>
                <th className={`${styles.th} ${canEdit ? "w-[15%]" : "w-[19%]"}`}>Estado</th>
                <th className={`${styles.th} ${canEdit ? "w-[11%]" : "w-[12%]"}`}>Fecha Ingreso</th>
                {canEdit && <th className={`${styles.th} w-[14%]`}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUnidades.length > 0 ? (
                filteredUnidades.map((unidad: StockItem) => (
                  <tr key={unidad.imei} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.imeiBadge}>{unidad.imei}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white flex items-center gap-2 justify-center">
                          {unidad.productos?.marca} {unidad.productos?.modelo}
                          <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-2 ml-1">{unidad.productos?.color}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 justify-center">
                          <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">RAM {unidad.productos?.ram}</span>
                          <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">ALM {unidad.productos?.almacenamiento}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <StockUbicacionSelector
                        imei={unidad.imei}
                        ubicacionActual={unidad.zona}
                        repartidores={repartidores}
                        disabled={!canEdit}
                      />
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center gap-1">
                        <StockStatusSelector
                          imei={unidad.imei}
                          estadoActual={unidad.estado}
                          disabled={!canEdit}
                          vendedores={vendedores}
                        />
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className="text-slate-500 text-xs whitespace-nowrap">
                        {new Date(unidad.fecha_ingreso).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    {canEdit && (
                      <td className={styles.td}>
                        <div className="flex items-center justify-center">
                          <DeleteStockButton imei={unidad.imei} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-20 text-center text-slate-500 italic">
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
