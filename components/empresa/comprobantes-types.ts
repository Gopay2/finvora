import React from "react";

// ─── Interfaces compartidas ───

export interface OptionItem {
  id: string;
  repartidorId?: string;
  display: string;
}

export interface Producto {
  id: string;
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  color: string;
}

export interface StockItem {
  producto_id: string;
  estado: string;
  zona: string | null;
  imei?: string;
}

export interface ModeloAgrupado {
  display: string;
  marca: string;
  modelo: string;
  totalDisponible: number;
  totalAConsultar: number;
  totalStock: number;
}

// ─── Estilos compartidos ───

export const styles = {
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-6",
  formGrid: "grid grid-cols-1 md:grid-cols-3 gap-6",
  inputGroup: "space-y-2",
  inputGroupFull: "space-y-2 md:col-span-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pl-8",
  relativeInputContainer: "relative flex items-center",
  prefix: "absolute left-4 text-slate-400 pointer-events-none",
  button: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer flex items-center justify-center gap-2",
  buttonDisabled: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-not-allowed flex items-center justify-center gap-2 opacity-70",
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 bg-red-500/10 text-red-400 border border-red-500/20",
  tableContainer: "bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl mt-8",
  tableWrapper: "overflow-x-auto custom-scrollbar",
  table: "w-full border-collapse text-center text-sm",
  thead: "bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider",
  th: "px-6 py-4 text-center",
  tr: "border-b border-slate-800/50 hover:bg-slate-900/20 transition-colors",
  td: "px-6 py-4 text-slate-300 font-medium text-center",
  badge: "px-2 py-1 rounded bg-slate-800 text-xs text-slate-400 font-bold border border-slate-700",
  linkBtn: "text-secondary hover:underline inline-flex items-center gap-1 cursor-pointer font-bold",
  autocompleteInput: "w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all",
  suggestionsContainer: "absolute z-20 w-full mt-2 bg-slate-950/95 border border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar glass-effect animate-in fade-in duration-200",
  dateInput: "w-full sm:w-[130px] bg-slate-950 border border-slate-800 rounded-lg px-3 h-[44px] sm:h-[34px] text-[16px] sm:text-xs text-center focus:outline-none focus:border-secondary transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
};

// ─── Utilidades compartidas ───

export const handleNumericInput = (event: React.FormEvent<HTMLInputElement>) => {
  const input = event.currentTarget;
  let value = input.value;

  // 1. Reemplazar caracteres no permitidos (solo permitir números, punto y coma)
  value = value.replace(/[^0-9.,]/g, '');

  // 2. Eliminar cualquier punto o coma al inicio
  value = value.replace(/^[.,]+/g, '');

  // 3. No permitir más de un separador decimal (punto o coma)
  const firstSeparatorIndex = value.search(/[.,]/);
  if (firstSeparatorIndex !== -1) {
    const beforeSeparator = value.substring(0, firstSeparatorIndex + 1);
    const afterSeparator = value.substring(firstSeparatorIndex + 1).replace(/[.,]/g, '');
    value = beforeSeparator + afterSeparator;
  }

  input.value = value;
};

export const handleNumericBlur = (event: React.FocusEvent<HTMLInputElement>) => {
  const input = event.currentTarget;
  let value = input.value;

  // Quitar cualquier punto o coma al final del texto al perder el foco
  value = value.replace(/[.,]+$/, '');

  input.value = value;
};

export const formatTijuanaDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Tijuana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date(dateStr));
  } catch (error) {
    return dateStr;
  }
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
};
