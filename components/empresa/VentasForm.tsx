'use client';

import React, { useState, useRef, useMemo } from "react";
import { submitVenta } from "@/app/empresa/webapp/ventas/actions";

interface Producto {
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  color: string;
  cantidadStock: number;
}

interface VentasFormProps {
  productos: Producto[];
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

export default function VentasForm({ productos }: VentasFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  
  const formRef = useRef<HTMLFormElement>(null);
  const lastPickerOpen = useRef(0);

  // 1. Agrupamos modelos y definimos el nuevo formato de visualización
  const modelosUnicos = useMemo(() => {
    const map = new Map();
    productos.forEach(p => {
      // Formato: MARCA MODELO - 256GB - 8GB
      const display = `${p.marca} ${p.modelo} - ${p.almacenamiento} - ${p.ram}`;
      const existing = map.get(display);
      
      if (!existing) {
        map.set(display, {
          display: display,
          marca: p.marca,
          modelo: p.modelo,
          totalStock: p.cantidadStock
        });
      } else {
        existing.totalStock += p.cantidadStock;
      }
    });
    return Array.from(map.entries());
  }, [productos]);

  // 2. Colores disponibles para el modelo seleccionado (ahora usamos el nuevo display como clave)
  const variantesColor = useMemo(() => {
    if (!selectedModelKey) return [];
    return productos
      .filter(p => `${p.marca} ${p.modelo} - ${p.almacenamiento} - ${p.ram}` === selectedModelKey)
      .map(p => ({
        color: p.color,
        hasStock: p.cantidadStock > 0
      }));
  }, [selectedModelKey, productos]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModelKey(event.target.value);
    setSelectedColor("");
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

    const result = await submitVenta(formData);

    if (result.success) {
      setStatus({ type: 'success', message: '¡Venta registrada y enviada a Discord!' });
      formRef.current?.reset();
      setSelectedModelKey("");
      setSelectedColor("");
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

        {/* SELECTOR DE MODELO CON NUEVO FORMATO */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Modelo de Celular</label>
          <select
            value={selectedModelKey}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            onChange={handleModelChange}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione un modelo...</option>
            {modelosUnicos.map(([key, info]) => (
              <option 
                key={key} 
                value={key} 
                className="bg-slate-950 text-white"
                disabled={info.totalStock === 0}
              >
                {info.display} {info.totalStock === 0 ? "(Sin stock)" : ""}
              </option>
            ))}
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
            onChange={(e) => setSelectedColor(e.target.value)}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedModelKey ? "Primero elija un modelo" : "Seleccione un color..."}
            </option>
            {variantesColor.map((v) => (
              <option 
                key={v.color} 
                value={v.color} 
                className="bg-slate-950 text-white"
                disabled={!v.hasStock}
              >
                {v.color} {!v.hasStock ? "(Sin stock)" : ""}
              </option>
            ))}
          </select>
          <input type="hidden" name="celular" value={selectedModelKey} />
          <input type="hidden" name="color_celular" value={selectedColor} />
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
            placeholder="Notas adicionales sobre la venta o entrega..."
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
