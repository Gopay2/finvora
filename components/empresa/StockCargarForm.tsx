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

interface StockCargarFormProps {
  productos: Product[];
}

const styles = {
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  inputGroup: "space-y-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all",
};

export default function StockCargarForm({ productos }: StockCargarFormProps) {
  
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
          <label className={styles.label}>Ubicación</label>
          <div className="relative">
            <select 
              name="zona" 
              required 
              className={`${styles.input} appearance-none cursor-pointer bg-slate-950`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="Repartidor Angel" className="bg-slate-950 text-white">Repartidor Angel</option>
              <option value="Repartidor Felix" className="bg-slate-950 text-white">Repartidor Felix</option>
              <option value="Repartidor Eleazar" className="bg-slate-950 text-white">Repartidor Eleazar</option>
              <option value="Repartidor Humberto" className="bg-slate-950 text-white">Repartidor Humberto</option>
              <option value="Repartidor JR (CT)" className="bg-slate-950 text-white">Repartidor JR (CT)</option>
              <option value="Repartidor Hector (CT)" className="bg-slate-950 text-white">Repartidor Hector (CT)</option>
              <option value="Local Fusion Tech" className="bg-slate-950 text-white">Local Fusion Tech</option>
              <option value="Local Rosarito" className="bg-slate-950 text-white">Local Rosarito</option>
              <option value="Local CyM 1" className="bg-slate-950 text-white">Local CyM 1</option>
              <option value="Local CyM 2" className="bg-slate-950 text-white">Local CyM 2</option>
              <option value="Local Olgin" className="bg-slate-950 text-white">Local Olgin</option>
              <option value="Monterrey" className="bg-slate-950 text-white">Monterrey</option>
              <option value="Cambaceo Victor" className="bg-slate-950 text-white">Cambaceo Victor</option>
              <option value="Cambaceo Esteban" className="bg-slate-950 text-white">Cambaceo Esteban</option>
              <option value="Proveedor Android" className="bg-slate-950 text-white">Proveedor Android</option>
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
