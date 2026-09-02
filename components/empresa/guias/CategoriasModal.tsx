'use client';

import React, { useState } from 'react';
import ConfirmModal from '@/components/empresa/ConfirmModal';
import {
  crearNuevaCategoria,
  renombrarCategoria,
  eliminarCategoria,
} from '@/app/empresa/webapp/guias/actions';

interface CategoriasModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: string[];
  onUpdated: () => void;
}

export default function CategoriasModal({
  isOpen,
  onClose,
  categorias,
  onUpdated,
}: CategoriasModalProps) {
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [categoriaEditando, setCategoriaEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [categoriaParaEliminar, setCategoriaParaEliminar] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCrear = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nuevaCategoria.trim()) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await crearNuevaCategoria(nuevaCategoria);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setNuevaCategoria('');
        onUpdated();
      }
    } catch (error: unknown) {
      setErrorMsg('Error al crear categoría');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIniciarEdicion = (categoriaNombre: string) => {
    setCategoriaEditando(categoriaNombre);
    setNombreEditado(categoriaNombre);
    setErrorMsg(null);
  };

  const handleGuardarRenombrar = async (categoriaOriginal: string) => {
    if (!nombreEditado.trim() || nombreEditado.trim() === categoriaOriginal) {
      setCategoriaEditando(null);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await renombrarCategoria(categoriaOriginal, nombreEditado);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setCategoriaEditando(null);
        onUpdated();
      }
    } catch (error: unknown) {
      setErrorMsg('Error al renombrar categoría');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!categoriaParaEliminar) return;
    const cat = categoriaParaEliminar;
    setCategoriaParaEliminar(null);

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await eliminarCategoria(cat);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onUpdated();
      }
    } catch (error: unknown) {
      setErrorMsg('Error al eliminar categoría');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl">category</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Administrar Categorías</h2>
                <p className="text-xs text-slate-400">Crea, renombra o elimina categorías</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:#334155_#020617] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Formulario para agregar */}
            <form onSubmit={handleCrear} className="flex gap-2">
              <input
                type="text"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                placeholder="Nueva categoría (ej. Soporte, Ventas...)"
                className="flex-1 px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-base sm:text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                suppressHydrationWarning
              />
              <button
                type="submit"
                disabled={isProcessing || !nuevaCategoria.trim()}
                className="px-5 py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-secondary/10 transition-all cursor-pointer disabled:opacity-50"
              >
                Agregar
              </button>
            </form>

            {/* Lista de Categorías */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Categorías Registradas ({categorias.length})
              </h3>

              <div className="divide-y divide-slate-800/60 rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                {categorias.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs italic">
                    No hay categorías registradas.
                  </div>
                ) : (
                  categorias.map((categoriaItem) => (
                    <div
                      key={categoriaItem}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
                    >
                      {categoriaEditando === categoriaItem ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={nombreEditado}
                            onChange={(e) => setNombreEditado(e.target.value)}
                            autoFocus
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-secondary/50 rounded-lg text-slate-100 text-base sm:text-xs focus:outline-none"
                            suppressHydrationWarning
                          />
                          <button
                            type="button"
                            onClick={() => handleGuardarRenombrar(categoriaItem)}
                            disabled={isProcessing}
                            className="p-1.5 bg-secondary text-slate-950 rounded-lg hover:bg-secondary-fixed cursor-pointer"
                            title="Guardar"
                          >
                            <span className="material-symbols-outlined text-base">check</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCategoriaEditando(null)}
                            className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                            title="Cancelar"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-500 text-sm">
                              folder
                            </span>
                            <span className="text-sm font-semibold text-slate-200">{categoriaItem}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleIniciarEdicion(categoriaItem)}
                              className="p-1.5 text-slate-400 hover:text-secondary rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Renombrar categoría"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategoriaParaEliminar(categoriaItem)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Eliminar categoría"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación Estándar para Eliminar Categoría */}
      <ConfirmModal
        isOpen={Boolean(categoriaParaEliminar)}
        onClose={() => setCategoriaParaEliminar(null)}
        onConfirm={handleConfirmarEliminar}
        title="¿Eliminar categoría?"
        message={`¿Estás seguro de que quieres eliminar la categoría "${categoriaParaEliminar}"? Las guías asociadas pasarán a la categoría "General".`}
      />
    </>
  );
}
