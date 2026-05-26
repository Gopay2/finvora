'use client';

import React, { useState } from "react";
import { eliminarCelular } from "@/app/empresa/webapp/catalogo-web/catalogo-actions";
import ConfirmModal from "./ConfirmModal";
import AlertModal from "./AlertModal";

interface DeleteCatalogoButtonProps {
  id: string;
  imagenUrl: string;
}

export default function DeleteCatalogoButton({ id, imagenUrl }: DeleteCatalogoButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    
    const result = await eliminarCelular(id, imagenUrl);
    
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
        title="Eliminar celular del catálogo"
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
        title="¿Eliminar del catálogo web?"
        message="¿Estás seguro de que quieres quitar este modelo de celular del catálogo público de la web? Se borrarán sus datos y su imagen cargada permanentemente."
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
