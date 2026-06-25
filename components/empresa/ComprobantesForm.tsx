'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { submitComprobante, getComprobantes } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import {
  styles, handleNumericInput, handleNumericBlur
} from "./comprobantes-types";
import type {
  OptionItem, Producto, StockItem, ModeloAgrupado
} from "./comprobantes-types";
import { VendedorAutocomplete } from "./VendedorAutocomplete";
import { DropdownSelect } from "./DropdownSelect";

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

  // Estados para el flujo de selección de equipo (replica cambaceo)
  const [selectedRepartidorId, setSelectedRepartidorId] = useState<string>("");
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImei, setSelectedImei] = useState<string>("");

  // Estados para autocompletado de vendedores
  const [vendedorSearch, setVendedorSearch] = useState("");
  const [selectedVendedor, setSelectedVendedor] = useState<OptionItem | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Propagar el status local al padre.
  // NOTA: Para evitar bucles de renderizado infinitos, la prop 'onStatusChange'
  // provista por el componente padre DEBE ser una referencia estable (por ejemplo, envuelta en useCallback).
  useEffect(() => {
    onStatusChange(operationStatus);
  }, [operationStatus, onStatusChange]);



  // Obtener el repartidorId original para filtrar stock según la ubicación seleccionada
  const selectedRepartidorOriginalId = useMemo(() => {
    if (!selectedRepartidorId) return "";
    const found = repartidores.find(repartidorOption => repartidorOption.id === selectedRepartidorId);
    return found?.repartidorId || "";
  }, [selectedRepartidorId, repartidores]);

  // Filtrar stock por el repartidorId original (misma lógica de cambaceo: stockItem.zona === repartidorId)
  const stockFiltrado = useMemo(() => {
    if (!selectedRepartidorOriginalId) return [];
    return stockItems.filter(stockItem => stockItem.zona === selectedRepartidorOriginalId);
  }, [selectedRepartidorOriginalId, stockItems]);

  // Productos con stock disponible en esta ubicación
  const productosConStock = useMemo(() => {
    if (!selectedRepartidorOriginalId) return [];
    const idsConStock = new Set(stockFiltrado.map(stockItem => stockItem.producto_id));
    return productos
      .filter(producto => idsConStock.has(producto.id))
      .map(producto => {
        const unidadesValidas = stockFiltrado.filter(stockItem => stockItem.producto_id === producto.id);
        const cantidadDisponible = unidadesValidas.filter(stockItem => stockItem.estado === 'Disponible').length;
        const cantidadAConsultar = unidadesValidas.filter(stockItem => stockItem.estado === 'A consultar').length;
        const cantidadEnEnvio = unidadesValidas.filter(stockItem => stockItem.estado === 'En envío').length;
        return { 
          ...producto, 
          cantidadDisponible, 
          cantidadAConsultar, 
          cantidadEnEnvio,
          cantidadStock: cantidadDisponible + cantidadAConsultar + cantidadEnEnvio 
        };
      })
      .filter(producto => producto.cantidadStock > 0);
  }, [selectedRepartidorOriginalId, productos, stockFiltrado]);

  // Modelos únicos agrupados
  const modelosUnicos = useMemo(() => {
    const map = new Map<string, ModeloAgrupado>();
    productosConStock.forEach(producto => {
      const display = `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}`;
      const existing = map.get(display);
      if (!existing) {
        map.set(display, { 
          display, 
          marca: producto.marca, 
          modelo: producto.modelo, 
          totalDisponible: producto.cantidadDisponible, 
          totalAConsultar: producto.cantidadAConsultar, 
          totalEnEnvio: producto.cantidadEnEnvio,
          totalStock: producto.cantidadStock 
        });
      } else {
        existing.totalDisponible += producto.cantidadDisponible;
        existing.totalAConsultar += producto.cantidadAConsultar;
        existing.totalEnEnvio += producto.cantidadEnEnvio;
        existing.totalStock += producto.cantidadStock;
      }
    });
    return Array.from(map.entries());
  }, [productosConStock]);

  // Colores disponibles para el modelo seleccionado
  const variantesColor = useMemo(() => {
    if (!selectedModelKey) return [];
    return productosConStock
      .filter(producto => `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}` === selectedModelKey)
      .map(producto => ({ 
        color: producto.color, 
        cantidadDisponible: producto.cantidadDisponible, 
        cantidadAConsultar: producto.cantidadAConsultar, 
        cantidadEnEnvio: producto.cantidadEnEnvio, 
        hasStock: producto.cantidadStock > 0 
      }));
  }, [selectedModelKey, productosConStock]);

  // IMEIs disponibles para modelo y color seleccionados
  const imeisDisponibles = useMemo(() => {
    if (!selectedModelKey || !selectedColor) return [];
    const matchingProducts = productosConStock.filter(
      producto => `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}` === selectedModelKey && producto.color === selectedColor
    );
    const matchingProductIds = new Set(matchingProducts.map(producto => producto.id));
    return stockFiltrado.filter(
      stockItem => matchingProductIds.has(stockItem.producto_id) && 
        (stockItem.estado === 'Disponible' || stockItem.estado === 'A consultar' || stockItem.estado === 'En envío') && 
        stockItem.imei
    );
  }, [selectedModelKey, selectedColor, productosConStock, stockFiltrado]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      // Obtener la lista actualizada de forma instantánea sin refrescar página completa
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
        {/* NOMBRE DEL CLIENTE */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Nombre del Cliente</label>
          <input
            type="text"
            name="nombre_cliente"
            placeholder="Escribe el nombre del cliente..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all"
            required
            autoComplete="off"
            suppressHydrationWarning
          />
        </div>

        {/* SELECTOR DE VENDEDOR AUTOCOMPLETE */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Vendedor</label>
          <VendedorAutocomplete
            vendedores={vendedores}
            vendedorSearch={vendedorSearch}
            setVendedorSearch={setVendedorSearch}
            selectedVendedor={selectedVendedor}
            setSelectedVendedor={setSelectedVendedor}
          />
        </div>

        {/* SELECTOR DE REPARTIDOR */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Repartidor/Ubicación</label>
          <DropdownSelect
            placeholder="Seleccione el repartidor/ubicación..."
            valueDisplay={repartidores.find(r => r.id === selectedRepartidorId)?.display || ""}
            items={repartidores}
            onSelect={(repartidor) => {
              setSelectedRepartidorId(repartidor.id);
              setSelectedModelKey("");
              setSelectedColor("");
              setSelectedImei("");
            }}
            getItemKey={(repartidor) => repartidor.id}
            getItemDisplay={(repartidor) => repartidor.display}
          />
          <input
            type="hidden"
            name="repartidor_id"
            value={selectedRepartidorId}
          />
        </div>

        {/* SELECTOR DE MODELO DE CELULAR */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Modelo de Celular</label>
          <DropdownSelect
            placeholder="Seleccione un modelo..."
            disabled={!selectedRepartidorId}
            disabledPlaceholder="Primero elija ubicación"
            valueDisplay={modelosUnicos.find(([key]) => key === selectedModelKey)?.[1]?.display || ""}
            items={modelosUnicos}
            onSelect={([key]) => {
              setSelectedModelKey(key);
              setSelectedColor("");
              setSelectedImei("");
            }}
            getItemKey={([key]) => key}
            getItemDisplay={([, info]) => info.display}
            renderItem={([key, info], onClick) => {
              return (
                <div
                  key={key}
                  onClick={onClick}
                  className="px-4 py-3 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-sm text-slate-200 border-b border-slate-900/50 last:border-b-0 flex items-center justify-between"
                >
                  <span className="font-medium truncate">{info.display}</span>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    {`(${info.totalStock} disp.)`}
                  </span>
                </div>
              );
            }}
          />
          <input type="hidden" name="celular" value={selectedModelKey} />
        </div>

        {/* SELECTOR DE COLOR */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Color</label>
          <DropdownSelect
            placeholder="Seleccione un color..."
            disabled={!selectedModelKey}
            disabledPlaceholder="Primero elija un modelo"
            valueDisplay={selectedColor}
            items={variantesColor}
            onSelect={(variante) => {
              setSelectedColor(variante.color);
              setSelectedImei("");
            }}
            getItemKey={(variante) => variante.color}
            getItemDisplay={(variante) => variante.color}
            renderItem={(variante, onClick) => {
              return (
                <div
                  key={variante.color}
                  onClick={onClick}
                  className="px-4 py-3 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-sm text-slate-200 border-b border-slate-900/50 last:border-b-0 flex items-center"
                >
                  <span className="font-medium">{variante.color}</span>
                </div>
              );
            }}
          />
          <input type="hidden" name="color_celular" value={selectedColor} />
        </div>

        {/* SELECTOR DE IMEI */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>IMEI</label>
          <DropdownSelect
            placeholder="Seleccione un IMEI..."
            disabled={!selectedColor}
            disabledPlaceholder="Primero elija un color"
            valueDisplay={selectedImei}
            items={imeisDisponibles}
            onSelect={(stockItem) => {
              setSelectedImei(stockItem.imei || "");
            }}
            getItemKey={(stockItem) => stockItem.imei || ""}
            getItemDisplay={(stockItem) => stockItem.imei || ""}
          />
          <input type="hidden" name="imei" value={selectedImei} />
        </div>

        {/* PRECIO DE COMPRA */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Precio de Compra</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.prefix}>$</span>
            <input
              type="text"
              name="precio_compra"
              className={styles.input}
              required
              placeholder="0.00"
              inputMode="decimal"
              pattern="^[0-9]+([.,][0-9]+)?$"
              title="Ingrese un número válido (ej. 100 o 100.50)"
              onInput={handleNumericInput}
              onBlur={handleNumericBlur}
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* PAGO INICIAL */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Pago Inicial</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.prefix}>$</span>
            <input
              type="text"
              name="pago_inicial"
              className={styles.input}
              required
              placeholder="0.00"
              inputMode="decimal"
              pattern="^[0-9]+([.,][0-9]+)?$"
              title="Ingrese un número válido (ej. 100 o 100.50)"
              onInput={handleNumericInput}
              onBlur={handleNumericBlur}
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* PAGO RECIBIDO */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Pago Recibido</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.prefix}>$</span>
            <input
              type="text"
              name="pago_recibido"
              className={styles.input}
              required
              placeholder="0.00"
              inputMode="decimal"
              pattern="^[0-9]+([.,][0-9]+)?$"
              title="Ingrese un número válido (ej. 100 o 100.50)"
              onInput={handleNumericInput}
              onBlur={handleNumericBlur}
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* DOCUMENTO / FOTO */}
        <div className="space-y-2 md:col-span-3">
          <label className={styles.label}>Comprobante (Imagen o PDF)</label>
          <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-secondary/40 rounded-xl p-3 bg-slate-950/20 transition-all group cursor-pointer h-[46px] select-none">
            <input
              type="file"
              name="comprobante"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              suppressHydrationWarning
            />
            <div className="flex items-center gap-2 text-center max-w-full px-2">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-secondary text-xl transition-colors shrink-0">
                cloud_upload
              </span>
              <p
                className="text-xs text-slate-300 font-medium truncate max-w-[150px] sm:max-w-[220px] md:max-w-[160px] lg:max-w-[240px]"
                title={selectedFileName || "Subir comprobante"}
              >
                {selectedFileName ? selectedFileName : "Subir comprobante"}
              </p>
            </div>
          </div>
        </div>

        {/* COMENTARIOS */}
        <div className="space-y-2 md:col-span-3">
          <label className={styles.label}>Comentarios (Opcional)</label>
          <textarea
            name="comentarios"
            placeholder="Escribe comentarios o notas adicionales..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all resize-none"
            rows={2}
            autoComplete="off"
            suppressHydrationWarning
          />
        </div>
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
