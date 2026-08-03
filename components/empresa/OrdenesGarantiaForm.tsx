'use client';

import React, { useState, useRef, useMemo, useEffect } from "react";
import { submitOrdenGarantia } from "@/app/empresa/webapp/ordenes-garantia/actions";
import { FormSeccionClienteGarantia } from "./ordenes-garantia/FormSeccionClienteGarantia";
import { FormSeccionEquipoGarantia } from "./ordenes-garantia/FormSeccionEquipoGarantia";
import { FormSeccionFallaGarantia } from "./ordenes-garantia/FormSeccionFallaGarantia";
import { styles, type ZonaOption, type CatalogoProducto } from "./ordenes-garantia-types";

interface OrdenesGarantiaFormProps {
  zonasReparto: ZonaOption[];
  productos: CatalogoProducto[];
}

export default function OrdenesGarantiaForm({ zonasReparto = [], productos = [] }: OrdenesGarantiaFormProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  
  const [selectedZona, setSelectedZona] = useState("");
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedProductoDesc, setSelectedProductoDesc] = useState("");

  const [selectedFilesCount, setSelectedFilesCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const lastPickerOpen = useRef(0);

  const [fechaEntrega, setFechaEntrega] = useState("");
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    }
  }, []);

  const zonasUnicas = useMemo(() => {
    const set = new Set<string>();
    (zonasReparto || []).forEach((zona) => {
      if (zona.nombre_zona && zona.nombre_zona.trim() !== "") {
        set.add(zona.nombre_zona.trim());
      }
    });
    return Array.from(set).sort();
  }, [zonasReparto]);

  const marcasUnicas = useMemo(() => {
    const set = new Set<string>();
    (productos || []).forEach((producto) => {
      if (producto.marca && producto.marca.trim() !== "") {
        set.add(producto.marca.trim().toUpperCase());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!selectedMarca) return [];
    return (productos || [])
      .filter((producto) => producto.marca?.toUpperCase() === selectedMarca.toUpperCase())
      .sort((a, b) => {
        const compModelo = a.modelo.localeCompare(b.modelo, undefined, { numeric: true, sensitivity: 'base' });
        if (compModelo !== 0) return compModelo;
        
        const compColor = a.color.localeCompare(b.color, undefined, { sensitivity: 'base' });
        if (compColor !== 0) return compColor;
        
        return a.almacenamiento.localeCompare(b.almacenamiento, undefined, { numeric: true });
      });
  }, [selectedMarca, productos]);

  const handleOpenPicker = (event: React.MouseEvent<HTMLInputElement>) => {
    const now = Date.now();
    if (now - lastPickerOpen.current < 500) return;

    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        lastPickerOpen.current = now;
        (event.currentTarget as any).showPicker();
      } catch (err) {
        lastPickerOpen.current = 0;
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setSelectedFilesCount(files ? files.length : 0);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    formData.set("marca", selectedMarca);
    formData.set("modelo", selectedProductoDesc);

    try {
      const result = await submitOrdenGarantia(formData);

      if (result.success) {
        if (result.warning) {
          setStatus({ type: 'warning', message: `¡Garantía Folio ${result.folio} registrada! Advertencia Discord: ${result.warning}` });
        } else {
          setStatus({ type: 'success', message: `¡Orden de Garantía ${result.folio} registrada y enviada a Discord!` });
        }
        formRef.current?.reset();
        setSelectedZona("");
        setSelectedMarca("");
        setSelectedProductoDesc("");
        setFechaEntrega("");
        setSelectedFilesCount(0);
      } else {
        setStatus({ type: 'error', message: result.error || 'Error al guardar la orden.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: "Error crítico al registrar la garantía." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className={styles.formCard}>
        <div className="flex items-center justify-center py-12 text-slate-400">
          <span className="animate-spin material-symbols-outlined text-3xl">progress_activity</span>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className={styles.formCard} onSubmit={handleSubmit}>
      {status && (
        <div className={
          status.type === 'success' 
            ? styles.statusSuccess 
            : status.type === 'warning' 
              ? styles.statusWarning 
              : styles.statusError
        }>
          <span className="material-symbols-outlined">
            {status.type === 'success' ? 'check_circle' : status.type === 'warning' ? 'warning' : 'error'}
          </span>
          {status.message}
        </div>
      )}

      <FormSeccionClienteGarantia
        selectedZona={selectedZona}
        setSelectedZona={setSelectedZona}
        zonasUnicas={zonasUnicas}
      />

      <FormSeccionEquipoGarantia
        selectedMarca={selectedMarca}
        setSelectedMarca={setSelectedMarca}
        selectedProductoDesc={selectedProductoDesc}
        setSelectedProductoDesc={setSelectedProductoDesc}
        marcasUnicas={marcasUnicas}
        productosFiltrados={productosFiltrados}
        fechaEntrega={fechaEntrega}
        setFechaEntrega={setFechaEntrega}
        isIOS={isIOS}
        handleOpenPicker={handleOpenPicker}
      />

      <FormSeccionFallaGarantia
        selectedFilesCount={selectedFilesCount}
        handleFileChange={handleFileChange}
      />

      <button 
        type="submit" 
        disabled={isSubmitting} 
        className={isSubmitting ? styles.buttonDisabled : styles.button}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin material-symbols-outlined">progress_activity</span>
            Registrando orden...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">assignment_turned_in</span>
            Registrar Orden de Garantía
          </>
        )}
      </button>
    </form>
  );
}
