'use client';

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  agregarProductoProveedor,
  actualizarCostoProveedor,
  actualizarCostoPayjoyProveedor,
  eliminarProductoProveedor,
} from "@/app/empresa/webapp/sueldos/proveedores/proveedores-actions";
import type { CatalogProduct, SupplierCostRecord, ProveedorNombre } from "@/types/proveedores";
import { AsignarProductoForm } from "./proveedores/AsignarProductoForm";
import { ProveedoresTable } from "./proveedores/ProveedoresTable";
import { DeleteProveedorCostModal } from "./proveedores/DeleteProveedorCostModal";

interface ProveedoresClientPageProps {
  catalogProducts: CatalogProduct[];
  initialAssignedCosts: SupplierCostRecord[];
}

export default function ProveedoresClientPage({
  catalogProducts,
  initialAssignedCosts,
}: ProveedoresClientPageProps) {
  const router = useRouter();
  const [proveedorActive, setProveedorActive] = useState<ProveedorNombre>("Tijuana");

  // Estados para agregar producto
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedProdId, setSelectedProdId] = useState("");
  const [costoInput, setCostoInput] = useState("0");
  const [costoPayjoyInput, setCostoPayjoyInput] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Estados de guardado inline - Costo Equipo
  const [editCosts, setEditCosts] = useState<{ [id: string]: string }>({});
  const [savingMap, setSavingMap] = useState<{ [id: string]: boolean }>({});
  const [savedMap, setSavedMap] = useState<{ [id: string]: boolean }>({});

  // Estados de guardado inline - Costo PayJoy
  const [editCostsPayjoy, setEditCostsPayjoy] = useState<{ [id: string]: string }>({});
  const [savingMapPayjoy, setSavingMapPayjoy] = useState<{ [id: string]: boolean }>({});
  const [savedMapPayjoy, setSavedMapPayjoy] = useState<{ [id: string]: boolean }>({});

  // Modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const targetSigla = useMemo(() => {
    if (proveedorActive === "Guadalajara") return "GDL";
    if (proveedorActive === "Monterrey") return "MTY";
    return "TIJ";
  }, [proveedorActive]);

  const activeAssignedCosts = useMemo(() => {
    return initialAssignedCosts.filter((costoRecord) => costoRecord.proveedor === proveedorActive);
  }, [initialAssignedCosts, proveedorActive]);

  const assignedProductIds = useMemo(() => {
    return activeAssignedCosts.map((costoRecord) => costoRecord.producto_id);
  }, [activeAssignedCosts]);

  const selectableProducts = useMemo(() => {
    return catalogProducts.filter((productoItem) => {
      const isNotAssigned = !assignedProductIds.includes(productoItem.id);
      const searchContent = `${productoItem.modelo} ${productoItem.marca} ${productoItem.color}`.toUpperCase();
      const matchesSigla = searchContent.includes(targetSigla);
      return isNotAssigned && matchesSigla;
    });
  }, [catalogProducts, assignedProductIds, targetSigla]);

  const marcas = useMemo(() => {
    const set = new Set<string>();
    selectableProducts.forEach((productoItem) => {
      if (productoItem.marca && productoItem.marca.trim()) {
        set.add(productoItem.marca.trim().toUpperCase());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [selectableProducts]);

  const filteredProducts = useMemo(() => {
    if (!selectedMarca) return [];
    return selectableProducts
      .filter((productoItem) => productoItem.marca?.toUpperCase() === selectedMarca.toUpperCase())
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
    const initialCostoPayjoy = Number(costoPayjoyInput) || 0;

    startTransition(async () => {
      const res = await agregarProductoProveedor(
        selectedProdId,
        proveedorActive,
        initialCosto,
        initialCostoPayjoy
      );
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Producto asignado con éxito.");
        setSelectedMarca("");
        setSelectedProdId("");
        setCostoInput("0");
        setCostoPayjoyInput("0");
        router.refresh();
      }
    });
  };

  const handleSaveCosto = async (id: string, originalCosto: number) => {
    const currentVal = editCosts[id];
    if (currentVal === undefined) return;

    const numericVal = Number(currentVal) || 0;

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

      setEditCosts((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      router.refresh();
    }
  };

  const handleSaveCostoPayjoy = async (id: string, originalCostoPayjoy: number) => {
    const currentVal = editCostsPayjoy[id];
    if (currentVal === undefined) return;

    const numericVal = Number(currentVal) || 0;

    if (numericVal === originalCostoPayjoy) {
      setEditCostsPayjoy((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      return;
    }

    setSavingMapPayjoy((prev) => ({ ...prev, [id]: true }));
    const res = await actualizarCostoPayjoyProveedor(id, numericVal);
    setSavingMapPayjoy((prev) => ({ ...prev, [id]: false }));

    if (res.error) {
      alert(res.error);
    } else {
      setSavedMapPayjoy((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setSavedMapPayjoy((prev) => ({ ...prev, [id]: false }));
      }, 2000);

      setEditCostsPayjoy((prev) => {
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
              Administra los costos de compra de equipos y costos base PayJoy para cada proveedor y plaza.
            </p>
          </div>

          {/* Switch de Proveedor */}
          <div className="grid grid-cols-3 w-full sm:w-[390px] bg-slate-950/80 backdrop-blur p-1.5 border border-slate-800 rounded-2xl gap-1 shrink-0">
            {(["Tijuana", "Monterrey", "Guadalajara"] as const).map((prov) => {
              const isActive = proveedorActive === prov;
              return (
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
                  className={`w-full text-center px-2 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none ${
                    isActive
                      ? "bg-secondary text-slate-950 shadow-md shadow-secondary/15"
                      : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <span className="truncate">{prov}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Bloque: Agregar Producto a Proveedor */}
      <AsignarProductoForm
        selectedMarca={selectedMarca}
        setSelectedMarca={setSelectedMarca}
        selectedProdId={selectedProdId}
        setSelectedProdId={setSelectedProdId}
        costoInput={costoInput}
        setCostoInput={setCostoInput}
        costoPayjoyInput={costoPayjoyInput}
        setCostoPayjoyInput={setCostoPayjoyInput}
        marcas={marcas}
        filteredProducts={filteredProducts}
        targetSigla={targetSigla}
        isPending={isPending}
        handleAgregar={handleAgregar}
        errorMsg={errorMsg}
        successMsg={successMsg}
      />

      {/* Tabla de Productos Asignados */}
      <ProveedoresTable
        proveedorActive={proveedorActive}
        activeAssignedCosts={activeAssignedCosts}
        editCosts={editCosts}
        setEditCosts={setEditCosts}
        savingMap={savingMap}
        savedMap={savedMap}
        handleSaveCosto={handleSaveCosto}
        editCostsPayjoy={editCostsPayjoy}
        setEditCostsPayjoy={setEditCostsPayjoy}
        savingMapPayjoy={savingMapPayjoy}
        savedMapPayjoy={savedMapPayjoy}
        handleSaveCostoPayjoy={handleSaveCostoPayjoy}
        handleEliminar={handleEliminar}
      />

      {/* Modal de Confirmación de Eliminación */}
      <DeleteProveedorCostModal
        deleteModal={deleteModal}
        isDeleting={isDeleting}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
