'use client';

// ─── React y Next.js ───────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Componentes locales ───────────────────────────────────────────────────
import ComprobantesForm from "./ComprobantesForm";
import ComprobantesHistorial from "./ComprobantesHistorial";
import DeleteComprobanteModal from "./DeleteComprobanteModal";

// ─── Tipos e interfaces ───────────────────────────────────────────────────
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import type { OptionItem, Producto, StockItem } from "./comprobantes-types";

interface ComprobantesClientPageProps {
  vendedores: OptionItem[];
  repartidores: OptionItem[];
  productos: Producto[];
  stockItems: StockItem[];
  comprobantesList: ComprobanteRecord[];
  showTable: boolean;
}

export default function ComprobantesClientPage({
  vendedores,
  repartidores,
  productos,
  stockItems,
  comprobantesList,
  showTable
}: ComprobantesClientPageProps) {
  const router = useRouter();

  // Estado local para la lista de comprobantes
  const [comprobantes, setComprobantes] = useState<ComprobanteRecord[]>(comprobantesList);

  useEffect(() => {
    setComprobantes(comprobantesList);
  }, [comprobantesList]);

  // Estado compartido para el status de las operaciones (formulario y modal lo actualizan)
  const [operationStatus, setOperationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estado para el comprobante en proceso de eliminación
  const [comprobanteBeingDeleted, setComprobanteBeingDeleted] = useState<ComprobanteRecord | null>(null);

  // Callback estable para el formulario
  const handleStatusChange = useCallback((newStatus: { type: 'success' | 'error'; message: string } | null) => {
    setOperationStatus(newStatus);
  }, []);

  const handleSubmitSuccess = useCallback((updatedList?: ComprobanteRecord[]) => {
    if (updatedList) {
      setComprobantes(updatedList);
    }
  }, []);

  const handleDeleted = useCallback((deletedId: string) => {
    setComprobantes(prev => prev.filter(item => item.id !== deletedId));
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-8">
      <ComprobantesForm
        vendedores={vendedores}
        repartidores={repartidores}
        productos={productos}
        stockItems={stockItems}
        showTable={showTable}
        onSubmitSuccess={handleSubmitSuccess}
        onStatusChange={handleStatusChange}
      />

      {/* TABLA HISTÓRICA (Solo visible para roles superiores) */}
      {showTable && (
        <ComprobantesHistorial
          comprobantes={comprobantes}
          vendedores={vendedores}
          repartidores={repartidores}
          onDeleteRequest={setComprobanteBeingDeleted}
        />
      )}

      {/* Modal de Confirmación de Eliminación de Comprobante Premium */}
      {comprobanteBeingDeleted && (
        <DeleteComprobanteModal
          comprobante={comprobanteBeingDeleted}
          onClose={() => setComprobanteBeingDeleted(null)}
          onDeleted={handleDeleted}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
