'use client';

import React, { useState, useRef, useMemo } from "react";
import { submitOrdenEntrega } from "@/app/empresa/webapp/ordenes-entrega/actions";

interface Producto {
  id: string;
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  color: string;
}

interface ProductoConStock extends Producto {
  cantidadStock: number;
}

interface RepartoZonaInfo {
  id: string;
  nombre_zona: string;
  repartidor_id: string;
  repartidor_nombre: string;
  repartidor_activo: boolean;
}

interface StockItem {
  producto_id: string;
  estado: string;
  zona: string | null;
  imei?: string;
}

interface OrdenesEntregaFormProps {
  productos: Producto[];
  zonasReparto: RepartoZonaInfo[];
  stockItems: StockItem[];
}

const styles = {
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-6",
  inputGroup: "space-y-2",
  inputGroupFull: "space-y-2 md:col-span-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed",
  selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer",
  engancheInput: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
  pickerInput: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed pl-10 [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden",
  textarea: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[100px] resize-none",
  button: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer flex items-center justify-center gap-2",
  buttonDisabled: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-not-allowed flex items-center justify-center gap-2 opacity-70",
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-red-500/10 text-red-400 border border-red-500/20",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  relativeInputContainer: "relative flex items-center",
  enganchePrefix: "absolute left-4 text-slate-400 pointer-events-none",
  pickerIcon: "absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base"
};

export default function OrdenesEntregaForm({ productos, zonasReparto, stockItems }: OrdenesEntregaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedZona, setSelectedZona] = useState<string>("");
  const [selectedRepartidorId, setSelectedRepartidorId] = useState<string>("");
  const [selectedImei, setSelectedImei] = useState<string>("");
  
  const formRef = useRef<HTMLFormElement>(null);
  const lastPickerOpen = useRef(0);

  // 1. Filtrar stockItems según el repartidor seleccionado
  const stockFiltrado = useMemo(() => {
    if (!selectedRepartidorId) return [];
    return stockItems.filter(stockItem => stockItem.zona === selectedRepartidorId);
  }, [selectedRepartidorId, stockItems]);

  // 2. Mapeamos y filtramos los productos que tienen stock asignado a este repartidor (cantidad > 0)
  const productosConStock = useMemo(() => {
    if (!selectedRepartidorId) return [];
    
    // Obtenemos los IDs de productos del catálogo que tienen stock físico con el repartidor
    const idsConStock = new Set(stockFiltrado.map(stockItem => stockItem.producto_id));

    return productos
      .filter(producto => idsConStock.has(producto.id))
      .map(producto => {
        const unidadesValidas = stockFiltrado.filter(stockItem => stockItem.producto_id === producto.id);
        const cantidadDisponible = unidadesValidas.filter(stockItem => stockItem.estado === 'Disponible').length;
        const cantidadAConsultar = unidadesValidas.filter(stockItem => stockItem.estado === 'A consultar').length;
        
        return {
          ...producto,
          cantidadDisponible,
          cantidadAConsultar,
          cantidadStock: cantidadDisponible + cantidadAConsultar
        };
      })
      .filter(producto => producto.cantidadStock > 0); // Nos aseguramos de que solo pasen productos con stock positivo
  }, [selectedRepartidorId, productos, stockFiltrado]);

  // 3. Agrupamos modelos únicos a partir de los productos con stock
  const modelosUnicos = useMemo(() => {
    const map = new Map();
    productosConStock.forEach(producto => {
      // Formato: MARCA MODELO - 256GB - 8GB
      const display = `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}`;
      const existing = map.get(display);
      
      if (!existing) {
        map.set(display, {
          display: display,
          marca: producto.marca,
          modelo: producto.modelo,
          totalDisponible: producto.cantidadDisponible,
          totalAConsultar: producto.cantidadAConsultar,
          totalStock: producto.cantidadStock
        });
      } else {
        existing.totalDisponible += producto.cantidadDisponible;
        existing.totalAConsultar += producto.cantidadAConsultar;
        existing.totalStock += producto.cantidadStock;
      }
    });
    return Array.from(map.entries());
  }, [productosConStock]);

  // 4. Colores disponibles para el modelo seleccionado de los productos con stock
  const variantesColor = useMemo(() => {
    if (!selectedModelKey) return [];
    return productosConStock
      .filter(producto => `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}` === selectedModelKey)
      .map(producto => ({
        color: producto.color,
        cantidadDisponible: producto.cantidadDisponible,
        cantidadAConsultar: producto.cantidadAConsultar,
        hasStock: producto.cantidadDisponible > 0
      }));
  }, [selectedModelKey, productosConStock]);

  // 4.5. IMEIs disponibles para el modelo y color seleccionados del stock del repartidor
  const imeisDisponibles = useMemo(() => {
    if (!selectedModelKey || !selectedColor) return [];
    const matchingProducts = productosConStock.filter(
      producto => `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}` === selectedModelKey && producto.color === selectedColor
    );
    const matchingProductIds = new Set(matchingProducts.map(producto => producto.id));
    return stockFiltrado.filter(
      stockItem => matchingProductIds.has(stockItem.producto_id) && stockItem.estado === 'Disponible' && stockItem.imei
    );
  }, [selectedModelKey, selectedColor, productosConStock, stockFiltrado]);

  // 5. Zonas únicas configuradas
  const zonasUnicas = useMemo(() => {
    const set = new Set<string>();
    (zonasReparto || []).forEach(zonaInfo => {
      if (zonaInfo.nombre_zona) {
        set.add(zonaInfo.nombre_zona);
      }
    });
    return Array.from(set).sort();
  }, [zonasReparto]);

  // 6. Repartidores válidos según la zona seleccionada (excluyendo cambaceadores)
  const repartidoresValidos = useMemo(() => {
    if (!selectedZona) return [];
    const map = new Map<string, string>();
    (zonasReparto || [])
      .filter(zonaInfo => 
        zonaInfo.nombre_zona === selectedZona && 
        zonaInfo.repartidor_nombre &&
        !zonaInfo.repartidor_nombre.toLowerCase().includes("cambaceo")
      )
      .forEach(zonaInfo => {
        map.set(zonaInfo.repartidor_id, zonaInfo.repartidor_nombre);
      });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [selectedZona, zonasReparto]);

  const selectedRepartidorName = useMemo(() => {
    return repartidoresValidos.find(repartidor => repartidor.id === selectedRepartidorId)?.nombre || "";
  }, [selectedRepartidorId, repartidoresValidos]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModelKey(event.target.value);
    setSelectedColor("");
    setSelectedImei("");
  };

  const handleZonaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedZona(event.target.value);
    setSelectedRepartidorId("");
    setSelectedModelKey("");
    setSelectedColor("");
    setSelectedImei("");
  };

  const handleRepartidorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRepartidorId(event.target.value);
    setSelectedModelKey("");
    setSelectedColor("");
    setSelectedImei("");
  };

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const baseInfo = modelosUnicos.find(([key]) => key === selectedModelKey)?.[1];
    
    if (baseInfo) {
      formData.set("celular", `${baseInfo.marca} ${baseInfo.modelo}`);
    }
    formData.set("color_celular", selectedColor);

    const result = await submitOrdenEntrega(formData);

    if (result.success) {
      setStatus({ type: 'success', message: `¡Orden de Entrega ${result.folio || ''} registrada y enviada a Discord!` });
      formRef.current?.reset();
      setSelectedModelKey("");
      setSelectedColor("");
      setSelectedZona("");
      setSelectedRepartidorId("");
      setSelectedImei("");
    } else {
      setStatus({ type: 'error', message: result.error || 'Error al procesar la orden.' });
    }
    setIsSubmitting(false);
  };

  return (
    <form ref={formRef} className={styles.formCard} onSubmit={handleSubmit}>
      {status && (
        <div className={status.type === 'success' ? styles.statusSuccess : styles.statusError}>
          <span className="material-symbols-outlined">
            {status.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {status.message}
        </div>
      )}

      <div className={styles.formGrid}>
        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Nombre de cliente</label>
          <input type="text" name="nombre_cliente" className={styles.input} required placeholder="Nombre completo" />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>¿Cuenta con Identificación?</label>
          <select
            name="identificacion_fisica"
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
          >
            <option value="Si" className="bg-slate-950 text-white">Sí cuenta con INE/Residencia</option>
            <option value="No" className="bg-slate-950 text-white">No cuenta con INE/Residencia</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>CURP</label>
          <input
            type="text"
            name="curp"
            className={styles.input}
            required
            placeholder="Ingrese los 18 caracteres de la CURP"
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Número de teléfono</label>
          <input type="tel" name="telefono" className={styles.input} required placeholder="Ej: 5212345678900" />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Dirección</label>
          <input type="text" name="direccion" className={styles.input} required placeholder="Enlace Google Maps" />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Enganche</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.enganchePrefix}>$</span>
            <input
              type="number"
              name="enganche"
              className={styles.engancheInput}
              required
              min="0"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>¿Cuenta activa?</label>
          <select
            name="cuenta_activa"
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            defaultValue="si"
          >
            <option value="si" className="bg-slate-950 text-white">Sí</option>
            <option value="no" className="bg-slate-950 text-white">No</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>¿Cliente con historial?</label>
          <select
            name="cliente_historial"
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            defaultValue=""
          >
            <option value="" disabled className="bg-slate-950 text-slate-500 italic">Seleccione...</option>
            <option value="Si" className="bg-slate-950 text-white">Sí</option>
            <option value="No" className="bg-slate-950 text-white">No</option>
          </select>
        </div>

        {/* SELECTOR DE ZONA */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Zona de reparto</label>
          <select
            name="zona"
            value={selectedZona}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            onChange={handleZonaChange}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione una zona...</option>
            {zonasUnicas.map((zona) => (
              <option key={zona} value={zona} className="bg-slate-950 text-white">
                {zona}
              </option>
            ))}
          </select>
        </div>

        {/* SELECTOR DE REPARTIDOR */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Repartidor</label>
          <select
            name="repartidor_id"
            value={selectedRepartidorId}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedZona}
            onChange={handleRepartidorChange}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedZona ? "Primero elija una zona" : "Seleccione un repartidor..."}
            </option>
            {repartidoresValidos.map((rep) => (
              <option key={rep.id} value={rep.id} className="bg-slate-950 text-white">
                {rep.nombre}
              </option>
            ))}
          </select>
          <input 
            type="hidden" 
            name="repartidor" 
            value={repartidoresValidos.find(repartidor => repartidor.id === selectedRepartidorId)?.nombre || ""} 
          />
        </div>

        {/* ESPECIFICAR LOCAL (Solo si se selecciona "Local CT") */}
        {selectedRepartidorName === "Local CT" && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Especificar local</label>
            <select
              name="especificar_local"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione un local...</option>
              <option value="Península" className="bg-slate-950 text-white">Península</option>
              <option value="Landmark" className="bg-slate-950 text-white">Landmark</option>
              <option value="Río" className="bg-slate-950 text-white">Río</option>
              <option value="Tecnología" className="bg-slate-950 text-white">Tecnología</option>
              <option value="Brisas" className="bg-slate-950 text-white">Brisas</option>
              <option value="Carpas carrusel" className="bg-slate-950 text-white">Carpas carrusel</option>
              <option value="Plaza carrusel" className="bg-slate-950 text-white">Plaza carrusel</option>
            </select>
          </div>
        )}

        {/* SELECTOR DE MODELO CON NUEVO FORMATO */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Modelo de Celular</label>
          <select
            value={selectedModelKey}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedRepartidorId}
            onChange={handleModelChange}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedRepartidorId ? "Primero elija un repartidor..." : "Seleccione un modelo..."}
            </option>
            {modelosUnicos.map(([key, info]) => {
              const isAConsultar = info.totalDisponible === 0 && info.totalAConsultar > 0;
              return (
                <option 
                  key={key} 
                  value={key} 
                  className={isAConsultar ? "text-slate-500 bg-slate-950 italic" : "text-white bg-slate-950"}
                  disabled={isAConsultar}
                >
                  {isAConsultar 
                    ? `${info.display} (A consultar)` 
                    : `${info.display} (${info.totalDisponible} disponible${info.totalDisponible > 1 ? "s" : ""})`
                  }
                </option>
              );
            })}
          </select>
        </div>

        {/* SELECTOR DE COLOR */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Color disponible</label>
          <select
            name="color_celular_select"
            value={selectedColor}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedModelKey}
            onChange={(e) => {
              setSelectedColor(e.target.value);
              setSelectedImei("");
            }}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedModelKey ? "Primero elija un modelo" : "Seleccione un color..."}
            </option>
            {variantesColor.map((v) => {
              const isAConsultar = v.cantidadDisponible === 0 && v.cantidadAConsultar > 0;
              return (
                <option 
                  key={v.color} 
                  value={v.color} 
                  className={isAConsultar ? "text-slate-500 bg-slate-950 italic" : "text-white bg-slate-950"}
                  disabled={isAConsultar}
                >
                  {isAConsultar ? `${v.color} (A consultar)` : v.color}
                </option>
              );
            })}
          </select>
          <input type="hidden" name="celular" value={selectedModelKey} />
          <input type="hidden" name="color_celular" value={selectedColor} />
        </div>

        {/* SELECTOR DE IMEI */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>IMEI</label>
          <select
            name="imei"
            value={selectedImei}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedColor}
            onChange={(e) => setSelectedImei(e.target.value)}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedColor ? "Primero elija un color" : "Seleccione un IMEI..."}
            </option>
            {imeisDisponibles.map((item) => (
              <option key={item.imei} value={item.imei} className="bg-slate-950 text-white">
                {item.imei}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Fecha de entrega</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.pickerIcon}>calendar_today</span>
            <input
              type="date"
              name="fecha_entrega"
              className={styles.pickerInput}
              required
              onClick={handleOpenPicker}
            />
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Hora de entrega</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.pickerIcon}>schedule</span>
            <input
              type="time"
              name="hora_entrega"
              className={styles.pickerInput}
              required
              onClick={handleOpenPicker}
            />
          </div>
        </div>

        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Comentarios (Opcional)</label>
          <textarea
            name="comentarios"
            className={styles.textarea}
            placeholder="Notas adicionales sobre la orden o entrega..."
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
            Procesando...
          </>
        ) : (
          'Registrar Orden de Entrega'
        )}
      </button>
    </form>
  );
}