'use client';

// ─── Imports ────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { PreCargaItem } from '@/types/recibo';

// ─── Tipos e Interfaces ─────────────────────────────────────────────────────
/**
 * Propiedades del modal de pre-carga de recibo de inventario
 */
interface PreCargaReciboModalProps {
  /** Indica si el modal está abierto y visible */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Lista de equipos en staging/pre-carga */
  items: PreCargaItem[];
  /** Callback para eliminar un equipo individual por su ID temporal */
  onDeleteItem: (tempId: string) => void;
  /** Callback para vaciar toda la lista de pre-carga */
  onClearAll: () => void;
  /** Callback asíncrono para confirmar e ingresar los equipos a la base de datos */
  onConfirm: () => Promise<void> | void;
  /** Estado de carga durante el registro en base de datos */
  isConfirming: boolean;
  /** Callback opcional para exportar la pre-carga a Excel */
  onExportExcel?: () => void;
}

/**
 * Propiedades para renderizar una fila individual de equipo pre-cargado
 */
interface PreCargaFilaItemProps {
  /** Datos completos del equipo pre-cargado */
  item: PreCargaItem;
  /** Si el modal está en proceso de confirmación/registro */
  isConfirming: boolean;
  /** Callback para eliminar el equipo */
  onDeleteItem: (tempId: string) => void;
  /** Función auxiliar para formatear la fecha */
  formatDate: (isoString: string) => string;
}

// ─── Estilos de Tailwind Centralizados ──────────────────────────────────────
const styles = {
  backdrop: 'fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200',
  modalCard: 'bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl shadow-slate-950/80 flex flex-col relative my-auto animate-in zoom-in-95 duration-200 max-h-[72vh] sm:max-h-[80vh]',
  
  // Encabezado
  header: 'flex items-center justify-between p-3.5 sm:p-6 border-b border-slate-800 bg-slate-900/60 shrink-0 select-none',
  headerTitleGroup: 'flex items-center gap-3',
  headerIconWrapper: 'w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0',
  headerTitle: 'text-base sm:text-lg font-bold text-white tracking-wide leading-tight',
  headerActionGroup: 'flex items-center gap-2',
  headerIconButton: 'text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 shrink-0',

  // Cuerpo y Tabla
  bodyContainer: 'flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 min-h-0 overscroll-contain',
  tableWrapper: 'w-full border border-[#16233a] rounded-2xl overflow-x-auto custom-scrollbar bg-[#060b18]/40',
  table: 'w-full text-left text-xs sm:text-sm border-collapse min-w-[560px] sm:min-w-[620px]',
  tableHeaderRow: 'border-b border-[#16233a] bg-[#060b18]/80 text-[#5b87bd] uppercase tracking-wider font-semibold text-xs whitespace-nowrap',
  tableHeaderCellLeft: 'py-3 px-3.5 sm:py-3.5 sm:px-5 text-left',
  tableHeaderCellCenter: 'py-3 px-3.5 sm:py-3.5 sm:px-5 text-center',
  tableHeaderCellAction: 'py-3 px-3 sm:py-3.5 sm:px-4 text-center',
  tableBody: 'divide-y divide-[#121c2e] font-normal',
  tableEmptyCell: 'py-16 text-center text-slate-500 italic text-sm',
  tableRow: 'hover:bg-slate-800/30 transition-colors border-b border-[#121c2e] whitespace-nowrap',
  tableCell: 'py-3 px-3.5 sm:py-3.5 sm:px-5 text-slate-200 font-normal',
  tableCellCenter: 'py-3 px-3.5 sm:py-3.5 sm:px-5 text-slate-200 font-normal text-center',
  tableCellAction: 'py-3 px-3 sm:py-3.5 sm:px-4 text-center',
  deleteButton: 'p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-40 inline-flex items-center justify-center',

  // Pie de página
  footer: 'p-4 sm:p-6 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shrink-0',
  footerCounter: 'w-full sm:w-auto text-left text-xs sm:text-sm text-slate-400',
  footerActions: 'flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end',
  clearButton: 'flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-md disabled:opacity-40',
  confirmButton: (isDisabled: boolean) =>
    `flex items-center justify-center px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg ${
      isDisabled
        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
        : 'bg-secondary text-slate-950 hover:bg-secondary/90 shadow-secondary/20 cursor-pointer'
    }`,
};

// ─── Subcomponentes ─────────────────────────────────────────────────────────
/**
 * Fila individual para renderizar cada equipo de la pre-carga en la tabla
 */
function PreCargaFilaItem({
  item,
  isConfirming,
  onDeleteItem,
  formatDate,
}: PreCargaFilaItemProps) {
  const marca = item.productos?.marca?.trim() || '';
  const modelo = item.productos?.modelo?.trim() || '';
  const baseName = marca && modelo
    ? (modelo.toLowerCase().startsWith(marca.toLowerCase()) ? modelo : `${marca} ${modelo}`)
    : modelo || marca || 'Dispositivo móvil';

  const specsList = [
    item.productos?.almacenamiento?.trim(),
    item.productos?.ram?.trim(),
  ].filter(Boolean);
  const specs = specsList.length > 0 ? `(${specsList.join(' / ')})` : '';

  const prodColor = item.productos?.color || 'N/A';

  return (
    <tr className={styles.tableRow}>
      {/* Producto simple con modelo y especificaciones entre paréntesis */}
      <td className={styles.tableCell}>
        <span>{baseName}</span>
        {specs && <span className="text-slate-400 ml-1.5">{specs}</span>}
      </td>

      {/* IMEI en texto limpio */}
      <td className={styles.tableCell}>
        {item.imei}
      </td>

      {/* Color en texto simple sin punto de color */}
      <td className={styles.tableCell}>
        {prodColor}
      </td>

      {/* Fecha de Ingreso centrada */}
      <td className={styles.tableCellCenter}>
        {formatDate(item.fecha_ingreso)}
      </td>

      {/* Acción para eliminar centrada */}
      <td className={styles.tableCellAction}>
        <button
          type="button"
          onClick={() => onDeleteItem(item.tempId)}
          disabled={isConfirming}
          className={styles.deleteButton}
          title="Eliminar de la pre-carga"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </td>
    </tr>
  );
}

// ─── Componente Principal ───────────────────────────────────────────────────
/**
 * Modal para visualizar, gestionar y registrar la pre-carga (staging) de equipos
 * recibidos antes de su ingreso definitivo al inventario.
 */
export default function PreCargaReciboModal({
  isOpen,
  onClose,
  items,
  onDeleteItem,
  onClearAll,
  onConfirm,
  isConfirming,
  onExportExcel,
}: PreCargaReciboModalProps) {
  const [mounted, setMounted] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Bloquear scroll de la página de fondo mientras el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Cerrar modal al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && isOpen && !isConfirming) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirming, onClose]);

  if (!isOpen || !mounted) return null;

  /**
   * Formatea una fecha ISO a formato legible DD/MM/AAAA
   * @param isoString Fecha en formato ISO string
   * @returns Fecha formateada como DD/MM/AAAA o el string original si es inválida
   */
  const formatDateDisplay = (isoString: string): string => {
    try {
      const fechaObjeto = new Date(isoString);
      const dia = fechaObjeto.getDate();
      const mes = String(fechaObjeto.getMonth() + 1).padStart(2, '0');
      const anio = fechaObjeto.getFullYear();
      return `${dia}/${mes}/${anio}`;
    } catch {
      return isoString;
    }
  };

  // Manejo bidireccional del panel táctil de PC (touchpad de notebook con 2 dedos)
  const handleTableWheel = (wheelEvent: React.WheelEvent<HTMLDivElement>) => {
    const multiplier = wheelEvent.deltaMode === 1 ? 30 : 1;
    if (Math.abs(wheelEvent.deltaX) > Math.abs(wheelEvent.deltaY)) {
      // Gesto horizontal con dos dedos
      wheelEvent.currentTarget.scrollLeft += wheelEvent.deltaX * multiplier;
    } else if (bodyRef.current && Math.abs(wheelEvent.deltaY) > 0) {
      // Gesto vertical con dos dedos o rueda del mouse
      bodyRef.current.scrollTop += wheelEvent.deltaY * multiplier;
    }
  };

  const modalContent = (
    <div className={styles.backdrop}>
      <div className={styles.modalCard}>
        {/* Encabezado del Modal con paleta oficial de Finvora */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrapper}>
              <span className="material-symbols-outlined text-xl">pending_actions</span>
            </div>
            <h3 className={styles.headerTitle}>
              Equipos registrados
            </h3>
          </div>

          <div className={styles.headerActionGroup}>
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                disabled={items.length === 0}
                className={styles.headerIconButton}
                title="Descargar Excel de pre-carga"
              >
                <span className="material-symbols-outlined text-xl block">download</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              className={styles.headerIconButton}
              title="Cerrar modal"
            >
              <span className="material-symbols-outlined text-xl block">close</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del modal con scroll vertical fluido y margen inferior garantizado */}
        <div ref={bodyRef} className={styles.bodyContainer}>
          <div
            className={styles.tableWrapper}
            onWheel={handleTableWheel}
          >
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderCellLeft}>PRODUCTO</th>
                  <th className={styles.tableHeaderCellLeft}>IMEI</th>
                  <th className={styles.tableHeaderCellLeft}>COLOR</th>
                  <th className={styles.tableHeaderCellCenter}>FECHA DE INGRESO</th>
                  <th className={styles.tableHeaderCellAction}>ACCIÓN</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.tableEmptyCell}>
                      No hay equipos en la lista de pre-carga actualmente.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <PreCargaFilaItem
                      key={item.tempId}
                      item={item}
                      isConfirming={isConfirming}
                      onDeleteItem={onDeleteItem}
                      formatDate={formatDateDisplay}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer con resumen a la izquierda y acciones fijas abajo */}
        <div className={styles.footer}>
          <div className={styles.footerCounter}>
            {items.length === 1 ? (
              <span><strong className="text-white">1 equipo</strong> listo para ingresar</span>
            ) : (
              <span><strong className="text-white">{items.length} equipos</strong> listos para ingresar</span>
            )}
          </div>

          <div className={styles.footerActions}>
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                disabled={isConfirming}
                className={styles.clearButton}
              >
                Vaciar pre-carga
              </button>
            )}

            <button
              type="button"
              onClick={onConfirm}
              disabled={items.length === 0 || isConfirming}
              className={styles.confirmButton(items.length === 0 || isConfirming)}
            >
              {isConfirming ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                  <span>Registrando...</span>
                </span>
              ) : (
                <span>Registrar</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
