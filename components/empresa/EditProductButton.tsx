'use client';

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { editarProducto } from "@/app/empresa/webapp/stock/stock-actions";

// OPCIONES DEL CATÁLOGO (Igual que en StockProductoForm)
const MARCAS = ["Apple", "Samsung", "Xiaomi", "Motorola", "Honor", "Infinix"];
const COLORES = ["Negro", "Blanco", "Gris", "Azul", "Verde", "Rosa", "Amarillo", "Rojo", "Naranja", "Violeta", "Celeste"];
const RAMS = ["4GB", "6GB", "8GB", "12GB", "16GB", "24GB"];
const ALMACENAMIENTOS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

interface Product {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
  ram: string;
  precio: number;
}

export default function EditProductButton({ product }: { product: Product }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await editarProducto(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-500 hover:text-secondary transition-colors cursor-pointer"
        title="Editar Producto"
      >
        <span className="material-symbols-outlined text-xl">edit_note</span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-2xl w-full animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-3xl">edit_square</span>
                <h3 className="text-xl font-bold text-white">Editar Producto</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="id" value={product.id} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marca */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Marca</label>
                  <select 
                    name="marca" 
                    defaultValue={product.marca} 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {MARCAS.map(m => <option key={m} value={m} className="bg-slate-950 text-white">{m}</option>)}
                  </select>
                </div>

                {/* Modelo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Modelo</label>
                  <input name="modelo" type="text" defaultValue={product.modelo} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary" />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Color</label>
                  <select 
                    name="color" 
                    defaultValue={product.color} 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {COLORES.map(c => <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>)}
                  </select>
                </div>

                {/* RAM */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">RAM</label>
                  <select 
                    name="ram" 
                    defaultValue={product.ram} 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {RAMS.map(r => <option key={r} value={r} className="bg-slate-950 text-white">{r}</option>)}
                  </select>
                </div>

                {/* Almacenamiento */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Almacenamiento</label>
                  <select 
                    name="almacenamiento" 
                    defaultValue={product.almacenamiento} 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {ALMACENAMIENTOS.map(a => <option key={a} value={a} className="bg-slate-950 text-white">{a}</option>)}
                  </select>
                </div>

                {/* Precio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Precio de Compra</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                    <input name="precio" type="number" step="0.01" defaultValue={product.precio} required className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-100 focus:outline-none focus:border-secondary" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-sm">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-secondary text-slate-950 rounded-xl font-bold hover:bg-white transition-all shadow-lg shadow-secondary/20 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Actualizar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
