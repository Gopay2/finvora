'use client';

import React from 'react';
import type { OptionItem, StockItem, ModeloAgrupado } from '../comprobantes-types';
import { styles } from '../comprobantes-types';
import { VendedorAutocomplete } from '../VendedorAutocomplete';
import { DropdownSelect } from '../DropdownSelect';

interface FormSeleccionEquipoComprobanteProps {
  vendedores: OptionItem[];
  repartidores: OptionItem[];
  vendedorSearch: string;
  setVendedorSearch: (val: string) => void;
  selectedVendedor: OptionItem | null;
  setSelectedVendedor: (val: OptionItem | null) => void;
  selectedRepartidorId: string;
  setSelectedRepartidorId: (val: string) => void;
  selectedModelKey: string;
  setSelectedModelKey: (val: string) => void;
  selectedColor: string;
  setSelectedColor: (val: string) => void;
  selectedImei: string;
  setSelectedImei: (val: string) => void;
  modelosUnicos: [string, ModeloAgrupado][];
  variantesColor: {
    color: string;
    cantidadDisponible: number;
    cantidadAConsultar: number;
    cantidadEnEnvio: number;
    hasStock: boolean;
  }[];
  imeisDisponibles: StockItem[];
}

export function FormSeleccionEquipoComprobante({
  vendedores,
  repartidores,
  vendedorSearch,
  setVendedorSearch,
  selectedVendedor,
  setSelectedVendedor,
  selectedRepartidorId,
  setSelectedRepartidorId,
  selectedModelKey,
  setSelectedModelKey,
  selectedColor,
  setSelectedColor,
  selectedImei,
  setSelectedImei,
  modelosUnicos,
  variantesColor,
  imeisDisponibles
}: FormSeleccionEquipoComprobanteProps) {
  return (
    <>
      {/* NOMBRE DEL CLIENTE */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Nombre del Cliente</label>
        <input
          type="text"
          name="nombre_cliente"
          placeholder="Escribe el nombre del cliente..."
          className={styles.textInput}
          required
          autoComplete="off"
          suppressHydrationWarning
        />
      </div>

      {/* SELECTOR DE VENDEDOR AUTOCOMPLETE */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Vendedor</label>
        <VendedorAutocomplete
          vendedores={vendedores}
          vendedorSearch={vendedorSearch}
          setVendedorSearch={setVendedorSearch}
          selectedVendedor={selectedVendedor}
          setSelectedVendedor={setSelectedVendedor}
        />
      </div>

      {/* SELECTOR DE REPARTIDOR */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Repartidor/Ubicación</label>
        <DropdownSelect
          placeholder="Seleccione el repartidor/ubicación..."
          valueDisplay={repartidores.find(r => r.id === selectedRepartidorId)?.display || ""}
          items={repartidores}
          onSelect={(repartidor) => {
            setSelectedRepartidorId(repartidor.id);
            setSelectedModelKey("");
            setSelectedColor("");
            setSelectedImei("");
          }}
          getItemKey={(repartidor) => repartidor.id}
          getItemDisplay={(repartidor) => repartidor.display}
        />
        <input
          type="hidden"
          name="repartidor_id"
          value={selectedRepartidorId}
        />
      </div>

      {/* SELECTOR DE MODELO DE CELULAR */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Modelo de Celular</label>
        <DropdownSelect
          placeholder="Seleccione un modelo..."
          disabled={!selectedRepartidorId}
          disabledPlaceholder="Primero elija ubicación"
          valueDisplay={modelosUnicos.find(([key]) => key === selectedModelKey)?.[1]?.display || ""}
          items={modelosUnicos}
          onSelect={([key]) => {
            setSelectedModelKey(key);
            setSelectedColor("");
            setSelectedImei("");
          }}
          getItemKey={([key]) => key}
          getItemDisplay={([, info]) => info.display}
          renderItem={([key, info], onClick) => {
            return (
              <div
                key={key}
                onClick={onClick}
                className="px-4 py-3 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-sm text-slate-200 border-b border-slate-900/50 last:border-b-0 flex items-center justify-between"
              >
                <span className="font-medium truncate">{info.display}</span>
                <span className="text-xs text-slate-400 shrink-0 ml-2">
                  {`(${info.totalStock} disp.)`}
                </span>
              </div>
            );
          }}
        />
        <input type="hidden" name="celular" value={selectedModelKey} />
      </div>

      {/* SELECTOR DE COLOR */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Color</label>
        <DropdownSelect
          placeholder="Seleccione un color..."
          disabled={!selectedModelKey}
          disabledPlaceholder="Primero elija un modelo"
          valueDisplay={selectedColor}
          items={variantesColor}
          onSelect={(variante) => {
            setSelectedColor(variante.color);
            setSelectedImei("");
          }}
          getItemKey={(variante) => variante.color}
          getItemDisplay={(variante) => variante.color}
          renderItem={(variante, onClick) => {
            return (
              <div
                key={variante.color}
                onClick={onClick}
                className="px-4 py-3 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-sm text-slate-200 border-b border-slate-900/50 last:border-b-0 flex items-center"
              >
                <span className="font-medium">{variante.color}</span>
              </div>
            );
          }}
        />
        <input type="hidden" name="color_celular" value={selectedColor} />
      </div>

      {/* SELECTOR DE IMEI */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>IMEI</label>
        <DropdownSelect
          placeholder="Seleccione un IMEI..."
          disabled={!selectedColor}
          disabledPlaceholder="Primero elija un color"
          valueDisplay={selectedImei}
          items={imeisDisponibles}
          onSelect={(stockItem) => {
            setSelectedImei(stockItem.imei || "");
          }}
          getItemKey={(stockItem) => stockItem.imei || ""}
          getItemDisplay={(stockItem) => stockItem.imei || ""}
        />
        <input type="hidden" name="imei" value={selectedImei} />
      </div>
    </>
  );
}
