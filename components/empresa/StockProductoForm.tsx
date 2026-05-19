'use client';

import React from "react";
import { crearProducto } from "@/app/empresa/webapp/stock/stock-actions";
import SubmitButton from "./SubmitButton";

import { MARCAS, COLORES, RAMS, ALMACENAMIENTOS } from "@/utils/constants";

const styles = {
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  inputGroup: "space-y-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all",
};

export default function StockProductoForm() {
  const clientAction = async (formData: FormData) => {
    await crearProducto(formData);
  };

  return (
    <form action={clientAction} className="space-y-6">
      <div className={styles.grid}>
        
        {/* Marca */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Marca</label>
          <div className="relative">
            <select 
              name="marca" 
              required 
              className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-slate-950 text-white">Seleccionar...</option>
              {MARCAS.map(m => <option key={m} value={m} className="bg-slate-950 text-white">{m}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">expand_more</span>
          </div>
        </div>

        {/* Modelo */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Modelo</label>
          <input name="modelo" type="text" placeholder="Ej: iPhone 15 Pro" required className={styles.input} />
        </div>

        {/* Color */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Color</label>
          <div className="relative">
            <select 
              name="color" 
              required 
              className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-slate-950 text-white">Seleccionar...</option>
              {COLORES.map(c => <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">expand_more</span>
          </div>
        </div>

        {/* RAM */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>RAM</label>
          <div className="relative">
            <select 
              name="ram" 
              required 
              className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-slate-950 text-white">Seleccionar...</option>
              {RAMS.map(r => <option key={r} value={r} className="bg-slate-950 text-white">{r}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">expand_more</span>
          </div>
        </div>

        {/* Almacenamiento */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Almacenamiento</label>
          <div className="relative">
            <select 
              name="almacenamiento" 
              required 
              className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-slate-950 text-white">Seleccionar...</option>
              {ALMACENAMIENTOS.map(a => <option key={a} value={a} className="bg-slate-950 text-white">{a}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">expand_more</span>
          </div>
        </div>

        {/* Precio */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Precio de Compra</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
            <input name="precio" type="number" step="0.01" placeholder="0.00" required className={`${styles.input} pl-8`} />
          </div>
        </div>

      </div>

      <div className="pt-4">
        <SubmitButton label="Guardar Producto" loadingLabel="Registrando..." />
      </div>
    </form>
  );
}
