'use client';

import React from 'react';
import { styles, handleNumericInput, handleNumericBlur } from '../comprobantes-types';
import { DropdownSelect } from '../DropdownSelect';

interface FormCamposFinancierosComprobanteProps {
  fechaProximoPago: string;
  setFechaProximoPago: (val: string) => void;
  selectedPlazo: string;
  setSelectedPlazo: (val: string) => void;
  selectedFileName: string;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormCamposFinancierosComprobante({
  fechaProximoPago,
  setFechaProximoPago,
  selectedPlazo,
  setSelectedPlazo,
  selectedFileName,
  handleFileChange
}: FormCamposFinancierosComprobanteProps) {
  return (
    <>
      {/* FECHA DEL PROXIMO PAGO */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Fecha del próximo pago</label>
        <div className="relative flex items-center">
          <span
            className="absolute text-slate-400 pointer-events-none material-symbols-outlined text-base z-10 leading-none"
            style={{ left: "16px", top: "50%", transform: "translateY(-50%)" }}
          >
            calendar_today
          </span>
          {!fechaProximoPago && (
            <span
              className="absolute text-slate-500 text-sm pointer-events-none z-10 select-none leading-none"
              style={{ left: "44px", top: "50%", transform: "translateY(-50%)" }}
            >
              dd/mm/aaaa
            </span>
          )}
          <input
            type="date"
            name="fecha_proximo_pago"
            value={fechaProximoPago}
            onChange={(e) => setFechaProximoPago(e.target.value)}
            onKeyDown={(e) => e.preventDefault()}
            onClick={(e) => {
              try {
                e.currentTarget.showPicker();
              } catch {}
            }}
            className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl pr-4 py-3 text-sm focus:outline-none focus:border-secondary transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
              fechaProximoPago ? "text-slate-100" : "text-transparent"
            }`}
            style={{ colorScheme: 'dark', paddingLeft: '44px' }}
            required
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* PRECIO DE COMPRA */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Precio de Compra</label>
        <div className={styles.relativeInputContainer}>
          <span className={styles.prefix}>$</span>
          <input
            type="text"
            name="precio_compra"
            className={styles.input}
            required
            placeholder="0.00"
            inputMode="decimal"
            pattern="^[0-9]+([.,][0-9]+)?$"
            title="Ingrese un número válido (ej. 100 o 100.50)"
            onInput={handleNumericInput}
            onBlur={handleNumericBlur}
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* PAGO INICIAL */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Pago Inicial</label>
        <div className={styles.relativeInputContainer}>
          <span className={styles.prefix}>$</span>
          <input
            type="text"
            name="pago_inicial"
            className={styles.input}
            required
            placeholder="0.00"
            inputMode="decimal"
            pattern="^[0-9]+([.,][0-9]+)?$"
            title="Ingrese un número válido (ej. 100 o 100.50)"
            onInput={handleNumericInput}
            onBlur={handleNumericBlur}
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* PAGO RECIBIDO */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Pago Recibido</label>
        <div className={styles.relativeInputContainer}>
          <span className={styles.prefix}>$</span>
          <input
            type="text"
            name="pago_recibido"
            className={styles.input}
            required
            placeholder="0.00"
            inputMode="decimal"
            pattern="^[0-9]+([.,][0-9]+)?$"
            title="Ingrese un número válido (ej. 100 o 100.50)"
            onInput={handleNumericInput}
            onBlur={handleNumericBlur}
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* PAGO SEMANAL */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Pago Semanal</label>
        <div className={styles.relativeInputContainer}>
          <span className={styles.prefix}>$</span>
          <input
            type="text"
            name="pago_semanal"
            className={styles.input}
            required
            placeholder="0.00"
            inputMode="decimal"
            pattern="^[0-9]+([.,][0-9]+)?$"
            title="Ingrese un número válido (ej. 100 o 100.50)"
            onInput={handleNumericInput}
            onBlur={handleNumericBlur}
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* PLAZOS */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Plazos</label>
        <DropdownSelect
          placeholder="Seleccione plazo..."
          valueDisplay={selectedPlazo}
          items={[
            { id: "13", display: "13" },
            { id: "26", display: "26" },
            { id: "39", display: "39" },
            { id: "52", display: "52" }
          ]}
          onSelect={(plazo) => {
            setSelectedPlazo(plazo.id);
          }}
          getItemKey={(plazo) => plazo.id}
          getItemDisplay={(plazo) => plazo.display}
        />
        <input
          type="hidden"
          name="plazos"
          value={selectedPlazo}
        />
      </div>

      {/* PRECIO TOTAL */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Precio Total</label>
        <div className={styles.relativeInputContainer}>
          <span className={styles.prefix}>$</span>
          <input
            type="text"
            name="precio_total"
            className={styles.input}
            required
            placeholder="0.00"
            inputMode="decimal"
            pattern="^[0-9]+([.,][0-9]+)?$"
            title="Ingrese un número válido (ej. 100 o 100.50)"
            onInput={handleNumericInput}
            onBlur={handleNumericBlur}
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* TAG */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Tag</label>
        <input
          type="text"
          name="tag"
          placeholder="Escribe el tag..."
          className={styles.textInput}
          required
          autoComplete="off"
          suppressHydrationWarning
        />
      </div>

      {/* DOCUMENTO / FOTO */}
      <div className="space-y-2 md:col-span-3">
        <label className={styles.label}>Comprobante (Imagen o PDF)</label>
        <div className={styles.fileUploadBox}>
          <input
            type="file"
            name="comprobante"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            required
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            suppressHydrationWarning
          />
          <div className="flex items-center gap-2 text-center max-w-full px-2">
            <span className="material-symbols-outlined text-slate-500 group-hover:text-secondary text-xl transition-colors shrink-0">
              cloud_upload
            </span>
            <p
              className="text-xs text-slate-300 font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-md"
              title={selectedFileName || "Subir comprobante"}
            >
              {selectedFileName ? selectedFileName : "Subir comprobante"}
            </p>
          </div>
        </div>
      </div>

      {/* COMENTARIOS */}
      <div className="space-y-2 md:col-span-3">
        <label className={styles.label}>Comentarios (Opcional)</label>
        <textarea
          name="comentarios"
          placeholder="Escribe comentarios o notas adicionales..."
          className={styles.textarea}
          rows={2}
          autoComplete="off"
          suppressHydrationWarning
        />
      </div>
    </>
  );
}
