'use client';

import React from "react";
import { cargarStock } from "@/app/empresa/webapp/stock/stock-actions";
import SubmitButton from "./SubmitButton";

interface Product {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
}

interface Repartidor {
  id: string;
  nombre: string;
}

interface StockCargarFormProps {
  productos: Product[];
  repartidores: Repartidor[];
}

const styles = {
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  inputGroup: "space-y-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all",
};

export default function StockCargarForm({ productos, repartidores }: StockCargarFormProps) {
  
  const clientAction = async (formData: FormData) => {
    await cargarStock(formData);
  };

  return (
    <form action={clientAction} className="space-y-6">
      <div className={styles.inputGroup}>
        <label className={styles.label}>Seleccionar Producto</label>
        <div className="relative">
          <select 
            name="producto_id" 
            required 
            className={`${styles.input} appearance-none cursor-pointer bg-slate-950 text-slate-100`}
            style={{ colorScheme: 'dark' }}
            defaultValue=""
          >
            <option value="" className="bg-slate-950 text-white">Elegir modelo del catálogo...</option>
            {productos.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                {p.marca} {p.modelo} - {p.color} ({p.almacenamiento})
              </option>
            ))}
          </select>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
            expand_more
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Número de IMEI</label>
          <input 
            name="imei" 
            type="text" 
            placeholder="Ej: 354678123456789" 
            required 
            className={styles.input} 
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Ubicación/Repartidor</label>
          <div className="relative">
            <select 
              name="zona" 
              required 
              className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
              style={{ colorScheme: 'dark' }}
              defaultValue=""
            >
              <option value="" disabled className="bg-slate-950 text-slate-500 italic">Seleccionar repartidor/sucursal...</option>
              {repartidores.map(r => (
                <option key={r.id} value={r.id} className="bg-slate-950 text-white">
                  {r.nombre}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
              expand_more
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <SubmitButton label="Registrar Entrada de Stock" loadingLabel="Guardando..." />
      </div>
    </form>
  );
}
