'use client';

import React from 'react';
import { styles, type CatalogoProducto } from '../ordenes-garantia-types';

interface FormSeccionEquipoGarantiaProps {
  selectedMarca: string;
  setSelectedMarca: (val: string) => void;
  selectedProductoDesc: string;
  setSelectedProductoDesc: (val: string) => void;
  marcasUnicas: string[];
  productosFiltrados: CatalogoProducto[];
  fechaEntrega: string;
  setFechaEntrega: (val: string) => void;
  isIOS: boolean;
  handleOpenPicker: (e: React.MouseEvent<HTMLInputElement>) => void;
}

export function FormSeccionEquipoGarantia({
  selectedMarca,
  setSelectedMarca,
  selectedProductoDesc,
  setSelectedProductoDesc,
  marcasUnicas,
  productosFiltrados,
  fechaEntrega,
  setFechaEntrega,
  isIOS,
  handleOpenPicker
}: FormSeccionEquipoGarantiaProps) {
  return (
    <>
      {/* SECCIÓN 2: INFORMACIÓN DEL EQUIPO (CATÁLOGO DETALLADO) */}
      <div>
        <h3 className={styles.sectionTitle}>Información del Equipo</h3>
        <div className={styles.formGrid}>
          {/* MARCA */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Marca</label>
            <div className="relative">
              <select
                value={selectedMarca}
                onChange={(e) => {
                  setSelectedMarca(e.target.value);
                  setSelectedProductoDesc("");
                }}
                className={styles.selectInput}
                style={{ colorScheme: 'dark' }}
                required
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione una marca...</option>
                {marcasUnicas.map((marca) => (
                  <option key={marca} value={marca} className="bg-slate-950 text-white">
                    {marca}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          {/* SELECCIONAR PRODUCTO (DETALLADO CON GBS Y COLOR) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Modelo</label>
            <div className="relative">
              <select
                value={selectedProductoDesc}
                onChange={(e) => setSelectedProductoDesc(e.target.value)}
                className={styles.selectInput}
                style={{ colorScheme: 'dark' }}
                required
                disabled={!selectedMarca}
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  {!selectedMarca ? "Primero elija una marca..." : "Elegir modelo..."}
                </option>
                {productosFiltrados.map((producto) => {
                  const labelCompleto = `${producto.modelo} - ${producto.color} (${producto.almacenamiento} / ${producto.ram})`;
                  return (
                    <option key={producto.id} value={labelCompleto} className="bg-slate-950 text-white">
                      {labelCompleto}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          {/* IMEI (MANUAL) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>IMEI</label>
            <input 
              type="text" 
              name="imei" 
              inputMode="numeric"
              pattern="[0-9]*"
              className={styles.input} 
              required 
              placeholder="Número de IMEI (15 dígitos)" 
            />
          </div>

          {/* TAG (MANUAL) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Tag</label>
            <input 
              type="text" 
              name="tag" 
              className={styles.input} 
              placeholder="Tag de Payjoy" 
              required
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: INFORMACIÓN DE LA COMPRA */}
      <div>
        <h3 className={styles.sectionTitle}>Información de la Compra</h3>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Fecha de entrega</label>
            <div className={styles.relativeInputContainer}>
              <span className={styles.pickerIcon}>calendar_today</span>
              <input 
                type="date" 
                name="fecha_entrega" 
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className={styles.pickerInput} 
                style={{ paddingLeft: "42px", color: "#f8fafc" }}
                onClick={handleOpenPicker}
                required
              />
              {!fechaEntrega && isIOS && (
                <span
                  className="absolute text-slate-500 text-sm pointer-events-none select-none"
                  style={{ left: "42px" }}
                >
                  dd/mm/aaaa
                </span>
              )}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Costo del equipo</label>
            <div className={styles.relativeInputContainer}>
              <span className="absolute left-4 text-slate-400 pointer-events-none">$</span>
              <input 
                type="number" 
                name="costo_equipo" 
                step="0.01" 
                min="0"
                inputMode="decimal"
                className={styles.input} 
                style={{ paddingLeft: "28px" }}
                placeholder="0.00" 
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Enganche registrado en sistema</label>
            <div className={styles.relativeInputContainer}>
              <span className="absolute left-4 text-slate-400 pointer-events-none">$</span>
              <input 
                type="number" 
                name="enganche_registrado" 
                step="0.01" 
                min="0"
                inputMode="decimal"
                className={styles.input} 
                style={{ paddingLeft: "28px" }}
                placeholder="0.00" 
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Enganche recibido</label>
            <div className={styles.relativeInputContainer}>
              <span className="absolute left-4 text-slate-400 pointer-events-none">$</span>
              <input 
                type="number" 
                name="enganche_recibido" 
                step="0.01" 
                min="0"
                inputMode="decimal"
                className={styles.input} 
                style={{ paddingLeft: "28px" }}
                placeholder="0.00" 
                required
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
