'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import { submitVentaCambaceo } from "@/app/empresa/webapp/ventas/actions";

interface Producto {
  id: string;
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  color: string;
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
  disabled_estado?: string;
  estado: string;
  zona: string | null;
  imei?: string;
}

interface VentasCambaceadorFormProps {
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
  textarea: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[100px] resize-none",
  button: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer flex items-center justify-center gap-2",
  buttonDisabled: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-not-allowed flex items-center justify-center gap-2 opacity-70",
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-red-500/10 text-red-400 border border-red-500/20",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  relativeInputContainer: "relative flex items-center",
  enganchePrefix: "absolute left-4 text-slate-400 pointer-events-none"
};

export default function VentasCambaceadorForm({ productos, zonasReparto, stockItems }: VentasCambaceadorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [selectedCambaceadorId, setSelectedCambaceadorId] = useState<string>("");
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImei, setSelectedImei] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName("");
    }
  };

  // 1. Obtener la lista única de Cambaceadores (repartidores activos que contengan "cambaceo")
  const cambaceadoresList = useMemo(() => {
    const map = new Map<string, string>();
    (zonasReparto || []).forEach(z => {
      if (z.repartidor_id && z.repartidor_nombre && z.repartidor_activo) {
        if (z.repartidor_nombre.toLowerCase().includes("cambaceo")) {
          map.set(z.repartidor_id, z.repartidor_nombre);
        }
      }
    });
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [zonasReparto]);

  // 2. Filtrar stockItems según el cambaceador seleccionado
  const stockFiltrado = useMemo(() => {
    if (!selectedCambaceadorId) return [];
    return stockItems.filter(s => s.zona === selectedCambaceadorId);
  }, [selectedCambaceadorId, stockItems]);

  // 3. Mapeamos y filtramos los productos con stock para este cambaceador
  const productosConStock = useMemo(() => {
    if (!selectedCambaceadorId) return [];
    const idsConStock = new Set(stockFiltrado.map(s => s.producto_id));

    return productos
      .filter(p => idsConStock.has(p.id))
      .map(p => {
        const unidadesValidas = stockFiltrado.filter(s => s.producto_id === p.id);
        const cantidadDisponible = unidadesValidas.filter(s => s.estado === 'Disponible').length;
        const cantidadAConsultar = unidadesValidas.filter(s => s.estado === 'A consultar').length;

        return {
          ...p,
          cantidadDisponible,
          cantidadAConsultar,
          cantidadStock: cantidadDisponible + cantidadAConsultar
        };
      })
      .filter(p => p.cantidadStock > 0);
  }, [selectedCambaceadorId, productos, stockFiltrado]);

  // 4. Agrupamos modelos únicos con stock
  const modelosUnicos = useMemo(() => {
    const map = new Map();
    productosConStock.forEach(p => {
      const display = `${p.marca} ${p.modelo} - ${p.almacenamiento} - ${p.ram}`;
      const existing = map.get(display);

      if (!existing) {
        map.set(display, {
          display: display,
          marca: p.marca,
          modelo: p.modelo,
          totalDisponible: p.cantidadDisponible,
          totalAConsultar: p.cantidadAConsultar,
          totalStock: p.cantidadStock
        });
      } else {
        existing.totalDisponible += p.cantidadDisponible;
        existing.totalAConsultar += p.cantidadAConsultar;
        existing.totalStock += p.cantidadStock;
      }
    });
    return Array.from(map.entries());
  }, [productosConStock]);

  // 5. Colores disponibles para el modelo seleccionado
  const variantesColor = useMemo(() => {
    if (!selectedModelKey) return [];
    return productosConStock
      .filter(p => `${p.marca} ${p.modelo} - ${p.almacenamiento} - ${p.ram}` === selectedModelKey)
      .map(p => ({
        color: p.color,
        cantidadDisponible: p.cantidadDisponible,
        cantidadAConsultar: p.cantidadAConsultar,
        hasStock: p.cantidadDisponible > 0
      }));
  }, [selectedModelKey, productosConStock]);

  // 6. IMEIs disponibles para modelo y color seleccionados
  const imeisDisponibles = useMemo(() => {
    if (!selectedModelKey || !selectedColor) return [];
    const matchingProducts = productosConStock.filter(
      p => `${p.marca} ${p.modelo} - ${p.almacenamiento} - ${p.ram}` === selectedModelKey && p.color === selectedColor
    );
    const matchingProductIds = new Set(matchingProducts.map(p => p.id));
    return stockFiltrado.filter(
      s => matchingProductIds.has(s.producto_id) && s.estado === 'Disponible' && s.imei
    );
  }, [selectedModelKey, selectedColor, productosConStock, stockFiltrado]);

  const handleCambaceadorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCambaceadorId(event.target.value);
    setSelectedModelKey("");
    setSelectedColor("");
    setSelectedImei("");
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModelKey(event.target.value);
    setSelectedColor("");
    setSelectedImei("");
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

    const result = await submitVentaCambaceo(formData);

    if (result.success) {
      setStatus({ type: 'success', message: '¡Venta de Cambaceo registrada y enviada a Discord!' });
      formRef.current?.reset();
      setSelectedCambaceadorId("");
      setSelectedModelKey("");
      setSelectedColor("");
      setSelectedImei("");
      setSelectedFileName("");
    } else {
      setStatus({ type: 'error', message: result.error || 'Error al procesar la venta.' });
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
        {/* SELECTOR DE CAMBACEADOR */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Cambaceador</label>
          <select
            name="repartidor_id"
            value={selectedCambaceadorId}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            onChange={handleCambaceadorChange}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione su nombre...</option>
            {cambaceadoresList.map((camb) => (
              <option key={camb.id} value={camb.id} className="bg-slate-950 text-white">
                {camb.nombre}
              </option>
            ))}
          </select>
          <input 
            type="hidden" 
            name="repartidor" 
            value={cambaceadoresList.find(c => c.id === selectedCambaceadorId)?.nombre || ""} 
          />
        </div>


        {/* SELECTOR DE MODELO */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Modelo de Celular</label>
          <select
            value={selectedModelKey}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedCambaceadorId}
            onChange={handleModelChange}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedCambaceadorId ? "Primero elija su nombre..." : "Seleccione un modelo..."}
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

        {/* ENGANCHE CLIENTE */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Enganche cliente</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.enganchePrefix}>$</span>
            <input
              type="number"
              name="enganche_cliente"
              className={styles.engancheInput}
              required
              min="0"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* ENGANCHE PLATAFORMA */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Enganche plataforma</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.enganchePrefix}>$</span>
            <input
              type="number"
              name="enganche_plataforma"
              className={styles.engancheInput}
              required
              min="0"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* DOCUMENTO / FOTO (Opcional) */}
        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Documento / Foto (Opcional)</label>
          <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-secondary/40 rounded-xl p-6 bg-slate-950/20 transition-all group cursor-pointer">
            <input
              type="file"
              name="documento"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="text-center space-y-1">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-secondary text-3xl transition-colors">
                cloud_upload
              </span>
              <p className="text-xs text-slate-300 font-medium">
                {selectedFileName ? selectedFileName : "Selecciona una imagen o PDF"}
              </p>
              <p className="text-[10px] text-slate-500">Formatos permitidos: PNG, JPG, WEBP, PDF (Máx. 8MB)</p>
            </div>
          </div>
        </div>

        {/* COMENTARIOS (Opcional) */}
        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Comentarios (Opcional)</label>
          <textarea
            name="comentarios"
            className={styles.textarea}
            placeholder="Notas adicionales sobre la venta..."
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
          'Registrar Venta'
        )}
      </button>
    </form>
  );
}
