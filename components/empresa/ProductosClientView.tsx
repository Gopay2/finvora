'use client';

import React, { useState, useMemo } from "react";
import EditProductButton from "@/components/empresa/EditProductButton";
import DeleteProductButton from "@/components/empresa/DeleteProductButton";

interface Product {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
  ram: string;
  precio: number;
}

interface ProductosClientViewProps {
  productos: Product[];
}

const styles = {
  tableWrapper: "bg-slate-900/20 border border-slate-800 rounded-2xl overflow-x-auto custom-scrollbar",
  table: "w-full min-w-[700px]",
  th: "px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest whitespace-nowrap text-center",
  td: "px-6 py-4 text-sm text-slate-300 border-b border-slate-800/50 whitespace-nowrap text-center",
  tr: "hover:bg-white/5 transition-colors",
  label: "text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1",
  select: "w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 text-slate-300 rounded-xl px-3 py-2.5 text-[11px] md:text-xs font-bold uppercase tracking-tight focus:outline-none transition-colors appearance-none cursor-pointer text-center",
};

export default function ProductosClientView({ productos }: ProductosClientViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedAlmacenamiento, setSelectedAlmacenamiento] = useState("");
  const [selectedRam, setSelectedRam] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Opciones únicas extraídas directamente del catálogo de productos
  const marcasList = useMemo(() => {
    const set = new Set<string>();
    productos.forEach(p => {
      if (p.marca && p.marca.trim()) set.add(p.marca.trim().toUpperCase());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  const almacenamientosList = useMemo(() => {
    const set = new Set<string>();
    productos.forEach(p => {
      if (p.almacenamiento && p.almacenamiento.trim()) set.add(p.almacenamiento.trim().toUpperCase());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  const ramsList = useMemo(() => {
    const set = new Set<string>();
    productos.forEach(p => {
      if (p.ram && p.ram.trim()) set.add(p.ram.trim().toUpperCase());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  const coloresList = useMemo(() => {
    const set = new Set<string>();
    productos.forEach(p => {
      if (p.color && p.color.trim()) set.add(p.color.trim().toUpperCase());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  // Filtrado reactivo en tiempo real
  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      // 1. Buscador en vivo (Modelo o Marca)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesModelo = (p.modelo || "").toLowerCase().includes(query);
        const matchesMarca = (p.marca || "").toLowerCase().includes(query);
        if (!matchesModelo && !matchesMarca) return false;
      }

      // 2. Filtro por Marca
      if (selectedMarca && (p.marca || "").trim().toUpperCase() !== selectedMarca.toUpperCase()) {
        return false;
      }

      // 3. Filtro por Almacenamiento
      if (selectedAlmacenamiento && (p.almacenamiento || "").trim().toUpperCase() !== selectedAlmacenamiento.toUpperCase()) {
        return false;
      }

      // 4. Filtro por RAM
      if (selectedRam && (p.ram || "").trim().toUpperCase() !== selectedRam.toUpperCase()) {
        return false;
      }

      // 5. Filtro por Color
      if (selectedColor && (p.color || "").trim().toUpperCase() !== selectedColor.toUpperCase()) {
        return false;
      }

      return true;
    });
  }, [productos, searchQuery, selectedMarca, selectedAlmacenamiento, selectedRam, selectedColor]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedMarca ||
    selectedAlmacenamiento ||
    selectedRam ||
    selectedColor
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedMarca("");
    setSelectedAlmacenamiento("");
    setSelectedRam("");
    setSelectedColor("");
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta de Filtros de Búsqueda */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg space-y-4">
        {/* Fila 1: Buscador de texto en vivo y Hueco para Botón Limpiar */}
        <div className="grid grid-cols-12 md:grid-cols-4 gap-2.5 md:gap-4 items-center">
          {/* Campo de búsqueda (ocupa 9 cols en móvil y 3 de 4 columnas en PC, dejando el hueco fijo a la derecha) */}
          <div className="col-span-9 sm:col-span-10 md:col-span-3 relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Modelo o Marca"
              className="w-full h-[40px] bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 focus:border-secondary/70 rounded-xl pl-10 pr-4 text-base sm:text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Hueco reservado fijo para el Botón de Limpiar Filtros */}
          <div className="col-span-3 sm:col-span-2 md:col-span-1 flex items-center justify-end">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-[40px] w-full sm:w-auto px-2.5 sm:px-4 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer shadow-lg shadow-red-500/5 whitespace-nowrap"
                title="Limpiar Filtros"
              >
                <span className="material-symbols-outlined text-base">filter_alt_off</span>
                <span className="hidden sm:inline">Limpiar Filtros</span>
              </button>
            ) : (
              <div className="h-[40px] w-full" />
            )}
          </div>
        </div>

        {/* Fila 2: Selects de Marca, Almacenamiento, RAM y Color */}
        <div className="pt-3.5 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Selector de Marca */}
          <div className="flex flex-col">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">smartphone</span>
              Marca
            </label>
            <div className="relative w-full group">
              <div className={`${styles.select} flex items-center justify-center text-center truncate select-none group-focus-within:border-secondary/65`}>
                <span className="truncate uppercase">{(selectedMarca || "Todas").toUpperCase()}</span>
              </div>
              <select
                value={selectedMarca}
                onChange={(e) => setSelectedMarca(e.target.value)}
                suppressHydrationWarning
                aria-label="Filtrar por marca"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer uppercase text-left text-xs"
                style={{ colorScheme: "dark", fontSize: "12px" }}
              >
                <option value="" className="bg-slate-950 text-slate-400 font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                  {'\u00A0\u00A0'}TODAS
                </option>
                {marcasList.map((marca) => (
                  <option key={marca} value={marca} className="bg-slate-950 text-white font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    {'\u00A0\u00A0' + marca.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Almacenamiento */}
          <div className="flex flex-col">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">sd_card</span>
              Almacenamiento
            </label>
            <div className="relative w-full group">
              <div className={`${styles.select} flex items-center justify-center text-center truncate select-none group-focus-within:border-secondary/65`}>
                <span className="truncate uppercase">{(selectedAlmacenamiento || "Todos").toUpperCase()}</span>
              </div>
              <select
                value={selectedAlmacenamiento}
                onChange={(e) => setSelectedAlmacenamiento(e.target.value)}
                suppressHydrationWarning
                aria-label="Filtrar por almacenamiento"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer uppercase text-left text-xs"
                style={{ colorScheme: "dark", fontSize: "12px" }}
              >
                <option value="" className="bg-slate-950 text-slate-400 font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                  {'\u00A0\u00A0'}TODOS
                </option>
                {almacenamientosList.map((alm) => (
                  <option key={alm} value={alm} className="bg-slate-950 text-white font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    {'\u00A0\u00A0' + alm.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de RAM */}
          <div className="flex flex-col">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">memory</span>
              RAM
            </label>
            <div className="relative w-full group">
              <div className={`${styles.select} flex items-center justify-center text-center truncate select-none group-focus-within:border-secondary/65`}>
                <span className="truncate uppercase">{(selectedRam || "Todas").toUpperCase()}</span>
              </div>
              <select
                value={selectedRam}
                onChange={(e) => setSelectedRam(e.target.value)}
                suppressHydrationWarning
                aria-label="Filtrar por RAM"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer uppercase text-left text-xs"
                style={{ colorScheme: "dark", fontSize: "12px" }}
              >
                <option value="" className="bg-slate-950 text-slate-400 font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                  {'\u00A0\u00A0'}TODAS
                </option>
                {ramsList.map((ram) => (
                  <option key={ram} value={ram} className="bg-slate-950 text-white font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    {'\u00A0\u00A0' + ram.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Color */}
          <div className="flex flex-col">
            <label className={styles.label}>
              <span className="material-symbols-outlined text-xs">palette</span>
              Color
            </label>
            <div className="relative w-full group">
              <div className={`${styles.select} flex items-center justify-center text-center truncate select-none group-focus-within:border-secondary/65`}>
                <span className="truncate uppercase">{(selectedColor || "Todos").toUpperCase()}</span>
              </div>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                suppressHydrationWarning
                aria-label="Filtrar por color"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer uppercase text-left text-xs"
                style={{ colorScheme: "dark", fontSize: "12px" }}
              >
                <option value="" className="bg-slate-950 text-slate-400 font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                  {'\u00A0\u00A0'}TODOS
                </option>
                {coloresList.map((color) => (
                  <option key={color} value={color} className="bg-slate-950 text-white font-sans text-left text-xs" style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    {'\u00A0\u00A0' + color.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Marca</th>
              <th className={styles.th}>Modelo</th>
              <th className={styles.th}>Color</th>
              <th className={styles.th}>RAM</th>
              <th className={styles.th}>Alm.</th>
              <th className={styles.th}>Precio</th>
              <th className={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProductos.length > 0 ? (
              filteredProductos.map((p) => (
                <tr key={p.id} className={styles.tr}>
                  <td className={`${styles.td} font-bold text-white uppercase`}>{p.marca}</td>
                  <td className={styles.td}>{p.modelo}</td>
                  <td className={styles.td}>{p.color}</td>
                  <td className={styles.td}>{p.ram}</td>
                  <td className={styles.td}>{p.almacenamiento}</td>
                  <td className={styles.td}>
                    <span className="text-secondary font-mono font-bold">
                      ${new Intl.NumberFormat('es-AR').format(p.precio)}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className="flex items-center justify-center gap-2">
                      <EditProductButton product={p} />
                      <DeleteProductButton id={p.id} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                  {hasActiveFilters
                    ? "No se encontraron productos con los filtros seleccionados."
                    : "No hay modelos registrados todavía."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
