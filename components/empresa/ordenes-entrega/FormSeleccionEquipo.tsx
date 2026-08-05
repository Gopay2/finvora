'use client';

import React from 'react';

interface ModeloStockInfo {
  display: string;
  totalDisponible: number;
  totalAConsultar: number;
}

interface ImeiOption {
  imei?: string;
}

interface FormSeleccionEquipoProps {
  selectedZona: string;
  handleZonaChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  zonasUnicas: string[];
  selectedRepartidorId: string;
  handleRepartidorChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  repartidoresValidos: { id: string; nombre: string }[];
  selectedRepartidorName: string;
  selectedModelKey: string;
  handleModelChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  modelosUnicos: [string, ModeloStockInfo][];
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  variantesColor: { color: string; cantidadDisponible: number; cantidadAConsultar: number; hasStock: boolean }[];
  selectedImei: string;
  setSelectedImei: (imei: string) => void;
  imeisDisponibles: ImeiOption[];
  clienteHistorial: string;
  setClienteHistorial: (historial: string) => void;
  selectedProductCost: number;
  engancheValue: string;
  setEngancheValue: (val: string) => void;
  enganchePorcentajes: number[];
}

/**
 * Componente para la selección de zona de reparto, repartidor asignado, modelo de equipo, color, IMEI y calculador de enganche.
 */
export function FormSeleccionEquipo({
  selectedZona,
  handleZonaChange,
  zonasUnicas,
  selectedRepartidorId,
  handleRepartidorChange,
  repartidoresValidos,
  selectedRepartidorName,
  selectedModelKey,
  handleModelChange,
  modelosUnicos,
  selectedColor,
  setSelectedColor,
  variantesColor,
  selectedImei,
  setSelectedImei,
  imeisDisponibles,
  clienteHistorial,
  setClienteHistorial,
  selectedProductCost,
  engancheValue,
  setEngancheValue,
  enganchePorcentajes
}: FormSeleccionEquipoProps) {
  const styles = {
    inputGroup: "space-y-2",
    label: "text-sm font-medium text-slate-300 ml-1",
    selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer",
    engancheInput: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    relativeInputContainer: "relative flex items-center",
    enganchePrefix: "absolute left-4 text-slate-400 pointer-events-none",
    formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
    sectionTitle: "text-lg font-bold text-secondary border-b border-slate-800 pb-2 mb-4",
  };

  return (
    <div>
      <h3 className={styles.sectionTitle}>Selección de Zona y Equipo</h3>
      <div className={styles.formGrid}>

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
          suppressHydrationWarning
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
          suppressHydrationWarning
        >
          <option value="" className="bg-slate-950 text-slate-500 italic">
            {!selectedZona ? "Primero elija una zona" : "Seleccione un repartidor..."}
          </option>
          {repartidoresValidos.map((repartidorItem) => (
            <option key={repartidorItem.id} value={repartidorItem.id} className="bg-slate-950 text-white">
              {repartidorItem.nombre}
            </option>
          ))}
        </select>
        <input 
          type="hidden" 
          name="repartidor" 
          value={repartidoresValidos.find(repartidor => repartidor.id === selectedRepartidorId)?.nombre || ""} 
          suppressHydrationWarning
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
            suppressHydrationWarning
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione un local...</option>
            <option value="Península" className="bg-slate-950 text-white">Península</option>
            <option value="Landmark" className="bg-slate-950 text-white">Landmark</option>
            <option value="Río" className="bg-slate-950 text-white">Río</option>
            <option value="Tecnología" className="bg-slate-950 text-white">Tecnología</option>
            <option value="Brisas" className="bg-slate-950 text-white">Brisas</option>
            <option value="Carpas carrusel" className="bg-slate-950 text-white">Carpas carrusel</option>
            <option value="Plaza carrusel" className="bg-slate-950 text-white">Plaza carrusel</option>
            <option value="Macroplaza" className="bg-slate-950 text-white">Macroplaza</option>
          </select>
        </div>
      )}

      {/* SELECTOR DE MODELO */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Modelo de Celular</label>
        <select
          value={selectedModelKey}
          className={styles.selectInput}
          style={{ colorScheme: 'dark' }}
          required
          disabled={!selectedRepartidorId}
          onChange={handleModelChange}
          suppressHydrationWarning
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
          onChange={(event) => {
            setSelectedColor(event.target.value);
            setSelectedImei("");
          }}
          suppressHydrationWarning
        >
          <option value="" className="bg-slate-950 text-slate-500 italic">
            {!selectedModelKey ? "Primero elija un modelo" : "Seleccione un color..."}
          </option>
          {variantesColor.map((varianteItem) => {
            const isAConsultar = varianteItem.cantidadDisponible === 0 && varianteItem.cantidadAConsultar > 0;
            return (
              <option 
                key={varianteItem.color} 
                value={varianteItem.color} 
                className={isAConsultar ? "text-slate-500 bg-slate-950 italic" : "text-white bg-slate-950"}
                disabled={isAConsultar}
              >
                {isAConsultar ? `${varianteItem.color} (A consultar)` : varianteItem.color}
              </option>
            );
          })}
        </select>
        <input type="hidden" name="celular" value={selectedModelKey} suppressHydrationWarning />
        <input type="hidden" name="color_celular" value={selectedColor} suppressHydrationWarning />
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
          onChange={(event) => {
            setSelectedImei(event.target.value);
            setEngancheValue("");
          }}
          suppressHydrationWarning
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
        <label className={styles.label}>¿Cliente con historial?</label>
        <select
          name="cliente_historial"
          value={clienteHistorial}
          className={styles.selectInput}
          style={{ colorScheme: 'dark' }}
          required
          disabled={!selectedImei}
          onChange={(event) => {
            setClienteHistorial(event.target.value);
            setEngancheValue("");
          }}
          suppressHydrationWarning
        >
          <option value="" className="bg-slate-950 text-slate-500 italic">
            {!selectedImei ? "Primero elija un IMEI..." : "Seleccione..."}
          </option>
          <option value="Si" className="bg-slate-950 text-white">Sí</option>
          <option value="No" className="bg-slate-950 text-white">No</option>
        </select>
      </div>

      {selectedProductCost > 0 ? (
        <div className={styles.inputGroup}>
          <label className={styles.label}>Enganche</label>
          <select
            name="enganche"
            value={engancheValue}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!clienteHistorial}
            onChange={(event) => setEngancheValue(event.target.value)}
            suppressHydrationWarning
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!clienteHistorial ? "Primero elija historial" : "Seleccione..."}
            </option>
            {enganchePorcentajes.map((porcentajeValue) => {
              const valorCalculado = (selectedProductCost * (porcentajeValue / 100)).toFixed(2);
              return (
                <option key={porcentajeValue} value={valorCalculado} className="bg-slate-950 text-white">
                  ${valorCalculado} ({porcentajeValue}%)
                </option>
              );
            })}
          </select>
        </div>
      ) : (
        <div className={styles.inputGroup}>
          <label className={styles.label}>Enganche</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.enganchePrefix}>$</span>
            <input
              type="number"
              name="enganche"
              value={engancheValue}
              onChange={(event) => setEngancheValue(event.target.value)}
              className={styles.engancheInput}
              required
              min="0"
              placeholder={!clienteHistorial ? "Primero elija historial" : "0.00"}
              disabled={!clienteHistorial}
              suppressHydrationWarning
            />
          </div>
        </div>
      )}
    </div>
  </div>
);
}
