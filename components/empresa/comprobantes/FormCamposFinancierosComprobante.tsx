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
  selectedFotoClienteName: string;
  handleFotoClienteChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  pagoAdelantado: string;
  setPagoAdelantado: (val: string) => void;
  selectedFotoPagoAdelantadoName: string;
  handleFotoPagoAdelantadoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormCamposFinancierosComprobante({
  fechaProximoPago,
  setFechaProximoPago,
  selectedPlazo,
  setSelectedPlazo,
  selectedFileName,
  handleFileChange,
  selectedFotoClienteName,
  handleFotoClienteChange,
  pagoAdelantado,
  setPagoAdelantado,
  selectedFotoPagoAdelantadoName,
  handleFotoPagoAdelantadoChange
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

      {/* SWITCH PAGO ADELANTADO (OCUPA LA MITAD EN MEDIDA RESPONSIVA) */}
      <div className={styles.inputGroup}>
        <label htmlFor="switch-pago-adelantado" className={styles.label}>
          Pago Adelantado
        </label>
        <div className="w-1/2 min-w-[130px] flex items-center justify-between px-3.5 py-3 bg-slate-950/50 border border-slate-800 rounded-xl transition-all h-[46px]">
          <span className={`text-xs font-bold transition-colors ${pagoAdelantado === 'Si' ? 'text-secondary' : 'text-slate-400'}`}>
            {pagoAdelantado === 'Si' ? 'Sí' : 'No'}
          </span>
          <button
            id="switch-pago-adelantado"
            type="button"
            role="switch"
            aria-checked={pagoAdelantado === 'Si'}
            onClick={() => setPagoAdelantado(pagoAdelantado === 'Si' ? 'No' : 'Si')}
            className={`relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none border border-slate-700/50 ${
              pagoAdelantado === 'Si' ? "bg-secondary" : "bg-slate-800"
            }`}
            title={pagoAdelantado === 'Si' ? "Pago adelantado activado" : "Pago adelantado desactivado"}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none block h-5 w-5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                pagoAdelantado === 'Si' ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <input
          type="hidden"
          name="pago_adelantado"
          value={pagoAdelantado}
        />
      </div>

      {/* DOCUMENTOS / FOTOS */}
      <div className={`space-y-4 md:space-y-0 md:col-span-3 grid grid-cols-1 ${pagoAdelantado === 'Si' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        {/* COMPROBANTE */}
        <div className="space-y-2">
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

        {/* FOTO CLIENTE */}
        <div className="space-y-2">
          <label className={styles.label}>Foto cliente (Imagen o PDF)</label>
          <div className={styles.fileUploadBox}>
            <input
              type="file"
              name="foto_cliente"
              accept="image/*,.pdf"
              onChange={handleFotoClienteChange}
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
                title={selectedFotoClienteName || "Subir foto de cliente"}
              >
                {selectedFotoClienteName ? selectedFotoClienteName : "Subir foto de cliente"}
              </p>
            </div>
          </div>
        </div>

        {/* PAGO ADELANTADO (IMAGEN O PDF) - CONDICIONAL SI PAGO ADELANTADO ES SI */}
        {pagoAdelantado === 'Si' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <label className={styles.label}>Pago Adelantado (Imagen o PDF)</label>
            <div className={styles.fileUploadBox}>
              <input
                type="file"
                name="foto_pago_adelantado"
                accept="image/*,.pdf"
                onChange={handleFotoPagoAdelantadoChange}
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
                  title={selectedFotoPagoAdelantadoName || "Subir pago adelantado"}
                >
                  {selectedFotoPagoAdelantadoName ? selectedFotoPagoAdelantadoName : "Subir pago adelantado"}
                </p>
              </div>
            </div>
          </div>
        )}
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
