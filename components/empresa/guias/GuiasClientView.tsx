'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Guia } from '@/types/guias';
import GuiaCard from './GuiaCard';
import GuiaModalForm from './GuiaModalForm';
import CategoriasModal from './CategoriasModal';

interface GuiasClientViewProps {
  initialGuias: Guia[];
  categoriasExistentes: string[];
  currentUserRole: string;
}

const styles = {
  container: "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16",
  header: "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  subtitle: "text-slate-500 text-sm max-w-2xl",
  actions: "flex items-center gap-3 flex-wrap",
  btnHome: "flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer select-none shrink-0",
};

export default function GuiasClientView({
  initialGuias,
  categoriasExistentes,
  currentUserRole,
}: GuiasClientViewProps) {
  const [guias, setGuias] = useState<Guia[]>(initialGuias);
  const [categoriasList, setCategoriasList] = useState<string[]>(categoriasExistentes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriasModalOpen, setIsCategoriasModalOpen] = useState(false);

  const isPrivileged =
    currentUserRole === 'Admin' ||
    currentUserRole === 'Developer' ||
    currentUserRole === 'Supervisor';

  // Obtener lista única y actualizada de categorías
  const todasCategorias = useMemo(() => {
    const categoriaSet = new Set<string>();
    categoriasList.forEach((categoriaItem) => categoriaItem && categoriaSet.add(categoriaItem));
    guias.forEach((guiaItem) => guiaItem.categoria && categoriaSet.add(guiaItem.categoria));
    return Array.from(categoriaSet);
  }, [categoriasList, guias]);

  // Filtrado reactivo por término de búsqueda y categoría
  const guiasFiltradas = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return guias.filter((guia) => {
      const matchCategoria =
        selectedCategoria === 'Todas' ||
        guia.categoria.toLowerCase() === selectedCategoria.toLowerCase();

      const matchSearch =
        !term ||
        guia.titulo.toLowerCase().includes(term) ||
        (guia.resumen && guia.resumen.toLowerCase().includes(term)) ||
        guia.contenido.toLowerCase().includes(term);

      return matchCategoria && matchSearch;
    });
  }, [guias, searchTerm, selectedCategoria]);

  // Separar guías destacadas del resto
  const guiasDestacadas = useMemo(() => {
    return guiasFiltradas.filter((guiaItem) => guiaItem.destacado);
  }, [guiasFiltradas]);

  const guiasNormales = useMemo(() => {
    return guiasFiltradas.filter((guiaItem) => !guiaItem.destacado);
  }, [guiasFiltradas]);

  return (
    <div className={styles.container}>
      {/* Encabezado Superior */}
      <header className={styles.header}>
        <div className="space-y-1.5 w-full md:w-auto">
          {/* Fila del Título con Botón Home a la derecha en Mobile */}
          <div className="flex items-center justify-between gap-3">
            <h1 className={styles.title}>Guías</h1>

            {/* Botón Home visible SOLO en mobile (con tamaño estándar idéntico a las demás secciones) */}
            <Link
              href="/empresa/webapp"
              className={`flex md:hidden ${styles.btnHome}`}
              title="Volver al Inicio"
            >
              <span className="material-symbols-outlined text-xl">home</span>
            </Link>
          </div>

          <p className={styles.subtitle}>
            Manuales operativos, guías de ventas, logística, atención a clientes y procesos internos de Finvora.
          </p>
        </div>

        <div className={styles.actions}>
          {isPrivileged && (
            <>
              <button
                onClick={() => setIsCategoriasModalOpen(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-lg">category</span>
                <span>Editar Categorías</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>Nueva Guía</span>
              </button>
            </>
          )}

          {/* Botón Home visible en Desktop */}
          <Link
            href="/empresa/webapp"
            className={`hidden md:flex ${styles.btnHome}`}
            title="Volver al Inicio"
          >
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      {/* Barra de Búsqueda y Filtros de Categorías */}
      <div className="space-y-5">
        {/* Input de Búsqueda Instantánea */}
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none z-10 select-none">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, palabra clave o contenido de la guía..."
            className="w-full pl-11 pr-12 py-3.5 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-base sm:text-sm transition-all shadow-inner"
            suppressHydrationWarning
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer z-10"
              title="Limpiar búsqueda"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Carrusel / Slider de Categorías Dinámicas (sin contadores) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <button
            onClick={() => setSelectedCategoria('Todas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border ${
              selectedCategoria === 'Todas'
                ? 'bg-secondary text-slate-950 border-secondary shadow-md shadow-secondary/20'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            Todas
          </button>

          {todasCategorias.map((cat) => {
            const isSelected = selectedCategoria.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategoria(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-secondary text-slate-950 border-secondary shadow-md shadow-secondary/20'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sección 1: Guías Destacadas (si existen) */}
      {guiasDestacadas.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-400">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              push_pin
            </span>
            <span>Guías Fijadas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guiasDestacadas.map((guia) => (
              <GuiaCard key={guia.id} guia={guia} isFeatured />
            ))}
          </div>
        </section>
      )}

      {/* Sección 2: Explorar Todas las Guías */}
      <section className="space-y-4">
        {guiasDestacadas.length > 0 && (
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400 pt-4">
            <span className="material-symbols-outlined text-lg">folder_open</span>
            <span>Todas las Guías</span>
          </div>
        )}

        {guiasFiltradas.length === 0 ? (
          /* Estado Vacío */
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-slate-900/30 border border-slate-800/80 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-3xl">auto_stories</span>
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-slate-200">
                {searchTerm
                  ? 'No se encontraron guías con ese término'
                  : 'Aún no hay guías en esta categoría'}
              </h3>
              <p className="text-xs md:text-sm text-slate-400">
                {searchTerm
                  ? 'Intenta buscar con otras palabras o limpia el filtro de búsqueda.'
                  : 'Crea la primera guía para comenzar a documentar el conocimiento de Finvora.'}
              </p>
            </div>

            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-secondary rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            ) : isPrivileged ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-secondary text-slate-950 rounded-xl text-sm font-bold hover:bg-secondary-fixed transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Crear Primera Guía
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guiasNormales.map((guia) => (
              <GuiaCard key={guia.id} guia={guia} />
            ))}
          </div>
        )}
      </section>

      {/* Modal de Creación / Edición de Guía */}
      <GuiaModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoriasExistentes={todasCategorias}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Modal de Administración de Categorías */}
      <CategoriasModal
        isOpen={isCategoriasModalOpen}
        onClose={() => setIsCategoriasModalOpen(false)}
        categorias={todasCategorias}
        onUpdated={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
