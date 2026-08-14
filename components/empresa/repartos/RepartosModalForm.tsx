'use client';

import React from 'react';
import { getDriverRestDayInfo, getDriverScheduleConfig } from '@/utils/driver-schedule';

interface RepartosModalFormProps {
  year: number;
  month: number;
  selectedDay: number | null;
  repartidoresFiltradosLogistica: any[];
  formDataOptions: {
    vendedores: any[];
    stock: any[];
  };
  formRepartidor: string;
  setFormRepartidor: (id: string) => void;
  formVendedor: string;
  setFormVendedor: (id: string) => void;
  formStockImei: string;
  setFormStockImei: (imei: string) => void;
  formHorario: string;
  setFormHorario: (horario: string) => void;
  formError: string | null;
  setFormError: (error: string | null) => void;
  actionLoading: boolean;
  userRole?: string;
  setIsFormOpen: (open: boolean) => void;
  handleCrearReparto: (e: React.FormEvent) => void;
}

export function RepartosModalForm({
  year,
  month,
  selectedDay,
  repartidoresFiltradosLogistica,
  formDataOptions,
  formRepartidor,
  setFormRepartidor,
  formVendedor,
  setFormVendedor,
  formStockImei,
  setFormStockImei,
  formHorario,
  setFormHorario,
  formError,
  setFormError,
  actionLoading,
  userRole,
  setIsFormOpen,
  handleCrearReparto
}: RepartosModalFormProps) {
  const styles = {
    formContainer: "flex-1 flex flex-col justify-between overflow-y-auto mt-4 min-h-0",
    formScroll: "space-y-4 pr-1 overflow-y-auto pb-4 custom-scrollbar",
    formError: "p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-pulse",
    formGrid: "grid grid-cols-1 md:grid-cols-2 gap-4",
    formField: "space-y-1.5",
    formLabel: "text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1",
    formInput: "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none disabled:opacity-40 disabled:cursor-not-allowed",
    footer: "flex items-center justify-end gap-3 border-t border-slate-800 pt-3 md:pt-4 shrink-0",
    footerCloseBtn: "px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all cursor-pointer border border-slate-700",
    footerCreateBtn: "px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <form onSubmit={handleCrearReparto} className={styles.formContainer}>
      <div className={styles.formScroll}>
        {formError && (
          <div className={styles.formError}>
            <span className="material-symbols-outlined text-base">error</span>
            {formError}
          </div>
        )}

        <div className={styles.formGrid}>
          {/* Repartidor */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Repartidor</label>
            <select
              value={formRepartidor}
              onChange={(e) => {
                setFormRepartidor(e.target.value);
                setFormStockImei('');
              }}
              required
              className={styles.formInput}
              style={{ colorScheme: 'dark' }}
            >
              <option value="">Seleccionar Repartidor</option>
              {repartidoresFiltradosLogistica.map(repartidor => (
                <option key={repartidor.id} value={repartidor.id}>
                  {repartidor.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Vendedor */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Vendedor</label>
            <select
              value={formVendedor}
              onChange={(e) => setFormVendedor(e.target.value)}
              required
              className={styles.formInput}
              style={{ colorScheme: 'dark' }}
            >
              <option value="">Seleccionar Vendedor</option>
              {formDataOptions.vendedores.map(vendedor => {
                const rawName = vendedor.username ? vendedor.username : (vendedor.email || '');
                const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : '';
                const roleLabel = vendedor.role ? `[${vendedor.role}] ` : '';
                return (
                  <option key={vendedor.id} value={vendedor.id}>
                    {roleLabel}{displayName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Stock disponible (IMEI) */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Equipo (IMEI)</label>
            <select
              value={formStockImei}
              onChange={(e) => setFormStockImei(e.target.value)}
              required
              disabled={!formRepartidor}
              className={styles.formInput}
              style={{ colorScheme: 'dark' }}
            >
              <option value="">
                {!formRepartidor ? 'Elige un repartidor primero' : 'Seleccionar de Stock'}
              </option>
              {formDataOptions.stock
                .filter(stock => stock.zona === formRepartidor)
                .map(stock => (
                  <option key={stock.imei} value={stock.imei}>
                    {stock.productos?.marca} {stock.productos?.modelo} ({stock.productos?.color}, {stock.productos?.almacenamiento}) - IMEI: {stock.imei}
                  </option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Horario de entrega */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>Horario de entrega</label>
          <select
            value={formHorario}
            onChange={(e) => setFormHorario(e.target.value)}
            required
            className={styles.formInput}
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Seleccionar Hora</option>
            {(() => {
              const selectedFormRep = repartidoresFiltradosLogistica.find(r => r.id === formRepartidor);
              const formattedDayStr = selectedDay !== null 
                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
                : '';
              const formDriverRest = getDriverRestDayInfo(selectedFormRep?.nombre, formattedDayStr);

              const { startHour, startMinute, endHour, endMinute } = getDriverScheduleConfig(selectedFormRep?.nombre);
              
              const formSlots: string[] = [];
              const startTotalMinutes = startHour * 60 + startMinute;
              const endTotalMinutes = endHour * 60 + endMinute;

              for (let m = startTotalMinutes; m <= endTotalMinutes; m += 30) {
                const h = Math.floor(m / 60);
                const min = m % 60;
                formSlots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
              }

              return formSlots.map((slotStr) => {
                const [hour, minute] = slotStr.split(':').map(Number);
                const tz = selectedFormRep?.zona_horaria || 'America/Mexico_City';
                const driverNowString = new Date().toLocaleString('en-US', { timeZone: tz });
                const driverNow = new Date(driverNowString);
                const minAllowed = new Date(driverNow.getTime() + 60 * 60 * 1000);
                const slotDate = new Date(year, month, selectedDay || 1, hour, minute);
                const isPrivileged = userRole === 'Admin' || userRole === 'Developer' || userRole === 'Supervisor' || userRole === 'Repartidor';
                const isPastOrUnavailable = (!isPrivileged && slotDate < minAllowed) || formDriverRest.isRestDay;
                return (
                  <option 
                    key={slotStr} 
                    value={slotStr} 
                    disabled={isPastOrUnavailable}
                    className={isPastOrUnavailable ? "text-slate-600 bg-slate-950" : "text-white bg-slate-950"}
                  >
                    {slotStr} hs {formDriverRest.isRestDay ? "(Día de descanso)" : isPastOrUnavailable ? "(No disponible)" : ""}
                  </option>
                );
              });
            })()}
          </select>
        </div>
      </div>

      {/* Footer del Formulario */}
      <div className={styles.footer}>
        <button 
          type="button"
          onClick={() => {
            setIsFormOpen(false);
            setFormError(null);
          }}
          className={styles.footerCloseBtn}
          disabled={actionLoading}
        >
          Volver al Listado
        </button>
        <button 
          type="submit"
          className={styles.footerCreateBtn}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              <span>Guardando...</span>
            </div>
          ) : (
            "Confirmar Reparto"
          )}
        </button>
      </div>
    </form>
  );
}
