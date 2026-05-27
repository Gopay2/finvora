'use client';

import React, { useState, useTransition } from "react";
import { actualizarVisibilidadCelular } from "@/app/empresa/webapp/catalogo-web/catalogo-actions";

interface CatalogoVisibilityToggleProps {
  id: string;
  initialVisible: boolean;
}

export default function CatalogoVisibilityToggle({ id, initialVisible }: CatalogoVisibilityToggleProps) {
  const [visible, setVisible] = useState(initialVisible);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nuevoEstado = !visible;
    
    // Cambiar estado en el cliente inmediatamente (UI optimista)
    setVisible(nuevoEstado);

    // Ejecutar Server Action en segundo plano
    startTransition(async () => {
      const result = await actualizarVisibilidadCelular(id, nuevoEstado);
      if (result?.error) {
        // Revertir en caso de error
        setVisible(visible);
        alert(`Error al actualizar la visibilidad: ${result.error}`);
      }
    });
  };

  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          visible ? "bg-secondary" : "bg-slate-800"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        title={visible ? "Visible en la web (Hacer clic para ocultar)" : "Oculto en la web (Hacer clic para mostrar)"}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
            visible ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
