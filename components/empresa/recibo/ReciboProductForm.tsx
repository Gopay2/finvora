import React from 'react';
import type { Product } from '@/types/stock';

interface ReciboProductFormProps {
  selectedMarca: string;
  selectedProductoId: string;
  marcasDisponibles: string[];
  modelosFiltrados: Product[];
  activeSigla: string;
  onMarcaChange: (marca: string) => void;
  onProductoChange: (productoId: string) => void;
  onOpenScanner: () => void;
  onOpenManualModal: () => void;
}

export default function ReciboProductForm({
  selectedMarca,
  selectedProductoId,
  marcasDisponibles,
  modelosFiltrados,
  activeSigla,
  onMarcaChange,
  onProductoChange,
  onOpenScanner,
  onOpenManualModal,
}: ReciboProductFormProps) {
  return (
    <div className="space-y-8">
      {/* SECCIÓN 3: Selección de Producto (Marca y Modelo en cascada) */}
      <div className="space-y-4">
        <label className="block text-base font-semibold text-slate-200 ml-0.5">
          Producto
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#060b18] border border-[#16233a] p-6 rounded-3xl">
          {/* Selector de Marca */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Marca
            </label>
            <div className="relative">
              <select
                value={selectedMarca}
                onChange={(event) => onMarcaChange(event.target.value)}
                suppressHydrationWarning
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                {marcasDisponibles.length === 0 ? (
                  <option value="" className="bg-slate-950 text-slate-500 italic">
                    Sin productos con sigla ({activeSigla})
                  </option>
                ) : (
                  <>
                    <option value="" className="bg-slate-950 text-slate-500 italic">
                      Elegir marca...
                    </option>
                    {marcasDisponibles.map((marca) => (
                      <option key={marca} value={marca} className="bg-slate-950 text-white">
                        {marca}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Selector de Modelo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Modelo
            </label>
            <div className="relative">
              <select
                name="producto_id"
                required
                value={selectedProductoId}
                onChange={(event) => onProductoChange(event.target.value)}
                disabled={!selectedMarca}
                suppressHydrationWarning
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ colorScheme: 'dark' }}
              >
                {!selectedMarca ? (
                  <option value="" className="bg-slate-950 text-slate-500 italic">
                    Selecciona una marca primero...
                  </option>
                ) : (
                  <>
                    <option value="" className="bg-slate-950 text-white">
                      Elegir modelo del catálogo...
                    </option>
                    {modelosFiltrados.map((producto) => (
                      <option key={producto.id} value={producto.id} className="bg-slate-950 text-white">
                        {producto.modelo} - {producto.color} ({producto.almacenamiento} / {producto.ram})
                      </option>
                    ))}
                  </>
                )}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: Acciones de ingreso de IMEI */}
      <div className="space-y-4">
        <label className="block text-base font-semibold text-slate-200 ml-0.5">
          IMEI
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
          <button
            type="button"
            onClick={onOpenScanner}
            style={{ minHeight: '144px', maxHeight: '144px', height: '144px' }}
            className="w-full flex flex-col items-center justify-center gap-1.5 p-3 rounded-3xl bg-[#060b18] hover:bg-[#0c1424] border border-[#16233a] hover:border-secondary/60 transition-all cursor-pointer group shadow-xl shadow-black/20 overflow-hidden"
          >
            <div className="h-16 flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-slate-300 group-hover:text-secondary group-hover:scale-110 transition-all select-none leading-none block"
                style={{ fontSize: '58px', fontVariationSettings: "'opsz' 48" }}
              >
                barcode_scanner
              </span>
            </div>
            <span className="text-base font-bold text-white group-hover:text-secondary transition-colors text-center leading-tight">
              Escanear
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenManualModal}
            style={{ minHeight: '144px', maxHeight: '144px', height: '144px' }}
            className="w-full flex flex-col items-center justify-center gap-1.5 p-3 rounded-3xl bg-[#060b18] hover:bg-[#0c1424] border border-[#16233a] hover:border-secondary/60 transition-all cursor-pointer group shadow-xl shadow-black/20 overflow-hidden"
          >
            <div className="h-16 flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-slate-300 group-hover:text-secondary group-hover:scale-110 transition-all select-none leading-none block"
                style={{ fontSize: '58px', fontVariationSettings: "'opsz' 48" }}
              >
                keyboard
              </span>
            </div>
            <span className="text-base font-bold text-white group-hover:text-secondary transition-colors text-center leading-tight">
              Ingreso manual
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
