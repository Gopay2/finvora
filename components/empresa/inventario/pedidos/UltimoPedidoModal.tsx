'use client';

// ─── Imports ────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import type { UltimoPedidoResumen } from '@/types/pedidos-stock';

// ─── Tipos e Interfaces ─────────────────────────────────────────────────────
interface UltimoPedidoModalProps {
  /** Indica si el modal está abierto y visible */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Datos del último pedido registrado */
  pedido: UltimoPedidoResumen | null;
}

// ─── Estilos de Tailwind Centralizados (Consistente con ConfirmarPedidoModal) ────
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
  table: 'w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]',
  tableHeaderRow: 'border-b border-[#16233a] bg-[#060b18]/80 text-[#5b87bd] uppercase tracking-wider font-semibold text-xs whitespace-nowrap',
  tableHeaderCellLeft: 'py-3 px-3.5 sm:py-3.5 sm:px-5 text-left',
  tableHeaderCellCenter: 'py-3 px-3.5 sm:py-3.5 sm:px-5 text-center',
  tableBody: 'divide-y divide-[#121c2e] font-normal',
  tableEmptyCell: 'py-16 text-center text-slate-500 italic text-sm',
  tableRow: 'hover:bg-slate-800/30 transition-colors border-b border-[#121c2e] whitespace-nowrap',
  tableCell: 'py-3 px-3.5 sm:py-3.5 sm:px-5 text-slate-200 font-normal',
  tableCellCenter: 'py-3 px-3.5 sm:py-3.5 sm:px-5 text-slate-200 font-normal text-center',

  // Pie de página
  footer: 'p-4 sm:p-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 sm:gap-4 shrink-0',
  footerCounter: 'text-left text-xs sm:text-sm text-slate-400',
  footerActions: 'flex items-center gap-2.5 sm:gap-3 justify-end',
};

// ─── Componente Principal ───────────────────────────────────────────────────
export default function UltimoPedidoModal({
  isOpen,
  onClose,
  pedido,
}: UltimoPedidoModalProps) {
  const [mounted, setMounted] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Bloquear scroll de fondo al abrir
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Cerrar al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !pedido) return null;

  const totalEquipos = pedido.items.reduce((acc, it) => acc + (it.cantidad || 0), 0);

  // Descarga del pedido en formato Excel
  const handleDescargarExcel = () => {
    const dataParaExcel = pedido.items.map((item) => ({
      'ID Pedido': pedido.pedidoId,
      'Fecha Pedido': new Date(pedido.fechaPedido).toLocaleString('es-MX', {
        timeZone: 'America/Tijuana',
      }),
      'Vendedor': pedido.vendedorNombre,
      'Ciudad / Zona': pedido.zona,
      'Marca': item.marca,
      'Modelo': item.modelo,
      'Almacenamiento': item.almacenamiento || '—',
      'RAM': item.ram || '—',
      'Color': item.color || '—',
      'Cantidad': item.cantidad,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ultimo Pedido');

    const hoy = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Ultimo_Pedido_${hoy}.xlsx`);
  };

  // Manejo bidireccional de trackpad
  const handleTableWheel = (wheelEvent: React.WheelEvent<HTMLDivElement>) => {
    const multiplier = wheelEvent.deltaMode === 1 ? 30 : 1;
    if (Math.abs(wheelEvent.deltaX) > Math.abs(wheelEvent.deltaY)) {
      wheelEvent.currentTarget.scrollLeft += wheelEvent.deltaX * multiplier;
    } else if (bodyRef.current && Math.abs(wheelEvent.deltaY) > 0) {
      bodyRef.current.scrollTop += wheelEvent.deltaY * multiplier;
    }
  };

  const fechaFormateada = pedido.fechaPedido
    ? new Date(pedido.fechaPedido).toLocaleString('es-MX', {
        timeZone: 'America/Tijuana',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const modalContent = (
    <div className={styles.backdrop}>
      <div className={styles.modalCard}>
        {/* Encabezado del Modal */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrapper}>
              <span className="material-symbols-outlined text-xl">history</span>
            </div>
            <div>
              <h3 className={styles.headerTitle}>Último pedido</h3>
              {fechaFormateada && (
                <span className="text-xs text-slate-400 block mt-0.5 font-normal">
                  {fechaFormateada}
                </span>
              )}
            </div>
          </div>

          <div className={styles.headerActionGroup}>
            <button
              type="button"
              onClick={onClose}
              className={styles.headerIconButton}
              title="Cerrar modal"
            >
              <span className="material-symbols-outlined text-xl block">close</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del modal con tabla estilo modal de confirmación */}
        <div ref={bodyRef} className={styles.bodyContainer}>
          <div className={styles.tableWrapper} onWheel={handleTableWheel}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderCellLeft}>PRODUCTO</th>
                  <th className={styles.tableHeaderCellLeft}>COLOR</th>
                  <th className={styles.tableHeaderCellCenter}>CANTIDAD</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {pedido.items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={styles.tableEmptyCell}>
                      No hay equipos registrados en este pedido.
                    </td>
                  </tr>
                ) : (
                  pedido.items.map((item, idx) => {
                    const marca = item.marca?.trim() || '';
                    const modelo = item.modelo?.trim() || '';
                    const baseName = marca && modelo
                      ? (modelo.toLowerCase().startsWith(marca.toLowerCase()) ? modelo : `${marca} ${modelo}`)
                      : modelo || marca || 'Dispositivo móvil';

                    const specsList = [
                      item.almacenamiento?.trim(),
                      item.ram?.trim(),
                    ].filter(Boolean);
                    const specs = specsList.length > 0 ? `(${specsList.join(' / ')})` : '';
                    const prodColor = item.color || 'N/A';

                    return (
                      <tr key={`${item.producto_id || idx}-${idx}`} className={styles.tableRow}>
                        {/* Producto con especificaciones */}
                        <td className={styles.tableCell}>
                          <span>{baseName}</span>
                          {specs && <span className="text-slate-400 ml-1.5">{specs}</span>}
                        </td>

                        {/* Color */}
                        <td className={styles.tableCell}>
                          {prodColor}
                        </td>

                        {/* Cantidad badge centrado */}
                        <td className={styles.tableCellCenter}>
                          <span className="inline-block px-3 py-1 rounded-lg bg-slate-800 text-white font-black text-xs sm:text-sm border border-slate-700">
                            {item.cantidad}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer con resumen a la izquierda y únicamente el botón de Excel a la derecha */}
        <div className={styles.footer}>
          <div className={styles.footerCounter}>
            <span>
              <strong className="text-white">
                {totalEquipos} {totalEquipos === 1 ? 'equipo' : 'equipos'}
              </strong>{' '}
              en este pedido
            </span>
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              onClick={handleDescargarExcel}
              className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
              title="Descargar este pedido en Excel"
            >
              <span className="material-symbols-outlined text-xl block">download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
