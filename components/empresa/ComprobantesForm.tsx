'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { submitComprobante, getComprobantes } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import { styles } from "./comprobantes-types";
import type { OptionItem, Producto, StockItem, ModeloAgrupado } from "./comprobantes-types";
import { FormSeleccionEquipoComprobante } from "./comprobantes/FormSeleccionEquipoComprobante";
import { FormCamposFinancierosComprobante } from "./comprobantes/FormCamposFinancierosComprobante";
import { optimizarImagenParaSubida } from "@/utils/image-compression";
import { ComprobanteProgressModal } from "./comprobantes/ComprobanteProgressModal";

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
  const [selectedFotoClienteName, setSelectedFotoClienteName] = useState("");
  const [operationStatus, setOperationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados para modal de progreso y carga
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalTitle, setModalTitle] = useState("Procesando comprobante...");
  const [modalDescription, setModalDescription] = useState("Iniciando registro...");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Estados para selección de equipo y ubicaciones
  const [selectedRepartidorId, setSelectedRepartidorId] = useState<string>("");
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImei, setSelectedImei] = useState<string>("");
  const [fechaProximoPago, setFechaProximoPago] = useState<string>("");
  const [selectedPlazo, setSelectedPlazo] = useState<string>("");
  const [pagoAdelantado, setPagoAdelantado] = useState<string>("No");
  const [selectedFotoPagoAdelantadoName, setSelectedFotoPagoAdelantadoName] = useState("");

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
        const cantidadDisponible = unidadesValidas.filter(
          item => item.estado === 'Disponible' || item.estado === 'Concesión' || item.estado === 'Concesion'
        ).length;
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
        (item.estado === 'Disponible' || item.estado === 'Concesión' || item.estado === 'Concesion' || item.estado === 'A consultar' || item.estado === 'En envío') && 
        item.imei
    );
  }, [selectedModelKey, selectedColor, productosConStock, stockFiltrado]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf';
      const maxSizeBytes = isPdf ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setOperationStatus({
          type: 'error',
          message: isPdf
            ? "El comprobante en PDF excede el tamaño máximo permitido de 5MB."
            : "La imagen del comprobante excede el tamaño máximo permitido de 20MB."
        });
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

  const handleFotoClienteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf';
      const maxSizeBytes = isPdf ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setOperationStatus({
          type: 'error',
          message: isPdf
            ? "La foto del cliente en PDF excede el tamaño máximo permitido de 5MB."
            : "La foto del cliente excede el tamaño máximo permitido de 20MB."
        });
        event.target.value = "";
        setSelectedFotoClienteName("");
        return;
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedMimeTypes.includes(file.type)) {
        setOperationStatus({ type: 'error', message: "Formato no permitido para foto del cliente. Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF." });
        event.target.value = "";
        setSelectedFotoClienteName("");
        return;
      }

      setOperationStatus(null);
      setSelectedFotoClienteName(file.name);
    } else {
      setSelectedFotoClienteName("");
    }
  };

  const handleFotoPagoAdelantadoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf';
      const maxSizeBytes = isPdf ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setOperationStatus({
          type: 'error',
          message: isPdf
            ? "El archivo de pago adelantado en PDF excede el tamaño máximo permitido de 5MB."
            : "El archivo de pago adelantado excede el tamaño máximo permitido de 20MB."
        });
        event.target.value = "";
        setSelectedFotoPagoAdelantadoName("");
        return;
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedMimeTypes.includes(file.type)) {
        setOperationStatus({ type: 'error', message: "Formato no permitido para pago adelantado. Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF." });
        event.target.value = "";
        setSelectedFotoPagoAdelantadoName("");
        return;
      }

      setOperationStatus(null);
      setSelectedFotoPagoAdelantadoName(file.name);
    } else {
      setSelectedFotoPagoAdelantadoName("");
    }
  };

  const handlePagoAdelantadoChange = (val: string) => {
    setPagoAdelantado(val);
    if (val !== 'Si') {
      setSelectedFotoPagoAdelantadoName("");
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

    if (!selectedFotoClienteName) {
      setOperationStatus({ type: 'error', message: 'Por favor, sube la foto del cliente (es obligatoria).' });
      setIsSubmitting(false);
      return;
    }

    if (!pagoAdelantado) {
      setOperationStatus({ type: 'error', message: 'Por favor, selecciona si cuenta con Pago adelantado (Si o No).' });
      setIsSubmitting(false);
      return;
    }

    if (pagoAdelantado === 'Si' && !selectedFotoPagoAdelantadoName) {
      setOperationStatus({ type: 'error', message: 'Por favor, sube el comprobante de Pago Adelantado (es obligatorio al seleccionar Si).' });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);

    // Abrir modal de progreso e indicar inicio
    setShowProgressModal(true);
    setModalError(null);
    setModalSuccess(false);
    setUploadProgress(10);
    setModalTitle("Optimizando imágenes...");
    setModalDescription("Reduciendo tamaño de fotos para acelerar el envío...");

    try {
      // 1. Optimizar archivos en el cliente antes de enviar por red
      const originalComprobante = formData.get("comprobante") as File | null;
      if (originalComprobante && originalComprobante.size > 0) {
        setUploadProgress(18);
        const optComp = await optimizarImagenParaSubida(originalComprobante);
        formData.set("comprobante", optComp);
      }

      const originalFotoCliente = formData.get("foto_cliente") as File | null;
      if (originalFotoCliente && originalFotoCliente.size > 0) {
        setUploadProgress(26);
        const optFoto = await optimizarImagenParaSubida(originalFotoCliente);
        formData.set("foto_cliente", optFoto);
      }

      const originalFotoAdelantado = formData.get("foto_pago_adelantado") as File | null;
      if (originalFotoAdelantado && originalFotoAdelantado.size > 0) {
        setUploadProgress(34);
        const optAdelantado = await optimizarImagenParaSubida(originalFotoAdelantado);
        formData.set("foto_pago_adelantado", optAdelantado);
      }

      // 2. Subida y procesamiento en el servidor
      setUploadProgress(45);
      setModalTitle("Subiendo comprobante...");
      setModalDescription("Enviando archivos optimizados a la Base de Datos...");

      // Simular avance fluido durante el envío de red
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 78 ? prev + 3 : prev));
      }, 250);

      let submitResponse;
      try {
        submitResponse = await submitComprobante(formData);
      } finally {
        clearInterval(progressTimer);
      }

      if (submitResponse.success) {
        setUploadProgress(90);
        setModalTitle("Registrando en sistema...");
        setModalDescription("Guardando comprobante y actualizando inventario...");

        formRef.current?.reset();
        setSelectedFileName("");
        setSelectedFotoClienteName("");
        setVendedorSearch("");
        setSelectedVendedor(null);
        setSelectedRepartidorId("");
        setSelectedModelKey("");
        setSelectedColor("");
        setSelectedImei("");
        setFechaProximoPago("");
        setSelectedPlazo("");
        setPagoAdelantado("No");
        setSelectedFotoPagoAdelantadoName("");

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

        setUploadProgress(100);
        setModalSuccess(true);
        setModalTitle("¡Comprobante Registrado!");
        setModalDescription("El comprobante y los archivos se guardaron exitosamente.");
        setOperationStatus({ type: 'success', message: '¡Comprobante registrado y cargado exitosamente!' });
      } else {
        const errorMsg = submitResponse.error || 'Error al procesar el comprobante.';
        setModalError(errorMsg);
        setModalTitle("Error al guardar");
        setModalDescription("No se pudo completar el registro.");
        setOperationStatus({ type: 'error', message: errorMsg });
      }
    } catch (err: unknown) {
      console.error("Excepción al enviar comprobante:", err);
      const errorObject = err instanceof Error ? err : null;
      const errorMessage = errorObject?.message || "";
      const networkErrorMsg = errorMessage.includes("fetch") || errorMessage.includes("Network")
        ? "Error de conexión con el servidor. Por favor, verifica tu señal de internet y reintenta."
        : (errorMessage || "Ocurrió un error inesperado al subir el comprobante.");
      setModalError(networkErrorMsg);
      setModalTitle("Error de conexión");
      setModalDescription("Ocurrió un error durante la subida.");
      setOperationStatus({ type: 'error', message: networkErrorMsg });
    } finally {
      setIsSubmitting(false);
    }
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
          selectedFotoClienteName={selectedFotoClienteName}
          handleFotoClienteChange={handleFotoClienteChange}
          pagoAdelantado={pagoAdelantado}
          setPagoAdelantado={handlePagoAdelantadoChange}
          selectedFotoPagoAdelantadoName={selectedFotoPagoAdelantadoName}
          handleFotoPagoAdelantadoChange={handleFotoPagoAdelantadoChange}
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

      {/* Modal de Progreso con Porcentajes y Estados de Carga */}
      <ComprobanteProgressModal
        isOpen={showProgressModal}
        progress={uploadProgress}
        stepTitle={modalTitle}
        stepDescription={modalDescription}
        isSuccess={modalSuccess}
        error={modalError}
        onClose={() => setShowProgressModal(false)}
      />
    </form>
  );
}
