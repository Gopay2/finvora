'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { ReciboItem } from '@/types/recibo';
import { getColorHex, formatFecha } from '@/utils/recibo';

interface RepartidorOption {
  id: string;
  nombre: string;
}

interface ZonaRepartoItem {
  id: string;
  nombre_zona: string;
  sigla?: string;
  repartidor_id: string;
}

interface CargarStockReciboModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ReciboItem | null;
  repartidores: RepartidorOption[];
  zonasReparto?: ZonaRepartoItem[];
  onConfirm: (reciboId: string, repartidorId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function CargarStockReciboModal({
  isOpen,
  onClose,
  item,
  repartidores,
  zonasReparto = [],
  onConfirm,
}: CargarStockReciboModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedRepartidorId, setSelectedRepartidorId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Filtrar los repartidores de la plaza/proveedor del equipo
  const repartidoresFiltrados = useMemo(() => {
    if (!item) return [];
    const normProveedor = (item.proveedor || '').toLowerCase().trim();

    if (zonasReparto && zonasReparto.length > 0) {
      const repartidorIdsZona = new Set(
        zonasReparto
          .filter((z) => {
            const normZona = z.nombre_zona.toLowerCase().trim();
            return normZona.includes(normProveedor) || normProveedor.includes(normZona);
          })
          .map((z) => z.repartidor_id)
      );
      const filtrados = repartidores.filter((r) => repartidorIdsZona.has(r.id));
      if (filtrados.length > 0) return filtrados;
    }

    // Fallback: todos los repartidores disponibles
    return repartidores;
  }, [item, zonasReparto, repartidores]);

  // Al abrir el modal con un item, preseleccionar o resetear el repartidor
  useEffect(() => {
    if (isOpen && item) {
      setError(null);
      setIsSubmitting(false);
      if (repartidoresFiltrados.length === 1) {
        setSelectedRepartidorId(repartidoresFiltrados[0].id);
      } else {
        setSelectedRepartidorId('');
      }
    }
  }, [isOpen, item, repartidoresFiltrados]);

  if (!mounted || !isOpen || !item) return null;

  const colorHex = getColorHex(item.productos?.color || '');
  const { fecha } = formatFecha(item.fecha_ingreso);
  const isConcesion = item.tipo_equipo === 'concesion';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepartidorId) {
      setError('Debes seleccionar una ubicación / repartidor para continuar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await onConfirm(item.id, selectedRepartidorId);
    if (res.error) {
      setError(res.error);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-slate-950/80 flex flex-col relative my-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado del modal con paleta oficial Finvora */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl sm:text-2xl block">inventory_2</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight truncate">
                Cargar Stock
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Pasa la unidad de recibo al stock disponible
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800 cursor-pointer disabled:opacity-30 shrink-0 ml-2"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl block">close</span>
          </button>
        </div>

        {/* Cuerpo del modal con espaciado amplio y confortable para móviles */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3.5 sm:p-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs sm:text-sm rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-lg shrink-0">error</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Ficha Resumen del Equipo */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
            {/* Fila Superior: Nombre del Modelo + Badge de Estado */}
            <div className="flex items-start justify-between gap-3 pb-1 sm:pb-3.5 border-b-0 sm:border-b border-slate-800/80">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Producto
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug break-words">
                  {item.productos ? `${item.productos.marca} ${item.productos.modelo}` : 'Equipo'}
                </h4>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {item.productos?.ram && (
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">
                      RAM {item.productos.ram}
                    </span>
                  )}
                  {item.productos?.almacenamiento && (
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">
                      ALM {item.productos.almacenamiento}
                    </span>
                  )}
                </div>
              </div>

              {/* Badge de Estado a Asignar con etiqueta Estado asignado perfectamente centrada */}
              <div className="shrink-0 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 text-center select-none">
                  Estado asignado
                </span>
                {isConcesion ? (
                  <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    Concesión
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Disponible
                  </span>
                )}
              </div>
            </div>

            {/* Atributos en tarjetas ordenadas con espacio limpio */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
              {/* IMEI */}
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 sm:p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  IMEI
                </span>
                <span className="font-mono text-secondary text-xs sm:text-sm font-semibold tracking-wider break-all select-all block">
                  {item.imei}
                </span>
              </div>

              {/* Color */}
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 sm:p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Color
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className="text-slate-200 font-semibold truncate text-xs sm:text-sm">
                    {item.productos?.color || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Proveedor y Área */}
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 sm:p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Proveedor
                </span>
                <span className="text-slate-200 font-semibold truncate text-xs sm:text-sm block">
                  {item.proveedor}
                  {item.area_proveedor && item.area_proveedor !== item.proveedor && (
                    <span className="text-slate-400 font-normal ml-1">({item.area_proveedor})</span>
                  )}
                </span>
              </div>

              {/* Fecha Recibo */}
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 sm:p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Fecha Recibo
                </span>
                <span className="text-slate-300 font-mono text-xs sm:text-sm block">
                  {fecha}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario para seleccionar Ubicación / Repartidor */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <label
                htmlFor="ubicacion-repartidor-select"
                className="block text-xs font-semibold text-slate-300 ml-0.5 tracking-wider uppercase"
              >
                Ubicación / Repartidor destino *
              </label>
              <div className="relative">
                <select
                  id="ubicacion-repartidor-select"
                  value={selectedRepartidorId}
                  onChange={(e) => {
                    setSelectedRepartidorId(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  required
                  style={{ fontSize: '16px', colorScheme: 'dark' }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-secondary rounded-xl px-4 py-3.5 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-950 text-slate-500 italic">
                    Selecciona la ubicación o repartidor...
                  </option>
                  {repartidoresFiltrados.map((rep) => (
                    <option key={rep.id} value={rep.id} className="bg-slate-950 text-white font-sans">
                      {rep.nombre.toUpperCase()}
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base sm:text-lg">
                  expand_more
                </span>
              </div>
            </div>

            {/* Botón Confirmar: con paleta oficial de Finvora */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-secondary hover:bg-secondary-fixed text-slate-950 font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-secondary/15 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Confirmando...</span>
                  </span>
                ) : (
                  <span>Confirmar</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
