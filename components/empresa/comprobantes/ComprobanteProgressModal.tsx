'use client';

import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/**
 * Propiedades para el modal de progreso de carga de comprobantes.
 */
interface ComprobanteProgressModalProps {
  /** Indica si el modal debe mostrarse visible en pantalla */
  isOpen: boolean;
  /** Porcentaje actual de avance (0 a 100) */
  progress: number;
  /** Título principal de la fase en curso (ej. "Optimizando imágenes...") */
  stepTitle: string;
  /** Descripción explicativa de la fase actual para el usuario */
  stepDescription: string;
  /** Indica si el proceso concluyó con éxito */
  isSuccess?: boolean;
  /** Mensaje de error en caso de que ocurra una falla durante la operación */
  error?: string | null;
  /** Callback para cerrar el modal al finalizar o al reintentar */
  onClose?: () => void;
}

/**
 * Función de suscripción no operativa requerida por `useSyncExternalStore`.
 * Permite detectar el montaje en el cliente de forma segura en React 19 sin provocar
 * renders en cascada ni advertencias de `react-hooks/set-state-in-effect`.
 */
const emptySubscribe = () => () => {};

// ─── Estilos de Tailwind extraídos ──────────────────────────────────────────
const styles = {
  overlay: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200",
  card: "relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 p-6 md:p-8 space-y-6 overflow-hidden",
  glowBase: "absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none",
  header: "flex flex-col items-center text-center space-y-3",
  iconContainerBase: "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300",
  title: "text-xl font-bold text-slate-100 tracking-tight",
  description: "text-sm text-slate-400 max-w-xs min-h-[40px] flex items-center justify-center",
  progressSection: "space-y-2",
  progressHeader: "flex items-center justify-between text-xs font-semibold",
  progressTrack: "w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5",
  progressBar: "h-full rounded-full transition-all duration-300 ease-out",
  microStepsGrid: "grid grid-cols-3 gap-1 pt-1 text-[11px] text-slate-500 text-center",
  errorBox: "p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 space-y-1",
  errorHeader: "font-semibold flex items-center gap-1.5",
  errorMessage: "text-rose-200/90 leading-relaxed",
  actionContainer: "w-full pt-1",
  buttonBase: "w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer shadow-lg flex items-center justify-center gap-2 animate-in fade-in duration-200",
  buttonPlaceholder: "w-full py-3.5 px-4 rounded-xl text-sm font-bold opacity-0 invisible select-none pointer-events-none",
};

// ─── Variantes de estilos por estado ───────────────────────────────────────
type ModalVisualState = 'error' | 'success' | 'loading';

const statusVariants = {
  glow: {
    error: "bg-rose-500",
    success: "bg-emerald-500",
    loading: "bg-secondary",
  },
  iconContainer: {
    error: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    loading: "bg-secondary/10 border-secondary/30 text-secondary",
  },
  progressBar: {
    success: "bg-gradient-to-r from-emerald-500 to-teal-400",
    loading: "bg-gradient-to-r from-secondary to-cyan-400",
  },
  progressText: {
    success: "text-emerald-400 font-bold",
    loading: "text-secondary font-bold",
  },
  button: {
    error: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    success: "bg-secondary hover:bg-secondary/90 text-slate-950 shadow-secondary/20",
  },
};

/**
 * Modal flotante de progreso y retroalimentación para el registro de comprobantes.
 * Se monta mediante un React Portal directamente en `document.body` para garantizar
 * un centrado absoluto en el viewport y evitar interferencias con contenedores con backdrop-filter.
 */
export function ComprobanteProgressModal({
  isOpen,
  progress,
  stepTitle,
  stepDescription,
  isSuccess = false,
  error = null,
  onClose,
}: ComprobanteProgressModalProps): React.ReactPortal | null {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isOpen || !isClient) return null;

  const visualState: ModalVisualState = error ? 'error' : isSuccess ? 'success' : 'loading';

  const modalContent = (
    <div role="dialog" aria-modal="true" className={styles.overlay}>
      <div className={styles.card}>
        {/* Glow de fondo temático */}
        <div className={`${styles.glowBase} ${statusVariants.glow[visualState]}`} />

        {/* Icono central de estado */}
        <div className={styles.header}>
          <div className={`${styles.iconContainerBase} ${statusVariants.iconContainer[visualState]}`}>
            {error ? (
              <span className="material-symbols-outlined text-3xl">error</span>
            ) : isSuccess ? (
              <span className="material-symbols-outlined text-3xl animate-in zoom-in-50 duration-300">
                check_circle
              </span>
            ) : (
              <span className="material-symbols-outlined text-3xl animate-pulse">
                cloud_upload
              </span>
            )}
          </div>

          <h3 className={styles.title}>
            {stepTitle}
          </h3>
          <p className={styles.description}>
            {stepDescription}
          </p>
        </div>

        {/* Barra de progreso interactiva (solo si no hay error) */}
        {!error && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className="text-slate-400">Progreso de carga</span>
              <span className={statusVariants.progressText[isSuccess ? 'success' : 'loading']}>
                {Math.min(100, Math.max(0, Math.round(progress)))}%
              </span>
            </div>

            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressBar} ${statusVariants.progressBar[isSuccess ? 'success' : 'loading']}`}
                style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
              />
            </div>

            {/* Micro estados de referencia */}
            <div className={styles.microStepsGrid}>
              <span className={progress >= 25 ? 'text-secondary font-medium' : ''}>
                1. Optimización
              </span>
              <span className={progress >= 60 ? 'text-secondary font-medium' : ''}>
                2. Subida
              </span>
              <span className={progress >= 95 ? 'text-secondary font-medium' : ''}>
                3. Registro
              </span>
            </div>
          </div>
        )}

        {/* Mensaje de error detallado si falla */}
        {error && (
          <div className={styles.errorBox}>
            <div className={styles.errorHeader}>
              <span className="material-symbols-outlined text-sm">warning</span>
              Ocurrió un problema:
            </div>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        )}

        {/* Botón de acción con espacio siempre reservado para evitar saltos de layout en móvil */}
        <div className={styles.actionContainer}>
          {error || isSuccess ? (
            <button
              type="button"
              onClick={onClose}
              className={`${styles.buttonBase} ${error ? statusVariants.button.error : statusVariants.button.success}`}
            >
              {error && (
                <span className="material-symbols-outlined text-lg">close</span>
              )}
              {error ? 'Entendido / Reintentar' : 'Aceptar y Cerrar'}
            </button>
          ) : (
            <div className={styles.buttonPlaceholder} aria-hidden="true">
              Aceptar y Cerrar
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
