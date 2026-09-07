'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CameraSession } from '@/lib/scanner/camera';
import type { ScanResult } from '@/lib/scanner/decoder';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcodeText: string) => Promise<{ success: boolean; error?: string }> | void;
  hasSelectedProduct?: boolean;
}

type Status = 'idle' | 'starting' | 'active' | 'error';

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  hasSelectedProduct,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<CameraSession | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Código escaneado pendiente de confirmación y errores
  const [scannedCode, setScannedCode] = useState<string>('');
  const [registerError, setRegisterError] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Pitido estilo escáner de supermercado (alto, nítido, 2650 Hz) y doble vibración háptica
  const playBeepAndHaptic = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Frecuencia icónica de escáner láser de caja / retail (~2650 Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2650, now);

        // Volumen potente y envolvente ágil estilo caja de supermercado (105ms de duración)
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.75, now + 0.004);
        gain.gain.setValueAtTime(0.75, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.105);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 120]);
      }
    } catch {
      // Ignorar fallas de audio o vibración en equipos que no lo soporten
    }
  };

  const handleResult = (result: ScanResult) => {
    const code = (result.text || '').trim();
    if (!code) return;

    const now = Date.now();
    // Evitar reproducir pitido continuo si es el mismo código escaneado dentro de 2 segundos
    if (code === lastScannedCodeRef.current && now - lastScanTimeRef.current < 2000) {
      return;
    }

    lastScannedCodeRef.current = code;
    lastScanTimeRef.current = now;
    setScannedCode(code);
    setRegisterError('');
    playBeepAndHaptic();
  };

  const handleConfirmRegister = async () => {
    if (!scannedCode || isRegistering) return;
    setRegisterError('');

    if (hasSelectedProduct === false) {
      setRegisterError('Debes seleccionar primero Marca y Modelo en el formulario antes de registrar.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await onScanSuccess(scannedCode);
      if (res && !res.success) {
        setRegisterError(res.error || 'Ocurrió un error al registrar el equipo.');
        return;
      }
      sessionRef.current?.stop();
      onClose();
    } catch {
      setRegisterError('Ocurrió un error inesperado al registrar el equipo.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStart = (deviceId?: string) => {
    setErrorMessage('');
    setStatus('starting');
    setIsTorchOn(false);
    void sessionRef.current?.start(deviceId);
  };

  const handleStop = () => {
    sessionRef.current?.stop();
    setStatus('idle');
    setIsTorchOn(false);
  };

  const handleToggleTorch = async () => {
    if (sessionRef.current) {
      const next = !isTorchOn;
      const ok = await sessionRef.current.toggleTorch(next);
      setIsTorchOn(ok ? next : false);
    }
  };

  const handleSwitchCamera = (newDeviceId: string) => {
    setSelectedCameraId(newDeviceId);
    handleStart(newDeviceId);
  };

  // Inicializar la sesión de cámara vinculada al elemento video
  useEffect(() => {
    if (!isOpen) return;

    setScannedCode('');
    setRegisterError('');
    setIsRegistering(false);
    lastScannedCodeRef.current = '';
    lastScanTimeRef.current = 0;

    // Pre-activar AudioContext tras la interacción de usuario para asegurar que no se silencie en iOS
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current?.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
    } catch {
      // Ignorar si el navegador restringe la inicialización
    }

    const video = videoRef.current;
    if (!video) return;

    const session = new CameraSession(video, {
      onResult: handleResult,
      onReady: () => setStatus('active'),
      onError: (msg) => {
        setErrorMessage(msg);
        setStatus('error');
      },
      onCamerasFound: (cams) => {
        setAvailableCameras(cams);
        const activeDeviceId = sessionRef.current?.getActiveTrack()?.getSettings?.().deviceId;
        if (activeDeviceId) {
          setSelectedCameraId(activeDeviceId);
        }
      },
      onTorchSupported: (supported) => setHasTorch(supported),
    });
    sessionRef.current = session;

    // Iniciar automáticamente al abrir el modal
    handleStart();

    // Detener la cámara si se cambia de pestaña o se oculta
    const stopWhenHidden = () => {
      if (document.hidden) handleStop();
    };

    document.addEventListener('visibilitychange', stopWhenHidden);
    window.addEventListener('pagehide', handleStop);

    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden);
      window.removeEventListener('pagehide', handleStop);
      session.stop();
      sessionRef.current = null;
      setStatus('idle');
      setErrorMessage('');
      setRegisterError('');
      setHasTorch(false);
      setIsTorchOn(false);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-[360px] sm:max-w-md overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Encabezado con estilo estándar de la web */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-lg sm:text-xl block">
                barcode_scanner
              </span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide leading-tight">
                Escanear Código de Barras
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl block">close</span>
          </button>
        </div>

        {/* Barra de herramientas móvil (Linterna y Cambio de Cámara) */}
        {status === 'active' && (
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
            {/* Botón de linterna si el celular lo soporta (solo ícono) */}
            {hasTorch ? (
              <button
                type="button"
                onClick={handleToggleTorch}
                title={isTorchOn ? 'Apagar linterna' : 'Encender linterna'}
                aria-label={isTorchOn ? 'Apagar linterna' : 'Encender linterna'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                <span className="material-symbols-outlined text-lg leading-none">
                  {isTorchOn ? 'flashlight_on' : 'flashlight_off'}
                </span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-sm text-secondary">
                  center_focus_strong
                </span>
                Enfoque continuo
              </span>
            )}

            {/* Selector de cámara si hay más de una */}
            {availableCameras.length > 1 && (
              <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                <span className="material-symbols-outlined text-sm text-slate-400 shrink-0">
                  flip_camera_ios
                </span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleSwitchCamera(e.target.value)}
                  className="w-auto max-w-[210px] sm:max-w-[270px] truncate bg-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs border border-slate-700 focus:outline-none focus:border-secondary cursor-pointer"
                  title="Seleccionar cámara"
                >
                  {availableCameras.map((cam, idx) => {
                    const label = (cam.label || `Cámara ${idx + 1}`).trim();
                    const shortLabel = label.length > 32 ? `${label.slice(0, 30)}...` : label;
                    return (
                      <option key={cam.deviceId || idx} value={cam.deviceId} title={label}>
                        {shortLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Visor de cámara / Contenido principal cuadrado y compacto */}
        <div className="p-3 sm:p-4 flex flex-col items-center justify-center relative bg-slate-950">
          {/* Video nativo con formato cuadrado aspect-square */}
          <div
            className={`w-full relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-square flex items-center justify-center ${
              status === 'active' ? 'block' : 'hidden'
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              aria-label="Vista de la cámara"
            />

            {/* Guía visual de escaneo superpuesta */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Marco de enfoque adaptado al tamaño de códigos de barras 1D/IMEI */}
              <div className="w-[88%] h-[36%] border-2 border-secondary/80 rounded-2xl relative shadow-[0_0_25px_rgba(20,184,166,0.25)] bg-teal-500/5">
                {/* Esquinas destacadas */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-secondary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-secondary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-secondary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-secondary rounded-br-lg" />

                {/* Línea roja láser animada */}
                <div className="w-full h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse absolute top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-white/90 bg-slate-950/80 border border-slate-800/80 px-3 py-0.5 rounded-full mt-3 backdrop-blur-sm shadow">
                Centra el código de barras o IMEI aquí
              </p>
            </div>
          </div>

          {/* Estado de carga / Iniciando */}
          {status === 'starting' && (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 py-16">
              <span className="w-10 h-10 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-300">
                Iniciando cámara y motor de escaneo...
              </p>
            </div>
          )}

          {/* Estado de error / Permiso requerido */}
          {status === 'error' && (
            <div className="p-5 text-center space-y-4 max-w-sm">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <span className="material-symbols-outlined text-3xl">
                  videocam_off
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  Acceso a la cámara
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {errorMessage || 'No se pudo acceder a la cámara.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStart(selectedCameraId)}
                  className="w-full px-5 py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-secondary/10 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all cursor-pointer"
                >
                  Ingresar IMEI por teclado
                </button>
              </div>
            </div>
          )}

          {/* Estado inactivo */}
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <button
                type="button"
                onClick={() => handleStart(selectedCameraId)}
                className="px-6 py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-secondary/10"
              >
                <span className="material-symbols-outlined text-lg">videocam</span>
                Activar cámara
              </button>
            </div>
          )}
        </div>

        {/* Alerta de error al registrar */}
        {registerError && (
          <div className="mx-4 sm:mx-5 my-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span className="flex-1">{registerError}</span>
          </div>
        )}

        {/* Pie del modal con valor escaneado y botón Registrar */}
        <div className="p-3.5 px-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          {scannedCode ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="material-symbols-outlined text-emerald-400 text-lg shrink-0">
                check_circle
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold leading-tight">
                  Código escaneado
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-secondary tracking-wider truncate block leading-tight">
                  {scannedCode}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-xs text-slate-400 truncate">
                {status === 'active' ? 'Apunta al código de barras...' : 'Cámara inactiva'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirmRegister}
            disabled={!scannedCode || isRegistering}
            className="px-5 py-2 bg-secondary hover:bg-secondary-fixed text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-secondary/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isRegistering ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Registrar</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
