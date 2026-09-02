'use client';

import React from 'react';
import { MediaAlign, FONT_SIZE_OPTIONS } from './guiaEditorUtils';
import { guiaToolbarStyles } from './guiaEditor.styles';

interface GuiaEditorToolbarProps {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  currentFontSize: string;
  fontSizeMenuOpen: boolean;
  setFontSizeMenuOpen: (open: boolean) => void;
  activeAlign: MediaAlign;
  handleToggleBold: () => void;
  handleToggleItalic: () => void;
  handleToggleUnderline: () => void;
  handleChangeFontSize: (size: string) => void;
  handleApplyAlignment: (align: MediaAlign) => void;
  handleOpenImagePicker: () => void;
  handleImageFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  ensureEditorFocus: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function GuiaEditorToolbar({
  isBold,
  isItalic,
  isUnderline,
  currentFontSize,
  fontSizeMenuOpen,
  setFontSizeMenuOpen,
  activeAlign,
  handleToggleBold,
  handleToggleItalic,
  handleToggleUnderline,
  handleChangeFontSize,
  handleApplyAlignment,
  handleOpenImagePicker,
  handleImageFileSelected,
  ensureEditorFocus,
  fileInputRef,
}: GuiaEditorToolbarProps) {
  const currentFontLabel =
    FONT_SIZE_OPTIONS.find((option) => option.value === currentFontSize)?.label || '16px - Normal';

  return (
    <div className={guiaToolbarStyles.toolbarContainer}>
      {/* Selector de Tamaño de Fuente (Arriba en celular, izquierda en PC) */}
      <div className="relative shrink-0 self-start sm:self-auto">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            ensureEditorFocus();
            setFontSizeMenuOpen(!fontSizeMenuOpen);
          }}
          className={guiaToolbarStyles.fontSizeButton}
          title="Tamaño de Fuente"
        >
          <span>{currentFontLabel}</span>
          <span className="material-symbols-outlined text-slate-500 text-sm">expand_more</span>
        </button>

        {fontSizeMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onMouseDown={(e) => {
                e.preventDefault();
                setFontSizeMenuOpen(false);
              }}
            />
            <div className={guiaToolbarStyles.fontSizeDropdown}>
              {FONT_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleChangeFontSize(opt.value);
                    setFontSizeMenuOpen(false);
                  }}
                  className={
                    currentFontSize === opt.value
                      ? guiaToolbarStyles.fontSizeItemActive
                      : guiaToolbarStyles.fontSizeItemInactive
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Separador de fila solo visible en PC */}
      <div className="hidden sm:block h-5 w-px bg-slate-700 mx-1" />

      {/* Grupo de Filtros / Herramientas (Fila inferior en celular, continuo en PC) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Botón Negrita (B) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleToggleBold();
          }}
          className={isBold ? guiaToolbarStyles.buttonActive : guiaToolbarStyles.buttonInactive}
          title="Negrita (Ctrl + B)"
        >
          <span className="material-symbols-outlined text-base">format_bold</span>
        </button>

        {/* Botón Cursiva (I) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleToggleItalic();
          }}
          className={isItalic ? guiaToolbarStyles.buttonActive : guiaToolbarStyles.buttonInactive}
          title="Cursiva (Ctrl + I)"
        >
          <span className="material-symbols-outlined text-base">format_italic</span>
        </button>

        {/* Botón Subrayado (U) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleToggleUnderline();
          }}
          className={isUnderline ? guiaToolbarStyles.buttonActive : guiaToolbarStyles.buttonInactive}
          title="Subrayado (Ctrl + U)"
        >
          <span className="material-symbols-outlined text-base">format_underlined</span>
        </button>

        <div className={guiaToolbarStyles.separator} />

        {/* Botón Alinear Izquierda */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleApplyAlignment('left');
          }}
          className={activeAlign === 'left' ? guiaToolbarStyles.buttonActive : guiaToolbarStyles.buttonInactive}
          title="Alinear a la izquierda"
        >
          <span className="material-symbols-outlined text-base">format_align_left</span>
        </button>

        {/* Botón Centrar */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleApplyAlignment('center');
          }}
          className={activeAlign === 'center' ? guiaToolbarStyles.buttonActive : guiaToolbarStyles.buttonInactive}
          title="Centrar"
        >
          <span className="material-symbols-outlined text-base">format_align_center</span>
        </button>

        {/* Botón Alinear Derecha */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleApplyAlignment('right');
          }}
          className={activeAlign === 'right' ? guiaToolbarStyles.buttonActive : guiaToolbarStyles.buttonInactive}
          title="Alinear a la derecha"
        >
          <span className="material-symbols-outlined text-base">format_align_right</span>
        </button>

        <div className={guiaToolbarStyles.separator} />

        {/* Botón Subir Imagen */}
        <button
          type="button"
          onClick={handleOpenImagePicker}
          className={guiaToolbarStyles.imageButton}
          title="Insertar imagen en la posición del cursor"
        >
          <span className="material-symbols-outlined text-base">add_photo_alternate</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelected}
        className="hidden"
      />
    </div>
  );
}
