'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { submitComprobante, getComprobantes } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import { styles } from "./comprobantes-types";
import type { OptionItem, Producto, StockItem, ModeloAgrupado } from "./comprobantes-types";
import { FormSeleccionEquipoComprobante } from "./comprobantes/FormSeleccionEquipoComprobante";
import { FormCamposFinancierosComprobante } from "./comprobantes/FormCamposFinancierosComprobante";

interface ComprobantesFormProps {
  vendedores: OptionItem[];
  repartidores: OptionItem[];
  productos: Producto[];
  stockItems: StockItem[];
  showTable: boolean;
  onSubmitSuccess: (updatedList?: ComprobanteRecord[]) => void;
  onStatusChange: (status: { type: 'success' | 'error'; message: string } | null) => void;
}

export default function ComprobantesForm({
  vendedores,
  repartidores,
  productos,
  stockItems,
  showTable,
  onSubmitSuccess,
  onStatusChange
}: ComprobantesFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [operationStatus, setOperationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados para selección de equipo y ubicaciones
  const [selectedRepartidorId, setSelectedRepartidorId] = useState<string>("");
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImei, setSelectedImei] = useState<string>("");
  const [fechaProximoPago, setFechaProximoPago] = useState<string>("");
  const [selectedPlazo, setSelectedPlazo] = useState<string>("");

  // Estados para vendedor
  const [vendedorSearch, setVendedorSearch] = useState("");
  const [selectedVendedor, setSelectedVendedor] = useState<OptionItem | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    onStatusChange(operationStatus);
  }, [operationStatus, onStatusChange]);

  // ─── LÓGICA DE FILTRADO Y STOCK DISPONIBLE ───

  /** Obtiene la ID original del repartidor para filtrar el inventario correspondiente a la ubicación seleccionada */
  const selectedRepartidorOriginalId = useMemo(() => {
    if (!selectedRepartidorId) return "";
    const found = repartidores.find(r => r.id === selectedRepartidorId);
    return found?.repartidorId || "";
  }, [selectedRepartidorId, repartidores]);

  /** Filtra el stock que pertenece a la ubicación/zona seleccionada */
  const stockFiltrado = useMemo(() => {
    if (!selectedRepartidorOriginalId) return [];
    return stockItems.filter(item => item.zona === selectedRepartidorOriginalId);
  }, [selectedRepartidorOriginalId, stockItems]);

  const productosConStock = useMemo(() => {
    if (!selectedRepartidorOriginalId) return [];
    const idsConStock = new Set(stockFiltrado.map(item => item.producto_id));
    return productos
      .filter(p => idsConStock.has(p.id))
      .map(p => {
        const unidadesValidas = stockFiltrado.filter(item => item.producto_id === p.id);
        const cantidadDisponible = unidadesValidas.filter(item => item.estado === 'Disponible').length;
        const cantidadAConsultar = unidadesValidas.filter(item => item.estado === 'A consultar').length;
        const cantidadEnEnvio = unidadesValidas.filter(item => item.estado === 'En envío').length;
        return { 
          ...p, 
          cantidadDisponible, 
          cantidadAConsultar, 
          cantidadEnEnvio,
          cantidadStock: cantidadDisponible + cantidadAConsultar + cantidadEnEnvio 
        };
      })
      .filter(p => p.cantidadStock > 0);
  }, [selectedRepartidorOriginalId, productos, stockFiltrado]);

  const modelosUnicos = useMemo(() => {
    const map = new Map<string, ModeloAgrupado>();
    productosConStock.forEach(p => {
      const display = `${p.marca} ${p.modelo} - ${p.almacenamiento} - ${p.ram}`;
      const existing = map.get(display);
      if (!existing) {
        map.set(display, { 
          display, 
          marca: p.marca, 
          modelo: p.modelo, 
          totalDisponible: p.cantidadDisponible, 
          totalAConsultar: p.cantidadAConsultar, 
          totalEnEnvio: p.cantidadEnEnvio,
          totalStock: p.cantidadStock 
        });
      } else {
        existing.totalDisponible += p.cantidadDisponible;
        existing.totalAConsultar += p.cantidadAConsultar;
        existing.totalEnEnvio += p.cantidadEnEnvio;
        existing.totalStock += p.cantidadStock;
      }
    });
    return Array.from(map.entries());
  }, [productosConStock]);

  const variantesColor = useMemo(() => {
    if (!selectedModelKey) return [];
    return productosConStock
      .filter(p => `${p.marca} ${p.modelo} - ${p.almacenamiento} - ${p.ram}` === selectedModelKey)
      .map(p => ({ 
        color: p.color, 
        cantidadDisponible: p.cantidadDisponible, 
        cantidadAConsultar: p.cantidadAConsultar, 
        cantidadEnEnvio: p.cantidadEnEnvio, 
        hasStock: p.cantidadStock > 0 
      }));
  }, [selectedModelKey, productosConStock]);

  const imeisDisponibles = useMemo(() => {
    if (!selectedModelKey || !selectedColor) return [];
    const matchingProducts = productosConStock.filter(
      p => `${p.marca} ${p.modelo} - ${p.almacenamiento} - ${p.ram}` === selectedModelKey && p.color === selectedColor
    );
    const matchingProductIds = new Set(matchingProducts.map(p => p.id));
    return stockFiltrado.filter(
      item => matchingProductIds.has(item.producto_id) && 
        (item.estado === 'Disponible' || item.estado === 'A consultar' || item.estado === 'En envío') && 
        item.imei
    );
  }, [selectedModelKey, selectedColor, productosConStock, stockFiltrado]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setOperationStatus({ type: 'error', message: "El comprobante excede el tamaño máximo permitido de 5MB." });
        event.target.value = "";
        setSelectedFileName("");
        return;
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedMimeTypes.includes(file.type)) {
        setOperationStatus({ type: 'error', message: "Formato no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF." });
        event.target.value = "";
        setSelectedFileName("");
        return;
      }

      setOperationStatus(null);
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setOperationStatus(null);

    if (!selectedVendedor) {
      setOperationStatus({ type: 'error', message: 'Por favor, selecciona un vendedor válido de la lista sugerida.' });
      setIsSubmitting(false);
      return;
    }

    if (!selectedRepartidorId) {
      setOperationStatus({ type: 'error', message: 'Por favor, selecciona un repartidor/ubicación.' });
      setIsSubmitting(false);
      return;
    }

    if (!selectedModelKey) {
      setOperationStatus({ type: 'error', message: 'Por favor, selecciona un modelo de celular.' });
      setIsSubmitting(false);
      return;
    }

    if (!selectedColor) {
      setOperationStatus({ type: 'error', message: 'Por favor, selecciona un color.' });
      setIsSubmitting(false);
      return;
    }

    if (!selectedImei) {
      setOperationStatus({ type: 'error', message: 'Por favor, selecciona un IMEI.' });
      setIsSubmitting(false);
      return;
    }

    if (!fechaProximoPago) {
      setOperationStatus({ type: 'error', message: 'Por favor, selecciona la fecha del próximo pago.' });
      setIsSubmitting(false);
      return;
    }

    if (!selectedPlazo) {
      setOperationStatus({ type: 'error', message: 'Por favor, selecciona un plazo.' });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const submitResponse = await submitComprobante(formData);

    if (submitResponse.success) {
      setOperationStatus({ type: 'success', message: '¡Comprobante registrado y cargado exitosamente!' });
      formRef.current?.reset();
      setSelectedFileName("");
      setVendedorSearch("");
      setSelectedVendedor(null);
      setSelectedRepartidorId("");
      setSelectedModelKey("");
      setSelectedColor("");
      setSelectedImei("");
      setFechaProximoPago("");
      setSelectedPlazo("");

      if (showTable) {
        const listResponse = await getComprobantes();
        if (listResponse.success && listResponse.data) {
          onSubmitSuccess(listResponse.data);
        } else {
          onSubmitSuccess();
        }
      } else {
        onSubmitSuccess();
      }

      router.refresh();
    } else {
      setOperationStatus({ type: 'error', message: submitResponse.error || 'Error al procesar el comprobante.' });
    }
    setIsSubmitting(false);
  };

  return (
    <form ref={formRef} className={styles.formCard} onSubmit={handleSubmit} suppressHydrationWarning>
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-100">Formulario de Comprobantes</h3>
        <p className="text-xs text-slate-400 mt-1">Completa los datos para registrar la entrega y el comprobante.</p>
      </div>

      {operationStatus && (
        <div className={operationStatus.type === 'success' ? styles.statusSuccess : styles.statusError}>
          <span className="material-symbols-outlined">
            {operationStatus.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{operationStatus.message}</span>
        </div>
      )}

      <div className={styles.formGrid}>
        <FormSeleccionEquipoComprobante
          vendedores={vendedores}
          repartidores={repartidores}
          vendedorSearch={vendedorSearch}
          setVendedorSearch={setVendedorSearch}
          selectedVendedor={selectedVendedor}
          setSelectedVendedor={setSelectedVendedor}
          selectedRepartidorId={selectedRepartidorId}
          setSelectedRepartidorId={setSelectedRepartidorId}
          selectedModelKey={selectedModelKey}
          setSelectedModelKey={setSelectedModelKey}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedImei={selectedImei}
          setSelectedImei={setSelectedImei}
          modelosUnicos={modelosUnicos}
          variantesColor={variantesColor}
          imeisDisponibles={imeisDisponibles}
        />

        <FormCamposFinancierosComprobante
          fechaProximoPago={fechaProximoPago}
          setFechaProximoPago={setFechaProximoPago}
          selectedPlazo={selectedPlazo}
          setSelectedPlazo={setSelectedPlazo}
          selectedFileName={selectedFileName}
          handleFileChange={handleFileChange}
        />
      </div>

      <button
        type="submit"
        className={isSubmitting ? styles.buttonDisabled : styles.button}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full" />
            Guardando comprobante...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">save</span>
            Registrar Comprobante
          </>
        )}
      </button>
    </form>
  );
}
