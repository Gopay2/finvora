'use client';

import React, { useState, useEffect } from 'react';
import type { Guia } from '@/types/guias';
import { crearGuia, editarGuia } from '@/app/empresa/webapp/guias/actions';
import { useGuiaEditor } from './editor/useGuiaEditor';
import GuiaEditorToolbar from './editor/GuiaEditorToolbar';
import { guiaModalStyles, guiaEditorBoxStyles } from './editor/guiaEditor.styles';

interface GuiaModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  guiaParaEditar?: Guia | null;
  categoriasExistentes: string[];
  onSuccess?: () => void;
}

export default function GuiaModalForm({
  isOpen,
  onClose,
  guiaParaEditar,
  categoriasExistentes,
  onSuccess,
}: GuiaModalFormProps) {
  // ─── Estados de Formulario de la Guía ──────────────────────────────────────
  const [titulo, setTitulo] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [resumen, setResumen] = useState('');
  const [destacado, setDestacado] = useState(false);

  // Estados de Proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Motor y Selección del Editor WYSIWYG
  const editor = useGuiaEditor();

  // ─── Inicialización y Sincronización del Modal ─────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      editor.cleanupPendingImages();
      return;
    }

    if (guiaParaEditar) {
      setTitulo(guiaParaEditar.titulo || '');
      setCategoriaSeleccionada(guiaParaEditar.categoria || (categoriasExistentes[0] || 'General'));
      setResumen(guiaParaEditar.resumen || '');
      setDestacado(guiaParaEditar.destacado || false);
      editor.resetEditor(guiaParaEditar.contenido || '');
    } else {
      setTitulo('');
      setCategoriaSeleccionada(categoriasExistentes[0] || 'General');
      setResumen('');
      setDestacado(false);
      editor.resetEditor('');
    }

    setErrorMessage(null);
  }, [isOpen, guiaParaEditar, categoriasExistentes, editor.resetEditor, editor.cleanupPendingImages]);

  const handleClose = () => {
    editor.cleanupPendingImages();
    onClose();
  };

  // ─── Guardar o Editar Guía ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!titulo.trim()) {
      setErrorMessage('Por favor escribe un título para la guía.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Subir a Supabase Storage las imágenes que quedaron en el documento y serializar a markdown
      const { markdown, error: mediaError } = await editor.processPendingImagesAndGetMarkdown();

      if (mediaError || !markdown) {
        setErrorMessage(mediaError || 'Error al procesar el contenido multimedia.');
        setIsSubmitting(false);
        return;
      }

      if (!markdown.trim()) {
        setErrorMessage('El contenido de la guía no puede estar vacío.');
        setIsSubmitting(false);
        return;
      }

      const categoriaFinal = categoriaSeleccionada.trim() || 'General';

      // 2. Construir FormData con los datos consolidados
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      formData.append('categoria', categoriaFinal);
      formData.append('resumen', resumen.trim());
      formData.append('contenido', markdown);
      formData.append('destacado', String(destacado));

      // 3. Ejecutar Server Action correspondiente
      if (guiaParaEditar) {
        formData.append('id', guiaParaEditar.id);
        const res = await editarGuia(formData);
        if (res.error) {
          setErrorMessage(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await crearGuia(formData);
        if (res.error) {
          setErrorMessage(res.error);
          setIsSubmitting(false);
          return;
        }
      }

      // 4. Limpieza exitosa y cierre
      editor.cleanupPendingImages();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar guía:', err);
      setErrorMessage('Ocurrió un error inesperado al procesar la guía.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={guiaModalStyles.backdrop}>
      <div className={guiaModalStyles.modalContainer}>
        {/* Cabecera del Modal */}
        <div className={guiaModalStyles.header}>
          <div className="flex items-center gap-3">
            <div className={guiaModalStyles.headerIconWrapper}>
              <span className="material-symbols-outlined text-2xl">
                {guiaParaEditar ? 'edit_document' : 'post_add'}
              </span>
            </div>
            <div>
              <h2 className={guiaModalStyles.headerTitle}>
                {guiaParaEditar ? 'Editar Guía' : 'Nueva Guía'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className={guiaModalStyles.closeButton}
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Formulario con Scrollbar Estilizado */}
        <form onSubmit={handleSubmit} className={guiaModalStyles.form}>
          {errorMessage && (
            <div className={guiaModalStyles.errorMessage}>
              <span className="material-symbols-outlined text-xl text-red-400 shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Configuración Inicial: Título, Categoría y Pin Destacado */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-left">
            {/* Campo Título */}
            <div className="md:col-span-7 space-y-1.5 text-left">
              <label className={guiaModalStyles.label}>
                Título de la Guía <span className="text-secondary">*</span>
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Proceso de Entrega y Cobranza de Enganche..."
                className={guiaModalStyles.input}
              />
            </div>

            {/* Campo Categoría y Botón Pin (Lado a lado en móvil y desktop) */}
            <div className="md:col-span-5 space-y-1.5 text-left">
              <label className={guiaModalStyles.label}>
                Categoría <span className="text-secondary">*</span>
              </label>
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <select
                    value={categoriaSeleccionada}
                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    className={guiaModalStyles.select}
                    style={{ colorScheme: 'dark' }}
                    suppressHydrationWarning
                  >
                    {categoriasExistentes.length === 0 ? (
                      <option value="General" className="bg-slate-950 text-white">
                        General
                      </option>
                    ) : (
                      categoriasExistentes.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-950 text-white">
                          {cat}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
                    expand_more
                  </span>
                </div>

                {/* Botón de Pin Destacado */}
                <button
                  type="button"
                  onClick={() => setDestacado(!destacado)}
                  className={destacado ? guiaModalStyles.pinButtonActive : guiaModalStyles.pinButtonInactive}
                  title={destacado ? 'Guía destacada (clic para desfijar)' : 'Fijar como guía destacada'}
                >
                  <span
                    className="material-symbols-outlined text-xl transition-transform"
                    style={{ fontVariationSettings: destacado ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    push_pin
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Resumen Breve */}
          <div className="space-y-1.5 text-left">
            <label className={guiaModalStyles.label}>
              Resumen Breve <span className="text-slate-500 font-normal text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              placeholder="Breve descripción sobre qué trata esta guía..."
              className={guiaModalStyles.input}
            />
          </div>

          {/* Editor Continuo WYSIWYG */}
          <div className="space-y-2 pt-2 text-left">
            <label className={guiaModalStyles.label}>
              Contenido del Documento <span className="text-secondary">*</span>
            </label>

            {/* Barra de Herramientas */}
            <GuiaEditorToolbar
              isBold={editor.isBold}
              isItalic={editor.isItalic}
              isUnderline={editor.isUnderline}
              currentFontSize={editor.currentFontSize}
              fontSizeMenuOpen={editor.fontSizeMenuOpen}
              setFontSizeMenuOpen={editor.setFontSizeMenuOpen}
              activeAlign={editor.activeAlign}
              handleToggleBold={editor.handleToggleBold}
              handleToggleItalic={editor.handleToggleItalic}
              handleToggleUnderline={editor.handleToggleUnderline}
              handleChangeFontSize={editor.handleChangeFontSize}
              handleApplyAlignment={editor.handleApplyAlignment}
              handleOpenImagePicker={editor.handleOpenImagePicker}
              handleImageFileSelected={editor.handleImageFileSelected}
              ensureEditorFocus={editor.ensureEditorFocus}
              fileInputRef={editor.fileInputRef}
            />

            {/* Mensaje de ayuda ubicado debajo de la barra de herramientas */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-500">
                💡 Pega imágenes con <strong>Ctrl + V</strong> o URLs de YouTube directamente en el texto
              </span>
            </div>

            {/* Caja del Editor contentEditable */}
            <div className={guiaEditorBoxStyles.container}>
              <div
                ref={editor.editorRef}
                contentEditable
                onClick={editor.handleEditorClick}
                onKeyDown={editor.handleKeyDown}
                onKeyUp={editor.handleInputOrKeyUp}
                onMouseUp={editor.updateActiveFormatting}
                onFocus={editor.updateActiveFormatting}
                onInput={editor.handleInputOrKeyUp}
                onPaste={editor.handlePaste}
                suppressContentEditableWarning
                className={guiaEditorBoxStyles.contentEditable}
              />
            </div>
          </div>

          {/* Pie del Formulario: Botones Cancelar y Guardar */}
          <div className={guiaModalStyles.footer}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={guiaModalStyles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={guiaModalStyles.submitButton}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{guiaParaEditar ? 'Guardando...' : 'Publicando...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    {guiaParaEditar ? 'save' : 'publish'}
                  </span>
                  <span>{guiaParaEditar ? 'Guardar Cambios' : 'Publicar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
