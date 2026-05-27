'use client';

import React, { useState } from "react";
import { cargarStock } from "@/app/empresa/webapp/stock/stock-actions";
import SubmitButton from "./SubmitButton";

interface Product {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
  ram: string;
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
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-red-500/10 text-red-400 border border-red-500/20",
};

export default function StockCargarForm({ productos, repartidores }: StockCargarFormProps) {
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const clientAction = async (formData: FormData) => {
    setStatus(null);
    try {
      const res = await cargarStock(formData);
      if (res && res.error) {
        if (res.error.toLowerCase().includes("duplicate key") || res.error.toLowerCase().includes("already exists")) {
          setStatus({
            type: "error",
            message: "El IMEI ingresado ya está registrado en el stock de la empresa."
          });
        } else {
          setStatus({
            type: "error",
            message: res.error
          });
        }
      }
    } catch (err: any) {
      // Si es un error de redirección interno de Next.js, lo volvemos a lanzar
      // para que Next.js pueda procesar la redirección a la página de stock.
      if (err.message === "NEXT_REDIRECT" || err.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      console.error(err);
      setStatus({
        type: "error",
        message: "Ocurrió un error inesperado al cargar el stock."
      });
    }
  };

  return (
    <form action={clientAction} className="space-y-6">
      {status && (
        <div className={status.type === 'success' ? styles.statusSuccess : styles.statusError}>
          <span className="material-symbols-outlined">
            {status.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {status.message}
        </div>
      )}
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
                {p.marca} {p.modelo} - {p.color} ({p.almacenamiento} / {p.ram})
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
