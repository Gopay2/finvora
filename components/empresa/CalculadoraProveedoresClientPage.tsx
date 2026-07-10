'use client';

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { styles, formatCurrency } from "./comprobantes-types";
import {
  agregarProductoProveedor,
  actualizarCostoProveedor,
  eliminarProductoProveedor,
} from "@/app/empresa/webapp/sueldos/proveedores/proveedores-actions";
import type { CatalogProduct, SupplierCostRecord } from "@/app/empresa/webapp/sueldos/proveedores/page";

interface CalculadoraProveedoresClientPageProps {
  catalogProducts: CatalogProduct[];
  initialAssignedCosts: SupplierCostRecord[];
}

export default function CalculadoraProveedoresClientPage({
  catalogProducts,
  initialAssignedCosts,
}: CalculadoraProveedoresClientPageProps) {
  const router = useRouter();
  const [proveedorActive, setProveedorActive] = useState<"Tijuana" | "Monterrey">("Tijuana");

  // Estados para agregar producto
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedProdId, setSelectedProdId] = useState("");
  const [costoInput, setCostoInput] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Estados de guardado inline
  const [editCosts, setEditCosts] = useState<{ [id: string]: string }>({});
  const [savingMap, setSavingMap] = useState<{ [id: string]: boolean }>({});
  const [savedMap, setSavedMap] = useState<{ [id: string]: boolean }>({});

  // Modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrar costos asignados al proveedor activo
  const activeAssignedCosts = useMemo(() => {
    return initialAssignedCosts.filter((c) => c.proveedor === proveedorActive);
  }, [initialAssignedCosts, proveedorActive]);

  // IDs de productos ya asignados a este proveedor
  const assignedProductIds = useMemo(() => {
    return activeAssignedCosts.map((c) => c.producto_id);
  }, [activeAssignedCosts]);

  // Productos disponibles en el catálogo para ser asignados
  const selectableProducts = useMemo(() => {
    return catalogProducts.filter((p) => !assignedProductIds.includes(p.id));
  }, [catalogProducts, assignedProductIds]);

  // Obtener marcas únicas ordenadas de los productos seleccionables
  const marcas = useMemo(() => {
    return Array.from(new Set(selectableProducts.map((p) => p.marca).filter(Boolean))).sort();
  }, [selectableProducts]);

  // Filtrar productos seleccionables por marca
  const filteredProducts = useMemo(() => {
    if (!selectedMarca) return [];
    return selectableProducts
      .filter((p) => p.marca === selectedMarca)
      .sort((a, b) => {
        const compModelo = a.modelo.localeCompare(b.modelo, undefined, { numeric: true, sensitivity: 'base' });
        if (compModelo !== 0) return compModelo;
        const compColor = a.color.localeCompare(b.color, undefined, { sensitivity: 'base' });
        if (compColor !== 0) return compColor;
        return a.almacenamiento.localeCompare(b.almacenamiento, undefined, { numeric: true });
      });
  }, [selectableProducts, selectedMarca]);

  const handleAgregar = () => {
    if (!selectedProdId) {
      setErrorMsg("Por favor, selecciona un producto del catálogo.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    const initialCosto = Number(costoInput) || 0;

    startTransition(async () => {
      const res = await agregarProductoProveedor(selectedProdId, proveedorActive, initialCosto);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Producto asignado con éxito.");
        setSelectedMarca("");
        setSelectedProdId("");
        setCostoInput("0");
        router.refresh();
      }
    });
  };

  const handleSaveCosto = async (id: string, originalCosto: number) => {
    const currentVal = editCosts[id];
    if (currentVal === undefined) return;

    const numericVal = Number(currentVal) || 0;

    // Si no cambió el valor, simplemente limpiar el estado local de edición
    if (numericVal === originalCosto) {
      setEditCosts((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      return;
    }

    setSavingMap((prev) => ({ ...prev, [id]: true }));
    const res = await actualizarCostoProveedor(id, numericVal);
    setSavingMap((prev) => ({ ...prev, [id]: false }));

    if (res.error) {
      alert(res.error);
    } else {
      setSavedMap((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setSavedMap((prev) => ({ ...prev, [id]: false }));
      }, 2000);

      // Limpiar edición para permitir que use el prop actualizado
      setEditCosts((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      router.refresh();
    }
  };

  const handleEliminar = (id: string, name: string) => {
    setDeleteModal({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    const res = await eliminarProductoProveedor(deleteModal.id);
    setIsDeleting(false);
    setDeleteModal(null);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex justify-end">
          <Link
            href="/empresa/webapp/sueldos"
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold cursor-pointer w-fit"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Costos de Proveedores
            </h1>
            <p className="text-xs text-slate-400">
              Administra qué productos se surten por proveedor y edita sus respectivos costos de compra.
            </p>
          </div>

          {/* Selector de Proveedor (Switch) */}
          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl gap-1 shrink-0 w-fit">
            {(["Tijuana", "Monterrey"] as const).map((prov) => (
              <button
                key={prov}
                type="button"
                onClick={() => {
                  setProveedorActive(prov);
                  setSelectedMarca("");
                  setSelectedProdId("");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${proveedorActive === prov
                    ? "bg-secondary text-slate-950 shadow-md shadow-secondary/10"
                    : "bg-transparent text-slate-400 hover:text-slate-200"
                  }`}
              >
                Proveedor {prov}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Bloque: Agregar Producto a Proveedor */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl space-y-4 text-sm">
        <h3 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base">add_circle</span>
          Asignar nuevo producto
        </h3>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Selector de Marca */}
          <div className="space-y-2 w-full md:w-56 shrink-0">
            <label className="text-xs font-semibold text-slate-400 ml-1">Marca:</label>
            <div className="relative flex items-center w-full">
              <select
                value={selectedMarca}
                onChange={(e) => {
                  setSelectedMarca(e.target.value);
                  setSelectedProdId("");
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer text-xs sm:text-sm h-[42px]"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">Elegir marca...</option>
                {marcas.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 pointer-events-none text-slate-500 text-base">
                keyboard_arrow_down
              </span>
            </div>
          </div>

          {/* Selector de Producto */}
          <div className="space-y-2 flex-1 w-full">
            <label className="text-xs font-semibold text-slate-400 ml-1">Modelo:</label>
            <div className="relative flex items-center w-full">
              <select
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value)}
                disabled={!selectedMarca}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer text-xs sm:text-sm h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ colorScheme: 'dark' }}
              >
                {!selectedMarca ? (
                  <option value="">Selecciona una marca primero...</option>
                ) : (
                  <>
                    <option value="">Elegir modelo del catálogo...</option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.modelo} ({p.color} - {p.almacenamiento})
                      </option>
                    ))}
                  </>
                )}
              </select>
              <span className="material-symbols-outlined absolute right-4 pointer-events-none text-slate-500 text-base">
                keyboard_arrow_down
              </span>
            </div>
          </div>

          {/* Costo Inicial */}
          <div className="space-y-2 w-full md:w-44 shrink-0">
            <label className="text-xs font-semibold text-slate-400 ml-1">Costo:</label>
            <div className="relative flex items-center w-full">
              <span className="absolute left-3 text-slate-400 font-bold text-xs pointer-events-none">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={costoInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*$/.test(val)) {
                    setCostoInput(val);
                  }
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2.5 text-[16px] sm:text-sm text-slate-200 focus:outline-none focus:border-secondary transition-all h-[42px] w-full text-center"
              />
            </div>
          </div>

          {/* Botón de Agregar */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleAgregar}
            className="h-[42px] px-6 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto text-xs"
          >
            {isPending ? (
              <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
            ) : (
              <span className="material-symbols-outlined text-base font-bold">add</span>
            )}
            Asignar
          </button>
        </div>

        {/* Notificaciones */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {successMsg}
          </div>
        )}
      </div>

      {/* Tabla de Productos Asignados */}
      <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/85 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-200">
            Productos en Proveedor {proveedorActive} ({activeAssignedCosts.length})
          </h4>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4">Especificación</th>
                <th className="px-6 py-4 text-center" style={{ width: "20%" }}>Costo Equipo</th>
                <th className="px-6 py-4 text-center" style={{ width: "15%" }}>Acciones</th>
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
                activeAssignedCosts.map((c) => {
                  const productInfo = c.producto;
                  const name = productInfo ? `${productInfo.marca} ${productInfo.modelo}` : "Producto Desconocido";

                  return (
                    <tr key={c.id} className="hover:bg-slate-900/10 transition-colors">
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
                              value={editCosts[c.id] !== undefined ? editCosts[c.id] : c.costo.toString()}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || /^\d*$/.test(val)) {
                                  setEditCosts((prev) => ({ ...prev, [c.id]: val }));
                                }
                              }}
                              onBlur={() => handleSaveCosto(c.id, c.costo)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveCosto(c.id, c.costo);
                                  e.currentTarget.blur();
                                }
                              }}
                              className={`bg-slate-950 border rounded-xl pl-6 pr-4 py-1.5 text-[16px] sm:text-xs text-center text-slate-200 w-32 focus:outline-none transition-all ${savedMap[c.id]
                                  ? "border-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.15)] bg-green-500/5"
                                  : savingMap[c.id]
                                    ? "border-secondary/40"
                                    : "border-slate-800 focus:border-secondary"
                                }`}
                            />
                          </div>

                          {/* Estado de guardado (Absolute right to prevent alignment shift) */}
                          <div className="absolute right-0 sm:right-2 md:right-4 w-5 h-5 flex items-center justify-center pointer-events-none">
                            {savingMap[c.id] && (
                              <span className="animate-spin h-3.5 w-3.5 border-2 border-secondary border-t-transparent rounded-full" />
                            )}
                            {savedMap[c.id] && (
                              <span className="material-symbols-outlined text-green-400 text-sm font-bold animate-bounce">
                                check
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminar(c.id, name)}
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
      {/* Modal de Confirmación de Eliminación */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteModal(null)}
          />
          {/* Card */}
          <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/60 p-6 w-full max-w-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Icono */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto">
              <span className="material-symbols-outlined text-red-400 text-2xl">delete</span>
            </div>
            {/* Textos */}
            <div className="text-center space-y-1.5">
              <h3 className="text-slate-100 font-bold text-base">Eliminar asignación</h3>
              <p className="text-slate-400 text-sm">
                ¿Estás seguro de que querés quitar{" "}
                <span className="text-slate-200 font-semibold">{deleteModal.name}</span>{" "}
                de este proveedor?
              </p>
              <p className="text-slate-500 text-xs">Esta acción no se puede deshacer.</p>
            </div>
            {/* Acciones */}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <span className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
                ) : (
                  <span className="material-symbols-outlined text-base">delete</span>
                )}
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
