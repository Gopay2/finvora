'use client';

import React, { useState, useMemo, useEffect } from "react";

import { MontosFijosPopoverSelector } from "./MontosFijosPopoverSelector";
import { formatMoney } from "@/utils/formatters";

import type { ConfigEngancheItem, CatalogProductOption } from "@/types/ordenes-entrega";

export type { CatalogProductOption };

/**
 * Propiedades del componente de sección de configuración de excepciones de enganche por equipo.
 */
interface ConfiguracionProductosSectionProps {
  // ─── Estado y Datos del Catálogo ──────────────────────────────────────────
  /** Lista completa de reglas de enganche configuradas por equipo */
  productConfigs: ConfigEngancheItem[];
  /** ID de la regla en edición activa, o null si está en modo creación */
  editingProductConfigId: string | null;
  /** Lista de nombres de proveedores disponibles en el catálogo */
  proveedoresDisponibles: string[];
  /** Proveedor actualmente seleccionado en el formulario */
  selectedProveedor: string;
  /** Marca actualmente seleccionada en el formulario */
  selectedMarca: string;
  /** ID del producto/modelo seleccionado */
  selectedProductId: string;
  /** Tipo de cliente seleccionado ('Si' para con historial, 'No' para sin historial) */
  selectedCliente: 'Si' | 'No';
  /** Lista de montos fijos seleccionados para la regla actual */
  montosFijosList: number[];
  /** Marcas disponibles filtradas por el proveedor seleccionado */
  marcasDisponibles: string[];
  /** Productos disponibles filtrados por proveedor y marca seleccionados */
  productosDisponibles: CatalogProductOption[];

  // ─── Referencias y Estado de UI ───────────────────────────────────────────
  /** Referencia al contenedor del formulario para auto-scroll durante la edición */
  productFormRef: React.RefObject<HTMLDivElement | null>;
  /** Referencia al contenedor del dropdown popover de montos para click-outside */
  productMontoDropdownRef: React.RefObject<HTMLDivElement | null>;
  /** Si el popover de montos fijos se encuentra desplegado */
  isProductMontoDropdownOpen: boolean;
  /** Si hay una mutación asíncrona pendiente (deshabilita inputs/botones) */
  isPending: boolean;

  // ─── Callbacks de Selección del Formulario ────────────────────────────────
  /** Callback al cambiar el proveedor seleccionado */
  onChangeProveedor: (proveedor: string) => void;
  /** Callback al cambiar la marca seleccionada */
  onChangeMarca: (marca: string) => void;
  /** Callback al cambiar el producto/modelo seleccionado */
  onChangeProduct: (productId: string) => void;
  /** Callback al cambiar el tipo de cliente seleccionado ('Si' | 'No') */
  onChangeCliente: (cliente: 'Si' | 'No') => void;

  // ─── Callbacks de Selección de Montos Fijos ───────────────────────────────
  /** Alterna la selección de un monto fijo prestablecido */
  onToggleProductMonto: (monto: number) => void;
  /** Añade un monto personalizado fuera de los presets */
  onAddCustomProductMonto: (monto: number) => void;
  /** Elimina un monto seleccionado */
  onRemoveProductMonto: (monto: number) => void;
  /** Limpia todos los montos fijos seleccionados */
  onClearProductMontos: () => void;
  /** Alterna la apertura/cierre del popover de montos fijos */
  onToggleProductMontoDropdown: () => void;

  // ─── Callbacks de Persistencia y Edición ──────────────────────────────────
  /** Guarda o actualiza la regla de enganche del equipo */
  onSaveProductConfig: () => void;
  /** Cancela el modo de edición y reinicia el formulario */
  onCancelEditProduct: () => void;
  /** Carga una regla existente en el formulario para editarla */
  onEditProductConfig: (config: ConfigEngancheItem) => void;
  /** Solicita confirmación y elimina una regla de enganche de equipo */
  onDeleteProductConfig: (id?: string, nombre?: string | null) => void;
}

const styles = {
  formCard: (isEditing: boolean) =>
    `bg-slate-900/50 backdrop-blur-xl border p-5 sm:p-6 rounded-3xl space-y-6 shadow-xl transition-all duration-300 relative z-30 ${
      isEditing ? "border-secondary/60 ring-2 ring-secondary/20" : "border-slate-800"
    }`,
  select: "w-full h-[42px] bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed custom-scrollbar",
  selectChevron: "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400",
  submitButton: "w-full h-[42px] px-4 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 rounded-xl text-sm font-semibold transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-center",
  tableCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10",
  tableHeaderRow: "border-b border-slate-800 bg-slate-950/60 text-xs font-bold text-slate-400 uppercase tracking-wider",
  badgeBase: "inline-flex items-center justify-center w-28 py-1 rounded-full text-xs font-bold border",
  badgeSi: "bg-teal-500/10 text-secondary border-teal-500/20",
  badgeNo: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  chipBase: "inline-flex items-center justify-center min-w-[44px] px-2 h-7 rounded-lg bg-slate-950 border font-bold text-xs shadow-sm shrink-0",
  chipSi: "border-secondary/30 text-secondary",
  chipNo: "border-amber-500/30 text-amber-300",
  paginationButton: (isDisabled: boolean) =>
    `px-3 py-1.5 bg-slate-900 border border-slate-700/70 rounded-xl text-xs font-bold transition-all ${
      isDisabled
        ? "opacity-30 cursor-not-allowed text-slate-500"
        : "hover:bg-slate-800 hover:text-white cursor-pointer text-slate-300"
    }`,
};

/**
 * Genera el título legible de un producto con sus especificaciones técnicas (almacenamiento, RAM, color opcional).
 *
 * @param producto - Información del producto del catálogo o de la regla de enganche
 * @param options - Opciones de visualización (incluirColor, fallback cuando es null)
 * @returns Nombre formateado del equipo (ej. "Apple iPhone 13 (128GB - 4GB)")
 */
function formatProductTitle(
  producto?: Partial<CatalogProductOption> | null,
  options?: { includeColor?: boolean; fallback?: string }
): string {
  if (!producto || (!producto.marca && !producto.modelo)) {
    return options?.fallback ?? "Equipo no especificado";
  }

  const specsList = [producto.almacenamiento, producto.ram].filter(Boolean);
  const specsText = specsList.length > 0 ? ` (${specsList.join(" - ")})` : "";
  const colorText = options?.includeColor && producto.color ? ` (${producto.color})` : "";
  const brandPrefix = producto.marca ? `${producto.marca} ` : "";

  return `${brandPrefix}${producto.modelo || ""}${specsText}${colorText}`.trim();
}

/**
 * Sección: Configuración de Enganches por Equipo
 * Define montos fijos en dinero para modelos específicos.
 */
export function ConfiguracionProductosSection({
  productConfigs,
  editingProductConfigId,
  proveedoresDisponibles,
  selectedProveedor,
  selectedMarca,
  selectedProductId,
  selectedCliente,
  montosFijosList,
  marcasDisponibles,
  productosDisponibles,
  productFormRef,
  productMontoDropdownRef,
  isProductMontoDropdownOpen,
  isPending,

  onChangeProveedor,
  onChangeMarca,
  onChangeProduct,
  onChangeCliente,
  onToggleProductMonto,
  onAddCustomProductMonto,
  onRemoveProductMonto,
  onClearProductMontos,
  onToggleProductMontoDropdown,
  onSaveProductConfig,
  onCancelEditProduct,
  onEditProductConfig,
  onDeleteProductConfig,
}: ConfiguracionProductosSectionProps) {
  const isEditing = Boolean(editingProductConfigId);

  // Paginación: 10 filas por página
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(productConfigs.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedConfigs = useMemo(() => {
    return productConfigs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [productConfigs, startIndex]);


  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Configuración por Equipo
        </h2>
        <p className="text-xs text-slate-400">
          Asigna montos fijos de enganche a celulares específicos. Sobrescribe las reglas de zona y generales.
        </p>
      </div>

      {/* FORMULARIO DE AGREGAR / EDITAR REGLA POR EQUIPO */}
      <div
        ref={productFormRef}
        className={styles.formCard(isEditing)}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              {isEditing ? "edit_note" : "add_circle"}
            </span>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              {isEditing ? "EDITAR EXCEPCIÓN POR EQUIPO" : "NUEVA EXCEPCIÓN POR EQUIPO"}
            </h3>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={onCancelEditProduct}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Cancelar edición
            </button>
          )}
        </div>

        {/* Grilla con 6 controles: 3 columnas x 2 filas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* 1. Selector de Proveedor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Proveedor
            </label>
            <div className="relative">
              <select
                value={selectedProveedor}
                onChange={(event) => onChangeProveedor(event.target.value)}
                disabled={isPending}
                className={styles.select}
                style={{ colorScheme: "dark" }}
                suppressHydrationWarning
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  Seleccionar proveedor...
                </option>
                {proveedoresDisponibles.map((proveedor) => (
                  <option key={proveedor} value={proveedor} className="bg-slate-950 text-white">
                    {proveedor}
                  </option>
                ))}
              </select>
              <span className={styles.selectChevron}>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </span>
            </div>
          </div>

          {/* 2. Selector de Marca */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Marca
            </label>
            <div className="relative">
              <select
                value={selectedMarca}
                onChange={(event) => onChangeMarca(event.target.value)}
                disabled={!selectedProveedor || isPending}
                className={styles.select}
                style={{ colorScheme: "dark" }}
                suppressHydrationWarning
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  {!selectedProveedor ? "Primero elija proveedor..." : "Seleccionar marca..."}
                </option>
                {marcasDisponibles.map((marca) => (
                  <option key={marca} value={marca} className="bg-slate-950 text-white">
                    {marca}
                  </option>
                ))}
              </select>
              <span className={styles.selectChevron}>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </span>
            </div>
          </div>

          {/* 3. Selector de Modelo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Modelo
            </label>
            <div className="relative">
              <select
                value={selectedProductId}
                onChange={(event) => onChangeProduct(event.target.value)}
                disabled={!selectedMarca || isPending}
                className={styles.select}
                style={{ colorScheme: "dark" }}
                suppressHydrationWarning
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  {!selectedMarca ? "Primero elija marca..." : "Seleccionar modelo..."}
                </option>
                {productosDisponibles.map((producto) => (
                  <option key={producto.id} value={producto.id} className="bg-slate-950 text-white">
                    {formatProductTitle(producto, { includeColor: true })}
                  </option>
                ))}
              </select>
              <span className={styles.selectChevron}>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </span>
            </div>
          </div>

          {/* 4. Selector de Tipo de Cliente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Tipo de Cliente
            </label>
            <div className="relative">
              <select
                value={selectedCliente}
                onChange={(event) => {
                  const clienteValue = event.target.value;
                  if (clienteValue === "Si" || clienteValue === "No") {
                    onChangeCliente(clienteValue);
                  }
                }}
                disabled={isPending}
                className={styles.select}
                style={{ colorScheme: "dark" }}
                suppressHydrationWarning
              >
                <option value="Si" className="bg-slate-950 text-white">
                  Con Historial
                </option>
                <option value="No" className="bg-slate-950 text-white">
                  Sin Historial
                </option>
              </select>
              <span className={styles.selectChevron}>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </span>
            </div>
          </div>

          {/* 5. Selector de Montos Fijos (Popover interactivo) */}
          <MontosFijosPopoverSelector
            selectedMontos={montosFijosList}
            onToggleMonto={onToggleProductMonto}
            onAddCustomMonto={onAddCustomProductMonto}
            onRemoveMonto={onRemoveProductMonto}
            onClear={onClearProductMontos}
            isOpen={isProductMontoDropdownOpen}
            onToggleOpen={onToggleProductMontoDropdown}
            dropdownRef={productMontoDropdownRef}
            accentColor={selectedCliente === "Si" ? "secondary" : "amber"}
            disabled={isPending}
          />

          {/* 6. Botón Enganche de Equipo / Guardar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold invisible select-none block">&nbsp;</label>
            <button
              type="button"
              onClick={onSaveProductConfig}
              disabled={isPending || montosFijosList.length === 0 || !selectedProductId}
              className={styles.submitButton}
            >
              {isEditing ? "Guardar Cambios" : "Agregar Enganche"}
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE EXCEPCIONES POR EQUIPO */}
      {productConfigs.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800/80 rounded-3xl space-y-2">
          <span className="material-symbols-outlined text-3xl text-slate-600">smartphone</span>
          <p className="text-sm text-slate-400 font-medium">
            No hay excepciones configuradas por equipo.
          </p>
          <p className="text-xs text-slate-500">
            Todos los equipos respetan actualmente la configuración de su <strong>Zona</strong> o la <strong>Configuración General</strong>.
          </p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className="py-3.5 px-6 text-left">Equipo</th>
                  <th className="px-6 py-3.5 text-center">Tipo de Cliente</th>
                  <th className="px-6 py-3.5 text-center">Montos de Enganche</th>
                  <th className="px-6 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {paginatedConfigs.map((config) => {
                  const productDisplayName = formatProductTitle(config.producto_info);
                  const isConHistorial = config.cliente_historial.toLowerCase() === "si";
                  const montos = config.montos_fijos || [];

                  return (
                    <tr
                      key={config.id || `${config.producto_id}-${config.cliente_historial}`}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      {/* Columna 1: Equipo */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-left">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-base shrink-0">smartphone</span>
                          <span className="text-xs font-semibold text-slate-100">
                            {productDisplayName}
                          </span>
                        </div>
                      </td>

                      {/* Columna 2: Tipo de Cliente */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <span
                            className={`${styles.badgeBase} ${
                              isConHistorial ? styles.badgeSi : styles.badgeNo
                            }`}
                          >
                            {isConHistorial ? "Con Historial" : "Sin Historial"}
                          </span>
                        </div>
                      </td>

                      {/* Columna 3: Montos de Enganche */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5 min-w-[140px]">
                          {montos.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">Sin montos</span>
                          ) : (
                            <>
                              {montos.slice(0, 3).map((monto) => (
                                <span
                                  key={monto}
                                  className={`${styles.chipBase} ${
                                    isConHistorial ? styles.chipSi : styles.chipNo
                                  }`}
                                >
                                  {formatMoney(monto)}
                                </span>
                              ))}
                              {montos.length > 3 && (
                                <span
                                  className="inline-flex items-center justify-center px-1.5 py-1 text-slate-400 font-bold text-xs select-none tracking-widest"
                                  title={`${montos.map((monto) => formatMoney(monto)).join(", ")}`}
                                >
                                  ...
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Columna 4: Acciones (Editar y Eliminar) */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditProductConfig(config)}
                            disabled={isPending}
                            title="Editar regla"
                            className="p-1.5 text-slate-400 hover:text-secondary hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const deleteProductDisplayName = formatProductTitle(config.producto_info, {
                                fallback: "este equipo",
                              });
                              onDeleteProductConfig(config.id, deleteProductDisplayName);
                            }}
                            disabled={isPending}
                            title="Eliminar regla"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN ABAJO DE LA TABLA (10 POR PÁGINA) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3.5 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setCurrentPage((prevPage) => Math.max(1, prevPage - 1))}
                disabled={currentPage === 1}
                className={styles.paginationButton(currentPage === 1)}
              >
                Anterior
              </button>
              <span className="text-slate-400 text-xs font-semibold">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prevPage) => Math.min(totalPages, prevPage + 1))}
                disabled={currentPage === totalPages}
                className={styles.paginationButton(currentPage === totalPages)}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

    </section>
  );
}
