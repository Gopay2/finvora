'use client';

import React from 'react';

interface FormProgramacionEntregaProps {
  fechaEntrega: string;
  setFechaEntrega: (fecha: string) => void;
  horaEntrega: string;
  setHoraEntrega: (hora: string) => void;
  isIOS: boolean;
  handleOpenPicker: (event: React.MouseEvent<HTMLInputElement>) => void;
  horasDisponibles: string[];
  driverRestDayInfo: { isRestDay: boolean; restDayNames: string[] };
  zoneTime: { dateStr: string; hour: number; minute: number; timeStrFull: string };
  horariosOcupados: Set<string>;
  isMounted: boolean;
  selectedZona: string;
  selectedRepartidorName: string;
  isRepartidorCT: boolean;
  selectedZoneDisplayName: string;
  selectedFileName: string;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Componente para la programación de la fecha y hora de entrega, validación de descansos y carga de archivo de verificación.
 */
export function FormProgramacionEntrega({
  fechaEntrega,
  setFechaEntrega,
  horaEntrega,
  setHoraEntrega,
  isIOS,
  handleOpenPicker,
  horasDisponibles,
  driverRestDayInfo,
  zoneTime,
  horariosOcupados,
  isMounted,
  selectedZona,
  selectedRepartidorName,
  isRepartidorCT,
  selectedZoneDisplayName,
  selectedFileName,
  handleFileChange
}: FormProgramacionEntregaProps) {
  const styles = {
    inputGroup: "space-y-2",
    inputGroupFull: "space-y-2 md:col-span-2",
    label: "text-sm font-medium text-slate-300 ml-1",
    selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer",
    pickerInput: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed pl-10 [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden",
    textarea: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[100px] resize-none",
    relativeInputContainer: "relative flex items-center",
    pickerIcon: "absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base",
    warningBanner: "md:col-span-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 p-4 rounded-xl text-sm font-medium flex flex-col lg:flex-row items-center justify-between gap-3 text-center",
    formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
    sectionTitle: "text-lg font-bold text-secondary border-b border-slate-800 pb-2 mb-4",
  };

  return (
    <div>
      <h3 className={styles.sectionTitle}>Entrega y Verificación</h3>
      <div className={styles.formGrid}>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Fecha de entrega</label>
        <div className={styles.relativeInputContainer}>
          <span className={styles.pickerIcon}>calendar_today</span>
          <input
            type="date"
            name="fecha_entrega"
            value={fechaEntrega}
            onChange={(event) => {
              setFechaEntrega(event.target.value);
              setHoraEntrega("");
            }}
            className={styles.pickerInput}
            style={{ paddingLeft: "40px" }}
            required
            onClick={handleOpenPicker}
            suppressHydrationWarning
          />
          {!fechaEntrega && isIOS && (
            <span
              className="absolute text-slate-500 text-base pointer-events-none select-none"
              style={{ left: "40px" }}
            >
              dd/mm/aaaa
            </span>
          )}
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Hora de entrega</label>
        <div className={styles.relativeInputContainer}>
          <span className={styles.pickerIcon}>schedule</span>
          <select
            name="hora_entrega"
            value={horaEntrega}
            onChange={(event) => setHoraEntrega(event.target.value)}
            className={styles.selectInput}
            style={{ paddingLeft: "40px", colorScheme: 'dark' }}
            required
            disabled={!fechaEntrega}
            suppressHydrationWarning
          >
            {!fechaEntrega ? (
              <option value="" className="bg-slate-950 text-slate-500 italic">
                Seleccione una fecha primero
              </option>
            ) : horasDisponibles.length === 0 ? (
              <option value="" className="bg-slate-950 text-red-400 italic">
                {driverRestDayInfo.isRestDay
                  ? "No disponible"
                  : fechaEntrega < zoneTime.dateStr
                    ? "La fecha no puede ser en el pasado"
                    : "No hay horarios disponibles para hoy"}
              </option>
            ) : (
              <>
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  Seleccione una hora...
                </option>
                {horasDisponibles.map((slot) => {
                  const isOccupied = horariosOcupados.has(slot);
                  return (
                    <option 
                      key={slot} 
                      value={slot} 
                      disabled={isOccupied}
                      className={isOccupied ? "text-slate-500 bg-slate-950 italic" : "text-white bg-slate-950"}
                    >
                      {slot} hs {isOccupied ? "(Ocupado)" : ""}
                    </option>
                  );
                })}
              </>
            )}
          </select>
        </div>
      </div>

      {isMounted && selectedZona && (
        driverRestDayInfo.isRestDay ? (
          <div className="md:col-span-2 bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl text-sm font-medium flex flex-col lg:flex-row items-center justify-between gap-3 text-center">
            <span className="material-symbols-outlined text-red-400 select-none">event_busy</span>
            <div className="flex-1">
              <div className="font-bold text-red-300">
                {selectedRepartidorName || "El repartidor"} no realiza entregas los días {driverRestDayInfo.restDayNames.join(", ")}.
              </div>
              <div className="text-xs text-red-400/80 mt-0.5">
                Por favor seleccione otra fecha.
              </div>
            </div>
            <span className="hidden lg:block">
              <span className="material-symbols-outlined text-red-400 select-none">event_busy</span>
            </span>
          </div>
        ) : (
          <div className={styles.warningBanner}>
            <span className="material-symbols-outlined text-amber-400 select-none">warning</span>
            <div className="flex-1">
              {isRepartidorCT ? (
                <div>Los horarios de entrega son aproximados con repartos de CT y son solicitados con 1h de anticipación.</div>
              ) : (
                <div>Los horarios de entrega son solicitados con 1h de anticipación.</div>
              )}
              <div className="font-semibold text-amber-300 mt-1">
                Hora actual {selectedZoneDisplayName}: {zoneTime.timeStrFull || "--:--"} hs
              </div>
            </div>
            <span className="hidden lg:block">
              <span className="material-symbols-outlined text-amber-400 select-none">warning</span>
            </span>
          </div>
        )
      )}

      <div className={styles.inputGroupFull}>
        <label className={styles.label}>Verificación crediticia</label>
        <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-secondary/40 rounded-xl p-3 bg-slate-950/20 transition-all group cursor-pointer h-[46px] select-none">
          <input
            type="file"
            name="verificacion_crediticia"
            accept="image/*,application/pdf"
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
              className="text-xs text-slate-300 font-medium truncate max-w-[150px] sm:max-w-[220px] md:max-w-[160px] lg:max-w-[240px]"
              title={selectedFileName || "Subir Imagen o PDF"}
            >
              {selectedFileName ? selectedFileName : "Subir Imagen o PDF"}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.inputGroupFull}>
        <label className={styles.label}>Comentarios (Opcional)</label>
        <textarea
          name="comentarios"
          className={styles.textarea}
          placeholder="Notas adicionales sobre la orden o entrega..."
          suppressHydrationWarning
        />
      </div>
    </div>
  </div>
);
}
