'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CameraSession } from '@/lib/scanner/camera';
import type { ScanResult } from '@/lib/scanner/decoder';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcodeText: string) => void;
}

type Status = 'idle' | 'starting' | 'active' | 'error';

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<CameraSession | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

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
    playBeepAndHaptic();
    sessionRef.current?.stop();
    setStatus('idle');
    onScanSuccess(result.text);
    onClose();
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
      setHasTorch(false);
      setIsTorchOn(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0c1424] sm:border sm:border-[#1e2d4a] sm:rounded-3xl w-full h-full sm:h-auto sm:max-w-md overflow-hidden shadow-2xl flex flex-col relative">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800/80 bg-[#080e1c]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-2xl">
              barcode_scanner
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
                Escanear Código de Barras
              </h3>
              <p className="text-[11px] text-slate-400">
                Apunta al IMEI o código de barras
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Barra de herramientas móvil (Linterna y Cambio de Cámara) */}
        {status === 'active' && (
          <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
            {/* Botón de linterna si el celular lo soporta */}
            {hasTorch ? (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isTorchOn ? 'flashlight_on' : 'flashlight_off'}
                </span>
                {isTorchOn ? 'Linterna encendida' : 'Linterna'}
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">
                  center_focus_strong
                </span>
                Enfoque continuo
              </span>
            )}

            {/* Selector de cámara si hay más de una */}
            {availableCameras.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-slate-400">
                  flip_camera_ios
                </span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleSwitchCamera(e.target.value)}
                  className="bg-slate-800 text-slate-200 rounded-lg px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-secondary"
                >
                  {availableCameras.map((cam, idx) => (
                    <option key={cam.deviceId || idx} value={cam.deviceId}>
                      {cam.label || `Cámara ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Visor de cámara / Contenido principal */}
        <div className="flex-1 sm:flex-none p-4 sm:p-6 flex flex-col items-center justify-center min-h-[340px] relative bg-black">
          {/* Video nativo */}
          <div
            className={`w-full relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-[3/4] sm:aspect-[4/3] flex items-center justify-center ${
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
              <div className="w-[88%] h-[38%] border-2 border-secondary/80 rounded-2xl relative shadow-[0_0_25px_rgba(20,184,166,0.25)] bg-teal-500/5">
                {/* Esquinas destacadas */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-secondary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-secondary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-secondary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-secondary rounded-br-lg" />

                {/* Línea roja láser animada */}
                <div className="w-full h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse absolute top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-white/90 bg-black/70 px-3.5 py-1 rounded-full mt-4 backdrop-blur-sm shadow">
                Centra el código de barras o IMEI aquí
              </p>
            </div>
          </div>

          {/* Estado de carga / Iniciando */}
          {status === 'starting' && (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 py-20">
              <span className="w-10 h-10 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-300">
                Iniciando cámara y motor de escaneo...
              </p>
            </div>
          )}

          {/* Estado de error / Permiso requerido */}
          {status === 'error' && (
            <div className="p-6 text-center space-y-5 max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <span className="material-symbols-outlined text-3xl">
                  videocam_off
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">
                  Acceso a la cámara
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {errorMessage || 'No se pudo acceder a la cámara.'}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleStart(selectedCameraId)}
                  className="w-full px-5 py-3.5 bg-secondary text-slate-950 text-sm font-bold rounded-xl hover:bg-secondary/90 transition-all cursor-pointer shadow-lg shadow-secondary/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
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
                className="px-6 py-3 bg-secondary text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-secondary/20"
              >
                <span className="material-symbols-outlined text-lg">videocam</span>
                Activar cámara
              </button>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="p-4 px-6 border-t border-slate-800/80 bg-[#080e1c] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {status === 'active' ? 'Escaneando automáticamente...' : 'Lector de códigos'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
