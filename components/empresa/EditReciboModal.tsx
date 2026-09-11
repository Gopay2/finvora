'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PROVEEDORES } from '@/utils/recibo';
import type { ReciboItem } from '@/types/recibo';
import type { Product } from '@/types/stock';

interface EditReciboModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ReciboItem | null;
  productos: Product[];
  onSave: (id: string, imei: string, productoId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function EditReciboModal({
  isOpen,
  onClose,
  item,
  productos,
  onSave,
}: EditReciboModalProps) {
  const [mounted, setMounted] = useState(false);
  const [imei, setImei] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sigla del proveedor del item para filtrar productos coincidentes
  const providerSigla = useMemo(() => {
    if (!item?.proveedor && !item?.area_proveedor) return '';
    const p = PROVEEDORES.find(
      (prov) =>
        prov.proveedor === item.proveedor ||
        prov.area === item.area_proveedor ||
        prov.label === item.proveedor
    );
    return p?.sigla || '';
  }, [item?.proveedor, item?.area_proveedor]);

  // Catálogo de productos disponibles para el proveedor del item (o todos si no coincide sigla)
  const productosDisponibles = useMemo(() => {
    if (!providerSigla) return productos;
    const filtered = productos.filter((p) => {
      const searchContent = `${p.modelo} ${p.marca} ${p.color}`.toUpperCase();
      return searchContent.includes(providerSigla);
    });
    return filtered.length > 0 ? filtered : productos;
  }, [productos, providerSigla]);

  // Lista de marcas únicas disponibles
  const marcasDisponibles = useMemo(() => {
    const set = new Set<string>();
    productosDisponibles.forEach((p) => {
      if (p.marca && p.marca.trim()) {
        set.add(p.marca.trim().toUpperCase());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productosDisponibles]);

  // Modelos filtrados según la marca seleccionada
  const modelosDisponibles = useMemo(() => {
    if (!selectedMarca) return [];
    return productosDisponibles
      .filter((p) => p.marca?.toUpperCase() === selectedMarca.toUpperCase())
      .sort((a, b) => a.modelo.localeCompare(b.modelo, undefined, { numeric: true }));
  }, [productosDisponibles, selectedMarca]);

  // Sincronizar datos iniciales al abrir el modal con un item
  useEffect(() => {
    if (isOpen && item) {
      setImei(item.imei || '');
      setError('');
      setIsSubmitting(false);

      const currentProd = productos.find((p) => p.id === item.producto_id);
      const marca = currentProd?.marca || item.productos?.marca || '';
      setSelectedMarca(marca);
      setSelectedProductoId(item.producto_id || '');

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, item, productos]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mounted || !item) return null;

  const handleMarcaChange = (marca: string) => {
    setSelectedMarca(marca);
    const models = productosDisponibles.filter(
      (p) => p.marca?.toUpperCase() === marca.toUpperCase()
    );
    if (models.length > 0) {
      setSelectedProductoId(models[0].id);
    } else {
      setSelectedProductoId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanImei = imei.trim();
    if (!cleanImei) {
      setError('Debes ingresar un número de IMEI.');
      inputRef.current?.focus();
      return;
    }

    if (!selectedProductoId) {
      setError('Debes seleccionar un modelo del catálogo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave(item.id, cleanImei, selectedProductoId);
      if (res.success) {
        onClose();
      } else if (res.error) {
        setError(res.error);
      }
    } catch {
      setError('Ocurrió un error inesperado al guardar los cambios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl block">
                edit
              </span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
                Editar equipo
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl block">close</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 bg-slate-900" autoComplete="off">
          {/* 1. Campo Proveedor (Bloqueado) */}
          <div className="space-y-2">
            <label
              htmlFor="edit-proveedor-input"
              className="block text-xs font-semibold text-slate-300 ml-0.5 tracking-wider uppercase"
            >
              Proveedor
            </label>
            <div className="relative">
              <input
                id="edit-proveedor-input"
                type="text"
                value={item.proveedor}
                disabled
                readOnly
                style={{ fontSize: '16px' }}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 pr-10 text-slate-400 font-medium text-sm sm:text-base cursor-not-allowed opacity-80"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
                lock
              </span>
            </div>
          </div>

          {/* 2. Campo Marca */}
          <div className="space-y-2">
            <label
              htmlFor="edit-marca-select"
              className="block text-xs font-semibold text-slate-300 ml-0.5 tracking-wider uppercase"
            >
              Marca
            </label>
            <div className="relative">
              <select
                id="edit-marca-select"
                value={selectedMarca}
                onChange={(e) => handleMarcaChange(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 focus:border-secondary rounded-xl px-4 py-3 text-slate-100 focus:outline-none transition-all appearance-none cursor-pointer text-sm"
                style={{ colorScheme: 'dark' }}
              >
                {marcasDisponibles.map((marca) => (
                  <option key={marca} value={marca} className="bg-slate-950 text-white">
                    {marca}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* 3. Campo Modelo */}
          <div className="space-y-2">
            <label
              htmlFor="edit-modelo-select"
              className="block text-xs font-semibold text-slate-300 ml-0.5 tracking-wider uppercase"
            >
              Modelo
            </label>
            <div className="relative">
              <select
                id="edit-modelo-select"
                value={selectedProductoId}
                onChange={(e) => setSelectedProductoId(e.target.value)}
                disabled={isSubmitting || !selectedMarca}
                className="w-full bg-slate-950 border border-slate-800 focus:border-secondary rounded-xl px-4 py-3 text-slate-100 focus:outline-none transition-all appearance-none cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ colorScheme: 'dark' }}
              >
                {modelosDisponibles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                    {p.modelo} - {p.color} ({p.almacenamiento} / {p.ram})
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* 4. Campo IMEI */}
          <div className="space-y-2">
            <label
              htmlFor="edit-imei-input"
              className="block text-xs font-semibold text-slate-300 ml-0.5 tracking-wider uppercase"
            >
              IMEI
            </label>
            <div className="relative">
              <input
                id="edit-imei-input"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={imei}
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, '');
                  setImei(soloNumeros);
                  if (error) setError('');
                }}
                placeholder="Ingresar IMEI"
                required
                autoComplete="off"
                data-lpignore="true"
                disabled={isSubmitting}
                style={{ fontSize: '16px' }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-secondary rounded-xl pl-4 pr-11 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all font-mono tracking-wider text-base h-12"
              />
              {imei && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => {
                    setImei('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                  title="Borrar IMEI"
                >
                  <span className="material-symbols-outlined text-lg leading-none block select-none">
                    cancel
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Alerta de error si falla */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Botón de acción */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !imei.trim() || !selectedProductoId}
              className="w-full py-3 bg-secondary hover:bg-secondary-fixed text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-secondary/10 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </span>
              ) : (
                <span>Guardar cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
