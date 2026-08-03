'use client';

import React from 'react';
import { styles } from '../ordenes-garantia-types';

interface FormSeccionClienteGarantiaProps {
  selectedZona: string;
  setSelectedZona: (val: string) => void;
  zonasUnicas: string[];
}

export function FormSeccionClienteGarantia({
  selectedZona,
  setSelectedZona,
  zonasUnicas
}: FormSeccionClienteGarantiaProps) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Información del Cliente</h3>
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Nombre del cliente</label>
          <input 
            type="text" 
            name="nombre_cliente" 
            className={styles.input} 
            required 
            placeholder="Nombre completo" 
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Número de contacto</label>
          <input 
            type="tel" 
            name="telefono" 
            className={styles.input} 
            required 
            placeholder="Ej: 5212345678900" 
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Zona de recepción</label>
          <div className="relative">
            <select
              name="zona"
              value={selectedZona}
              onChange={(e) => setSelectedZona(e.target.value)}
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione una zona...</option>
              {zonasUnicas.map((zona) => (
                <option key={zona} value={zona} className="bg-slate-950 text-white">
                  {zona}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Ubicación</label>
          <input 
            type="text" 
            name="ubicacion" 
            className={styles.input} 
            required 
            placeholder="Enlace de Google Maps" 
          />
        </div>
      </div>
    </div>
  );
}
