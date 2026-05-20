'use client';

import React, { useState } from "react";
import { eliminarStock } from "@/app/empresa/webapp/stock/stock-actions";
import ConfirmModal from "./ConfirmModal";
import AlertModal from "./AlertModal";

interface DeleteStockButtonProps {
  imei: string;
}

export default function DeleteStockButton({ imei }: DeleteStockButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    
    const result = await eliminarStock(imei);
    
    if (result?.error) {
      setErrorMsg(result.error);
    }
    
    setIsDeleting(false);
    setShowConfirm(false);
  };

  return (
    <>
      <button 
        type="button" 
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className={`text-red-500/50 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10 cursor-pointer ${isDeleting ? 'opacity-30' : ''}`}
        title="Eliminar del stock"
      >
        <span className="material-symbols-outlined text-xl">
          {isDeleting ? 'sync' : 'delete'}
        </span>
      </button>

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title="¿Eliminar unidad del stock?"
        message={`¿Estás seguro de que quieres eliminar del inventario el equipo con IMEI ${imei}? Esta acción es irreversible.`}
      />

      {/* Modal de Error */}
      <AlertModal
        isOpen={!!errorMsg}
        onClose={() => setErrorMsg(null)}
        title="No se puede eliminar"
        message={errorMsg || ""}
        type="error"
      />
    </>
  );
}
