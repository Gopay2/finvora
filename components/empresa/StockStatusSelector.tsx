'use client';

import React, { useState, useRef, useEffect } from "react";
import { actualizarEstadoStock, registrarVenta, getVendedores, registrarRecambio } from "@/app/empresa/webapp/stock/stock-actions";
import { StockVentaModal } from "./stock/StockVentaModal";
import { StockRecambioModal } from "./stock/StockRecambioModal";

interface StockStatusSelectorProps {
  imei: string;
  estadoActual: string;
  fechaEnEnvio?: string | null;
  fechaIngreso?: string | null;
  disabled?: boolean;
  vendedores?: Vendedor[];
}

function formatFechaIngreso(fechaStr?: string | null): string {
  if (!fechaStr) return "";
  try {
    const [datePart] = fechaStr.split("T");
    const parts = datePart.split("-");
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (year && month && day) {
        const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        const nombreMes = meses[month - 1] || "";
        return `${day} de ${nombreMes} de ${year}`;
      }
    }
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return fechaStr;
  }
}

interface Vendedor {
  id: string;
  username: string | null;
  role: string;
}

export default function StockStatusSelector({
  imei,
  estadoActual,
  fechaEnEnvio = null,
  fechaIngreso = null,
  disabled = false,
  vendedores = []
}: StockStatusSelectorProps) {
  const [estado, setEstado] = useState(estadoActual);
  const [fechaEnEnvioState, setFechaEnEnvioState] = useState<string | null>(fechaEnEnvio);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [envioCountdown, setEnvioCountdown] = useState<number | null>(null);
  const [isProgramado, setIsProgramado] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showRecambioModal, setShowRecambioModal] = useState(false);
  const [vendedoresList, setVendedoresList] = useState<Vendedor[]>(vendedores);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<string>("");
  const [solicitadoPor, setSolicitadoPor] = useState<string>("");
  const [motivoRecambio, setMotivoRecambio] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar estado local con prop si cambia externamente
  useEffect(() => {
    setEstado(estadoActual);
    if (fechaEnEnvio) {
      setFechaEnEnvioState(fechaEnEnvio);
    }
  }, [estadoActual, fechaEnEnvio]);

  const colors: Record<string, string> = {
    Disponible: "bg-green-500/10 text-green-400 border-green-500/30",
    "En envío": "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Vendido: "bg-red-500/10 text-red-400 border-red-500/30",
    "A consultar": "bg-purple-500/10 text-purple-400 border-purple-500/30",
    Recambio: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
  };

  useEffect(() => {
    if (vendedores && vendedores.length > 0) {
      setVendedoresList(vendedores);
      return;
    }
    async function loadVendedores() {
      const data = await getVendedores();
      setVendedoresList(data as Vendedor[]);
    }
    loadVendedores();
  }, [vendedores]);

  // Manejo del temporizador regresivo (cambiar 1 * 60 * 1000 por 12 * 60 * 60 * 1000 para producción)
  useEffect(() => {
    if (!mounted) return;

    if (estado === "En envío") {
      const fechaBaseIso = fechaEnEnvioState || new Date().toISOString();
      const fechaBaseMs = new Date(fechaBaseIso).getTime();

      const calcularSegundosRestantes = () => {
        const ahoraMs = Date.now();
        // Si la fecha base está en el futuro (entrega programada), el temporizador de 12hs no inicia aún
        if (ahoraMs < fechaBaseMs) {
          setIsProgramado(true);
          return 12 * 60 * 60; // 43200 s = 12:00:00 estático
        }

        setIsProgramado(false);
        const targetTimeMs = fechaBaseMs + 12 * 60 * 60 * 1000;
        const diffSecs = Math.floor((targetTimeMs - ahoraMs) / 1000);
        return diffSecs > 0 ? diffSecs : 0;
      };

      const segundosIniciales = calcularSegundosRestantes();
      setEnvioCountdown(segundosIniciales);

      if (segundosIniciales <= 0 && Date.now() >= fechaBaseMs) {
        setEstado("Disponible");
        return;
      }

      const interval = setInterval(() => {
        const segundos = calcularSegundosRestantes();
        setEnvioCountdown(segundos);
        if (segundos <= 0 && Date.now() >= fechaBaseMs) {
          clearInterval(interval);
          setEstado("Disponible");
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setEnvioCountdown(null);
      setIsProgramado(false);
    }
  }, [estado, fechaEnEnvioState, mounted]);

  // Formato HH:MM:SS (ej: 08:45:12)
  const formatHHMMSS = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      if (estado === "Vendido") {
        ejecutarVentaDefinitiva();
      } else if (estado === "Recambio") {
        ejecutarRecambioDefinitivo();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, estado]);

  const ejecutarVentaDefinitiva = async () => {
    setLoading(true);
    const result = await registrarVenta(imei, vendedorSeleccionado || undefined);
    if (result.error) {
      setError(result.error);
      setEstado(estadoActual);
      setTimeLeft(null);
    }
    setLoading(false);
  };

  const ejecutarRecambioDefinitivo = async () => {
    setLoading(true);
    const result = await registrarRecambio(imei, solicitadoPor, motivoRecambio);
    if (result.error) {
      setError(result.error);
      setEstado(estadoActual);
      setTimeLeft(null);
    }
    setLoading(false);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;

    const nuevoEstado = e.target.value;

    if (nuevoEstado === "Vendido") {
      setError(null);
      setShowSellerModal(true);
      return;
    }

    if (nuevoEstado === "Recambio") {
      setError(null);
      setShowRecambioModal(true);
      return;
    }

    if (timeLeft !== null) {
      setTimeLeft(null);
    }

    setLoading(true);
    const result = await actualizarEstadoStock(imei, nuevoEstado);
    if (result.success) {
      setEstado(nuevoEstado);
      if (nuevoEstado === "En envío") {
        setFechaEnEnvioState(new Date().toISOString());
      }
    } else {
      setError("Error al actualizar estado");
      setTimeout(() => setError(null), 3000);
    }
    setLoading(false);
  };

  const handleConfirmVenta = () => {
    if (!vendedorSeleccionado) {
      setError("Debes seleccionar quién realizó la venta");
      return;
    }
    setError(null);
    setShowSellerModal(false);
    setEstado("Vendido");
    setTimeLeft(20);
  };

  const handleCancelVenta = () => {
    setError(null);
    setShowSellerModal(false);
    setEstado(estadoActual);
  };

  const handleConfirmRecambio = () => {
    if (!solicitadoPor) {
      setError("Debes seleccionar quién solicita el recambio");
      return;
    }
    if (!motivoRecambio.trim()) {
      setError("Debes ingresar el motivo del recambio");
      return;
    }
    setError(null);
    setShowRecambioModal(false);
    setEstado("Recambio");
    setTimeLeft(20);
  };

  const handleCancelRecambio = () => {
    setError(null);
    setShowRecambioModal(false);
    setEstado(estadoActual);
  };

  if (disabled) {
    return (
      <div className="flex flex-col items-start" suppressHydrationWarning>
        <div className="flex items-center gap-2">
          <span className={`
            inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border w-[98px] text-center
            ${colors[estado] || colors.Disponible}
          `}>
            {estado.toUpperCase()}
          </span>
          {fechaIngreso && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium text-slate-400 bg-slate-900/50 border border-slate-700/60 whitespace-nowrap">
              {formatFechaIngreso(fechaIngreso)}
            </span>
          )}
        </div>
        {mounted && estado === "En envío" && envioCountdown !== null && (
          <div className={`mt-1.5 flex items-center justify-center gap-1.5 px-2 py-0.5 text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg w-[98px] ${isProgramado ? "" : "animate-pulse"}`}>
            <span className="material-symbols-outlined text-[12px] leading-none">calendar_month</span>
            <span className="font-bold tracking-wider">{formatHHMMSS(envioCountdown)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start" suppressHydrationWarning>
      <div className="flex items-center gap-2">
        <div className="relative inline-flex items-center">
          {/* Chip visual de Estado - 100% perfectamente centrado y con padding simétrico */}
          <div
            className={`
              inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-all text-center select-none w-[98px]
              ${colors[estado] || colors.Disponible}
              ${loading ? 'opacity-50' : 'opacity-100'}
            `}
          >
            <span className="uppercase tracking-wide">{estado.toUpperCase()}</span>
          </div>

          {/* Select invisible superpuesto para capturar clicks y abrir el dropdown nativo */}
          <select
            value={estado}
            onChange={handleChange}
            disabled={loading}
            suppressHydrationWarning
            aria-label="Cambiar estado"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer uppercase text-center text-xs"
            style={{
              colorScheme: 'dark',
              textAlign: 'center',
              textAlignLast: 'center',
              fontSize: '12px'
            }}
          >
            <option value="Disponible" className="bg-slate-950 text-white font-sans text-center text-xs" style={{ fontSize: '12px' }}>DISPONIBLE</option>
            <option value="A consultar" className="bg-slate-950 text-white font-sans text-center text-xs" style={{ fontSize: '12px' }}>A CONSULTAR</option>
            <option value="En envío" className="bg-slate-950 text-white font-sans text-center text-xs" style={{ fontSize: '12px' }}>EN ENVÍO</option>
            <option value="Vendido" className="bg-slate-950 text-white font-sans text-center text-xs" style={{ fontSize: '12px' }}>VENDIDO</option>
            <option value="Recambio" className="bg-slate-950 text-white font-sans text-center text-xs" style={{ fontSize: '12px' }}>RECAMBIO</option>
          </select>

          {loading && !timeLeft && (
            <span className="absolute -right-5 animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full" />
          )}
        </div>

        {fechaIngreso && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium text-slate-400 bg-slate-900/50 border border-slate-700/60 whitespace-nowrap">
            {formatFechaIngreso(fechaIngreso)}
          </span>
        )}
      </div>

      {/* Temporizador regresivo si está En envío (renderizado solo tras el montaje cliente) */}
      {mounted && estado === "En envío" && envioCountdown !== null && (
        <div className={`mt-1.5 flex items-center justify-center gap-1.5 px-2 py-0.5 text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg w-[98px] ${isProgramado ? "" : "animate-pulse"}`}>
          <span className="material-symbols-outlined text-[12px] leading-none">calendar_month</span>
          <span className="font-bold tracking-wider">{formatHHMMSS(envioCountdown)}</span>
        </div>
      )}

      {timeLeft !== null && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5 px-2 py-0.5 text-[11px] font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg w-[98px] animate-pulse">
          <span className="material-symbols-outlined text-[12px] leading-none">timer</span>
          <span className="font-bold uppercase tracking-tight">Confirmando en {timeLeft}...</span>
        </div>
      )}

      {error && !showSellerModal && (
        <div className="mt-1">
          <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            {error}
          </span>
        </div>
      )}

      {/* Modal de Selección de Vendedor */}
      <StockVentaModal
        showSellerModal={showSellerModal}
        mounted={mounted}
        vendedorSeleccionado={vendedorSeleccionado}
        setVendedorSeleccionado={setVendedorSeleccionado}
        vendedoresList={vendedoresList}
        error={error}
        setError={setError}
        handleCancelVenta={handleCancelVenta}
        handleConfirmVenta={handleConfirmVenta}
      />

      {/* Modal de Selección de Recambio */}
      <StockRecambioModal
        showRecambioModal={showRecambioModal}
        mounted={mounted}
        solicitadoPor={solicitadoPor}
        setSolicitadoPor={setSolicitadoPor}
        motivoRecambio={motivoRecambio}
        setMotivoRecambio={setMotivoRecambio}
        vendedoresList={vendedoresList}
        error={error}
        setError={setError}
        handleCancelRecambio={handleCancelRecambio}
        handleConfirmRecambio={handleConfirmRecambio}
      />
    </div>
  );
}
