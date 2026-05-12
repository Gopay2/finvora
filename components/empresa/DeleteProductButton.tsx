'use client';

import React, { useState } from "react";
import { eliminarProducto } from "@/app/empresa/webapp/stock/stock-actions";
import ConfirmModal from "./ConfirmModal";
import AlertModal from "./AlertModal";

interface DeleteProductButtonProps {
  id: string;
}

export default function DeleteProductButton({ id }: DeleteProductButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    const formData = new FormData();
    formData.append('id', id);
    
    const result = await eliminarProducto(formData);
    
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
        title="Eliminar producto"
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
        title="¿Eliminar del catálogo?"
        message="¿Estás seguro de que quieres quitar este modelo? Recuerda que solo podrás hacerlo si no tienes unidades en stock y el modelo no tiene historial de ventas."
      />

      {/* Modal de Error (Solo si hay stock u otro problema) */}
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
