'use client';

import React from 'react';
import type { CatalogProduct } from '@/types/proveedores';

interface AsignarProductoFormProps {
  selectedMarca: string;
  setSelectedMarca: (marca: string) => void;
  selectedProdId: string;
  setSelectedProdId: (id: string) => void;
  costoInput: string;
  setCostoInput: (costo: string) => void;
  marcas: string[];
  filteredProducts: CatalogProduct[];
  targetSigla: string;
  isPending: boolean;
  handleAgregar: () => void;
  errorMsg: string;
  successMsg: string;
}

export function AsignarProductoForm({
  selectedMarca,
  setSelectedMarca,
  selectedProdId,
  setSelectedProdId,
  costoInput,
  setCostoInput,
  marcas,
  filteredProducts,
  targetSigla,
  isPending,
  handleAgregar,
  errorMsg,
  successMsg
}: AsignarProductoFormProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl space-y-4 text-sm">
      <h3 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary text-base">add_circle</span>
        Asignar nuevo producto
      </h3>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Selector de Marca */}
        <div className="space-y-2 w-full md:w-56 shrink-0">
          <label className="text-xs font-semibold text-slate-400 ml-1">Marca:</label>
          <div className="relative flex items-center w-full">
            <select
              value={selectedMarca}
              onChange={(e) => {
                setSelectedMarca(e.target.value);
                setSelectedProdId("");
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer text-xs sm:text-sm h-[42px]"
              style={{ colorScheme: 'dark' }}
              suppressHydrationWarning
            >
              {marcas.length === 0 ? (
                <option value="" className="italic text-slate-500">No hay productos disponibles con sigla ({targetSigla})...</option>
              ) : (
                <>
                  <option value="">Elegir marca...</option>
                  {marcas.map((marca) => (
                    <option key={marca} value={marca}>
                      {marca}
                    </option>
                  ))}
                </>
              )}
            </select>
            <span className="material-symbols-outlined absolute right-4 pointer-events-none text-slate-500 text-base">
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Selector de Producto */}
        <div className="space-y-2 flex-1 w-full">
          <label className="text-xs font-semibold text-slate-400 ml-1">Modelo:</label>
          <div className="relative flex items-center w-full">
            <select
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              disabled={!selectedMarca}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer text-xs sm:text-sm h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ colorScheme: 'dark' }}
              suppressHydrationWarning
            >
              {!selectedMarca ? (
                <option value="">Selecciona una marca primero...</option>
              ) : (
                <>
                  <option value="">Elegir modelo del catálogo...</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.modelo} ({p.color} - {p.almacenamiento})
                    </option>
                  ))}
                </>
              )}
            </select>
            <span className="material-symbols-outlined absolute right-4 pointer-events-none text-slate-500 text-base">
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Costo Inicial */}
        <div className="space-y-2 w-full md:w-44 shrink-0">
          <label className="text-xs font-semibold text-slate-400 ml-1">Costo:</label>
          <div className="relative flex items-center w-full">
            <span className="absolute left-3 text-slate-400 font-bold text-xs pointer-events-none">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={costoInput}
              onFocus={(e) => {
                if (costoInput === "0") {
                  setCostoInput("");
                }
                e.target.select();
              }}
              onBlur={() => {
                if (!costoInput || costoInput.trim() === "") {
                  setCostoInput("0");
                }
              }}
              onChange={(e) => {
                let val = e.target.value;
                if (/^0\d+$/.test(val)) {
                  val = val.replace(/^0+/, "");
                }
                if (val === "" || /^\d*$/.test(val)) {
                  setCostoInput(val);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2.5 text-[16px] sm:text-sm text-slate-200 focus:outline-none focus:border-secondary transition-all h-[42px] w-full text-center"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Botón de Agregar */}
        <button
          type="button"
          disabled={isPending}
          onClick={handleAgregar}
          className="h-[42px] px-6 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto text-xs"
        >
          {isPending ? (
            <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
          ) : (
            <span className="material-symbols-outlined text-base font-bold">add</span>
          )}
          Asignar
        </button>
      </div>

      {/* Notificaciones */}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {successMsg}
        </div>
      )}
    </div>
  );
}
