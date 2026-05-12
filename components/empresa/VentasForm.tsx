'use client';

import React, { useState, useRef, useMemo } from "react";
import { submitVenta } from "@/app/empresa/webapp/ventas/actions";

interface VentasFormProps {
  productos: any[];
}

const styles = {
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-6",
  inputGroup: "space-y-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed",
  button: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer"
};

export default function VentasForm({ productos }: VentasFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Estado para la selección jerárquica
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  
  const formRef = useRef<HTMLFormElement>(null);
  const lastPickerOpen = useRef(0);

  // 1. Agrupamos productos por "Base" (Marca + Modelo + Almacenamiento + RAM)
  const modelosUnicos = useMemo(() => {
    const map = new Map();
    productos.forEach(p => {
      const key = `${p.marca} ${p.modelo} (${p.almacenamiento}/${p.ram})`;
      if (!map.has(key)) {
        map.set(key, {
          display: key,
          marca: p.marca,
          modelo: p.modelo,
          almacenamiento: p.almacenamiento,
          ram: p.ram
        });
      }
    });
    return Array.from(map.entries());
  }, [productos]);

  // 2. Colores disponibles para el modelo seleccionado
  const coloresDisponibles = useMemo(() => {
    if (!selectedModelKey) return [];
    return productos
      .filter(p => `${p.marca} ${p.modelo} (${p.almacenamiento}/${p.ram})` === selectedModelKey)
      .map(p => p.color);
  }, [selectedModelKey, productos]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModelKey(e.target.value);
    setSelectedColor(""); // Resetear color al cambiar modelo
  };

  const handleOpenPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    const now = Date.now();
    if (now - lastPickerOpen.current < 500) return;

    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        lastPickerOpen.current = now;
        (e.currentTarget as any).showPicker();
      } catch (err) {
        lastPickerOpen.current = 0;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    
    // Aseguramos que los valores limpios del modelo y color se envíen
    // El modelo base (sin el paréntesis de la memoria para que sea más limpio en el log)
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
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
          <span className="material-symbols-outlined">
            {status.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${styles.inputGroup} md:col-span-2`}>
          <label className={styles.label}>Nombre de cliente</label>
          <input type="text" name="nombre_cliente" className={styles.input} required placeholder="Nombre completo" />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>¿Cuenta con Identificación?</label>
          <select
            name="identificacion_fisica"
            className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
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
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400 pointer-events-none">$</span>
            <input
              type="number"
              name="enganche"
              className={`${styles.input} pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              required
              min="0"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* SELECTOR DE MODELO (PASO 1) */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Modelo de Celular</label>
          <select
            value={selectedModelKey}
            className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
            style={{ colorScheme: 'dark' }}
            required
            onChange={handleModelChange}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione un modelo...</option>
            {modelosUnicos.map(([key, info]) => (
              <option key={key} value={key} className="bg-slate-950 text-white">
                {info.display}
              </option>
            ))}
          </select>
        </div>

        {/* SELECTOR DE COLOR (PASO 2 - DEPENDIENTE) */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Color disponible</label>
          <select
            name="color_celular_select"
            value={selectedColor}
            className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedModelKey}
            onChange={(e) => setSelectedColor(e.target.value)}
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedModelKey ? "Primero elija un modelo" : "Seleccione un color..."}
            </option>
            {coloresDisponibles.map((color) => (
              <option key={color} value={color} className="bg-slate-950 text-white">
                {color}
              </option>
            ))}
          </select>
          {/* Inputs ocultos para compatibilidad */}
          <input type="hidden" name="celular" value={selectedModelKey} />
          <input type="hidden" name="color_celular" value={selectedColor} />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>¿Cuenta activa?</label>
          <select
            name="cuenta_activa"
            className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
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
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base">calendar_today</span>
            <input
              type="date"
              name="fecha_entrega"
              className={`${styles.input} pl-10 [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden`}
              required
              onClick={handleOpenPicker}
            />
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Hora de entrega</label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base">schedule</span>
            <input
              type="time"
              name="hora_entrega"
              className={`${styles.input} pl-10 [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden`}
              required
              onClick={handleOpenPicker}
            />
          </div>
        </div>

        <div className={`${styles.inputGroup} md:col-span-2`}>
          <label className={styles.label}>Comentarios (Opcional)</label>
          <textarea
            name="comentarios"
            className={`${styles.input} min-h-[100px] resize-none`}
            placeholder="Notas adicionales sobre la venta o entrega..."
          />
        </div>
      </div>

      <button
        type="submit"
        className={`${styles.button} flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
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
