'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import type { MappedUser } from "@/app/empresa/webapp/sueldos/page";
import { exportarReciboPDF } from "./sueldosPdfHelper";
import { styles as baseStyles, formatTijuanaDate, formatCurrency } from "./comprobantes-types";

const styles = {
  ...baseStyles,
  btnActionSecondary: "flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl hover:bg-secondary/20 transition-all cursor-pointer text-xs md:text-sm font-semibold gap-1.5",
  btnActionRose: "flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/10 disabled:text-slate-500 transition-all cursor-pointer text-xs md:text-sm font-semibold gap-1.5",
  btnLinkHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-750 hover:text-white transition-all cursor-pointer",
  btnClearFilters: "px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
  btnClearFiltersMobile: "w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
};

interface CalculadoraSueldosClientPageProps {
  comprobantesList: ComprobanteRecord[];
  usersList: MappedUser[];
}

const formatTijuanaOnlyDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Tijuana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(dateStr));
  } catch (error) {
    return dateStr;
  }
};

export default function CalculadoraSueldosClientPage({
  comprobantesList,
  usersList
}: CalculadoraSueldosClientPageProps) {
  // Estado para filtros: Usuario (vacio al inicio) y Fechas
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [plataformaInput, setPlataformaInput] = useState<string>("500");
  const [entregaInput, setEntregaInput] = useState<string>("500");
  const [comisionPercent, setComisionPercent] = useState<number>(50);
  const [bonoInput, setBonoInput] = useState<string>("0");
  const [sueldoInput, setSueldoInput] = useState<string>("0");
  const [publicidadInput, setPublicidadInput] = useState<string>("0");

  // Overrides individuales de entrega por fila (id -> valor string)
  const [rowEntregaOverrides, setRowEntregaOverrides] = useState<{ [id: string]: string }>({})
  // Fila actualmente enfocada para edición de entrega
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const selectedUser = useMemo(() => {
    return usersList.find((user) => user.id === selectedUserId);
  }, [usersList, selectedUserId]);

  const isRepartidorSelected = selectedUser?.role?.toLowerCase() === "repartidor";

  const plataformaVal = isRepartidorSelected ? 0 : (Number(plataformaInput) || 0);
  const entregaVal = Number(entregaInput) || 0;
  const bonoVal = Number(bonoInput) || 0;
  const sueldoVal = Number(sueldoInput) || 0;
  const publicidadVal = isRepartidorSelected ? 0 : (Number(publicidadInput) || 0);

  // Filtrado reactivo en memoria
  const filteredList = useMemo(() => {
    if (!selectedUserId) {
      return [];
    }

    return comprobantesList.filter((item) => {
      // 1. Filtro de fecha en zona horaria Tijuana
      const tijuanaDateStr = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(item.created_at)); // Retorna "YYYY-MM-DD"

      if (dateFrom && tijuanaDateStr < dateFrom) return false;
      if (dateTo && tijuanaDateStr > dateTo) return false;

      // 2. Filtro de Usuario
      const selectedUser = usersList.find(user => user.id === selectedUserId);
      if (selectedUser) {
        const isVendedor = item.vendedor?.id === selectedUser.id;
        const isCreador = item.creador?.id === selectedUser.id;
        const isRepartidor = selectedUser.repartidorId && item.repartidor?.id === selectedUser.repartidorId;

        if (!isVendedor && !isCreador && !isRepartidor) {
          return false;
        }
      }

      return true;
    });
  }, [comprobantesList, usersList, dateFrom, dateTo, selectedUserId]);

  const handleClearFilters = () => {
    setSelectedUserId("");
    setDateFrom("");
    setDateTo("");
    setPlataformaInput("500");
    setEntregaInput("500");
    setComisionPercent(50);
    setBonoInput("0");
    setSueldoInput("0");
    setPublicidadInput("0");
    setRowEntregaOverrides({});
    setActiveRowId(null);
  };

  const totalComision = useMemo(() => {
    if (isRepartidorSelected) {
      return filteredList.reduce((acc, item) => {
        const pagoRecibido = Number(item.pago_recibido) || 0;
        const rowEntrega = rowEntregaOverrides[item.id] !== undefined
          ? (Number(rowEntregaOverrides[item.id]) || 0)
          : entregaVal;
        return acc + (rowEntrega - pagoRecibido);
      }, 0);
    }

    return filteredList.reduce((acc, item) => {
      const costoEquipo = Number(item.costo_equipo) || 0;
      const precioCompra = Number(item.precio_compra) || 0;
      const pagoInicial = Number(item.pago_inicial) || 0;
      const pagoRecibido = Number(item.pago_recibido) || 0;
      const rowEntrega = rowEntregaOverrides[item.id] !== undefined
        ? (Number(rowEntregaOverrides[item.id]) || 0)
        : entregaVal;
      const subTotal = precioCompra - costoEquipo - pagoInicial - plataformaVal - rowEntrega + pagoRecibido;
      return acc + (subTotal * (comisionPercent / 100));
    }, 0);
  }, [filteredList, plataformaVal, entregaVal, comisionPercent, isRepartidorSelected, rowEntregaOverrides]);

  const handleDownloadPDF = () => {
    if (!selectedUser || (filteredList.length === 0 && bonoVal === 0 && sueldoVal === 0)) return;
    exportarReciboPDF({
      empleado: selectedUser,
      operaciones: filteredList,
      config: {
        plataformaVal,
        entregaVal,
        comisionPercent,
        bonoVal,
        sueldoVal,
        publicidadVal,
        rowEntregaOverrides
      },
      periodo: {
        desde: dateFrom,
        hasta: dateTo
      },
      totalComision
    });
  };

  const customTh = "px-1.5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap";
  const customTd = "px-1.5 py-3.5 text-center text-slate-300 font-medium text-[13px] whitespace-nowrap";
  const customTdEquipo = "px-1.5 py-3.5 text-center text-slate-300 font-medium text-[13px] max-w-[90px] break-words";

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Calculadora de sueldos
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">Consulta y audita las operaciones de los empleados para la liquidación de sueldos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/empresa/webapp" className={styles.btnLinkHome} title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      {/* Contenedor de la Tabla */}
      <div className={styles.tableContainer}>
        {/* Header de la Tabla */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Operaciones del Período</h3>
            <p className="text-xs text-slate-400 mt-1">Lista de ventas de los últimos 2 meses.</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 self-center">
            <Link
              href="/empresa/webapp/sueldos/proveedores"
              className={styles.btnActionSecondary}
              title="Costos de Proveedores"
            >
              <span className="material-symbols-outlined text-base md:text-xl">inventory_2</span>
              Proveedores
            </Link>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={!selectedUserId || (filteredList.length === 0 && bonoVal === 0 && sueldoVal === 0)}
              className={styles.btnActionRose}
              title="Descargar Recibo en PDF"
              suppressHydrationWarning
            >
              <span className="material-symbols-outlined text-base md:text-xl">picture_as_pdf</span>
              Descargar Recibo
            </button>
          </div>
        </div>

        {/* Filtros Integrados */}
        <div className="bg-slate-900/50 p-6 border-b border-slate-800/60 flex flex-col gap-6 text-sm">
          {/* Fila 1: Empleado y Comisión */}
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
            {/* Filtro de Empleado */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-slate-400 text-base">person</span>
                <span className="text-slate-300 font-semibold text-sm">Empleado:</span>
              </div>
              <div className="relative flex items-center w-40 sm:w-72 shrink-0">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2 text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all cursor-pointer h-[38px] w-full appearance-none"
                  style={{ colorScheme: 'dark' }}
                  suppressHydrationWarning
                >
                  <option value="">Elegir...</option>
                  {usersList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username.charAt(0).toUpperCase() + user.username.slice(1)} ({user.role})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 pointer-events-none text-slate-500 text-base">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            {/* Comisión % */}
            <div className="flex items-center gap-3 w-full lg:w-auto lg:justify-end">
              <span className="text-slate-300 font-semibold text-sm shrink-0">Comisión Empleado:</span>
              <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl gap-1">
                {[50, 80].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setComisionPercent(percent)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      comisionPercent === percent
                        ? "bg-secondary text-slate-950"
                        : "bg-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 2: Fechas y Limpiar Filtros */}
          <div className="flex flex-col lg:flex-row gap-6 pb-6 border-b border-slate-800/40 lg:items-center justify-between">
            {/* Filtro de Fechas */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 min-w-[80px]">
                <span className="material-symbols-outlined text-slate-400 text-base">calendar_month</span>
                <span className="text-slate-300 font-semibold text-sm">Fechas:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs sm:text-sm text-slate-400 font-semibold min-w-[50px] sm:min-w-0 shrink-0">Desde:</label>
                <div className="relative flex items-center flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    onKeyDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      try {
                        event.currentTarget.showPicker();
                      } catch (error) { }
                    }}
                    className={`${styles.dateInput} ${dateFrom ? "text-slate-200" : "text-transparent"}`}
                    style={{ colorScheme: 'dark' }}
                    suppressHydrationWarning
                  />
                  {!dateFrom && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
                      dd/mm/aaaa
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs sm:text-sm text-slate-400 font-semibold min-w-[50px] sm:min-w-0 shrink-0">Hasta:</label>
                <div className="relative flex items-center flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    onKeyDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      try {
                        event.currentTarget.showPicker();
                      } catch (error) { }
                    }}
                    className={`${styles.dateInput} ${dateTo ? "text-slate-200" : "text-transparent"}`}
                    style={{ colorScheme: 'dark' }}
                    suppressHydrationWarning
                  />
                  {!dateTo && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
                      dd/mm/aaaa
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Limpiar Filtros (Derecha / Esquina) */}
            {(selectedUserId !== "" || dateFrom || dateTo || plataformaVal !== 500 || entregaVal !== 500 || comisionPercent !== 50 || bonoInput !== "0" || sueldoInput !== "0" || publicidadInput !== "0") && (
              <div className="hidden lg:flex items-center gap-3 justify-end w-full lg:w-auto md:mb-1">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className={styles.btnClearFilters}
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>

          {/* Fila 2: Ajustes de Costos e Ingresos */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-6">
            {/* Plataforma */}
            <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
              <span className="text-slate-300 font-semibold text-sm shrink-0">Plataforma:</span>
              <div className="relative flex items-center w-full sm:w-32">
                <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={isRepartidorSelected ? "0" : plataformaInput}
                  disabled={isRepartidorSelected}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*$/.test(val)) {
                      setPlataformaInput(val);
                    }
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all h-[38px] w-full text-center disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-900"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Entrega */}
            <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
              <span className="text-slate-300 font-semibold text-sm shrink-0">Entrega:</span>
              <div className="relative flex items-center w-full sm:w-32">
                <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">{isRepartidorSelected ? "$" : "-"}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    activeRowId !== null
                      ? (rowEntregaOverrides[activeRowId] !== undefined ? rowEntregaOverrides[activeRowId] : entregaInput)
                      : entregaInput
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*$/.test(val)) {
                      if (activeRowId !== null) {
                        setRowEntregaOverrides((prev) => ({ ...prev, [activeRowId]: val }));
                      } else {
                        setEntregaInput(val);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      e.currentTarget.blur();
                    }
                  }}
                  className={`bg-slate-950 border rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] transition-all h-[38px] w-full text-center ${
                    activeRowId
                      ? "border-secondary shadow-[0_0_10px_rgba(224,242,254,0.15)] text-secondary font-bold"
                      : "border-slate-800 text-slate-200 focus:border-secondary"
                  }`}
                  placeholder={activeRowId ? "Fila activa..." : "General..."}
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Publicidad */}
            <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
              <span className="text-slate-300 font-semibold text-sm shrink-0">Publicidad:</span>
              <div className="relative flex items-center w-full sm:w-32">
                <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={isRepartidorSelected ? "0" : publicidadInput}
                  disabled={isRepartidorSelected}
                  onFocus={() => { if (publicidadInput === "0") setPublicidadInput(""); }}
                  onBlur={() => { if (publicidadInput === "") setPublicidadInput("0"); }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*$/.test(val)) {
                      setPublicidadInput(val);
                    }
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all h-[38px] w-full text-center disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-900"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Bono */}
            <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
              <span className="text-slate-300 font-semibold text-sm shrink-0">Bono:</span>
              <div className="relative flex items-center w-full sm:w-32">
                <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bonoInput}
                  onFocus={() => { if (bonoInput === "0") setBonoInput(""); }}
                  onBlur={() => { if (bonoInput === "") setBonoInput("0"); }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*$/.test(val)) {
                      setBonoInput(val);
                    }
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all h-[38px] w-full text-center"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Sueldo */}
            <div className="grid grid-cols-[1.1fr_2fr] gap-3 items-center w-full sm:flex sm:items-center sm:w-auto">
              <span className="text-slate-300 font-semibold text-sm shrink-0">Sueldo:</span>
              <div className="relative flex items-center w-full sm:w-32">
                <span className="absolute left-3 text-slate-400 font-bold text-[14px] pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sueldoInput}
                  onFocus={() => { if (sueldoInput === "0") setSueldoInput(""); }}
                  onBlur={() => { if (sueldoInput === "") setSueldoInput("0"); }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*$/.test(val)) {
                      setSueldoInput(val);
                    }
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-4 py-2 text-[16px] sm:text-[14px] text-slate-200 focus:outline-none focus:border-secondary transition-all h-[38px] w-full text-center"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>

          {/* Limpiar Filtros en móviles (abajo de los inputs) */}
          {(selectedUserId !== "" || dateFrom || dateTo || plataformaVal !== 500 || entregaVal !== 500 || comisionPercent !== 50 || bonoInput !== "0" || sueldoInput !== "0" || publicidadInput !== "0") && (
            <div className="flex lg:hidden items-center justify-start w-full mt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className={styles.btnClearFiltersMobile}
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabla de operaciones */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              {isRepartidorSelected ? (
                <tr>
                  <th className={customTh} style={{ width: "20%" }}>Fecha</th>
                  <th className={`${customTh} max-w-[120px]`} style={{ width: "20%" }}>Equipo</th>
                  <th className={customTh} style={{ width: "20%" }}>Entrega</th>
                  <th className={customTh} style={{ width: "20%" }}>Pago Recibido</th>
                  <th className={customTh} style={{ width: "20%" }}>Comisión</th>
                </tr>
              ) : (
                <tr>
                  <th className={customTh} style={{ width: "10%" }}>Fecha</th>
                  <th className={`${customTh} max-w-[90px]`} style={{ width: "10%" }}>Equipo</th>
                  <th className={customTh} style={{ width: "10%" }}>Precio Compra</th>
                  <th className={customTh} style={{ width: "10%" }}>Costo equipo</th>
                  <th className={customTh} style={{ width: "11%" }}>Pago Inicial</th>
                  <th className={customTh} style={{ width: "10%" }}>Plataforma</th>
                  <th className={customTh} style={{ width: "10%" }}>Entrega</th>
                  <th className={customTh} style={{ width: "10%" }}>Pago Recibido</th>
                  <th className={customTh} style={{ width: "10%" }}>Sub-Total</th>
                  <th className={customTh} style={{ width: "9%" }}>Comisión</th>
                </tr>
              )}
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={isRepartidorSelected ? 5 : 10} className="px-6 py-12 text-center text-slate-500 italic">
                    {selectedUserId === ""
                      ? "Por favor, selecciona un empleado para consultar las operaciones."
                      : "No se encontraron operaciones registradas con los filtros seleccionados."}
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const costoEquipo = Number(item.costo_equipo) || 0;
                  const precioCompra = Number(item.precio_compra) || 0;
                  const pagoInicial = Number(item.pago_inicial) || 0;
                  const pagoRecibido = Number(item.pago_recibido) || 0;
                  const rowEntrega = rowEntregaOverrides[item.id] !== undefined
                    ? (Number(rowEntregaOverrides[item.id]) || 0)
                    : entregaVal;
                  const subTotal = precioCompra - costoEquipo - pagoInicial - plataformaVal - rowEntrega + pagoRecibido;
                  const comision = isRepartidorSelected
                    ? (rowEntrega - pagoRecibido)
                    : (subTotal * (comisionPercent / 100));
                  
                  // Input inline de entrega para esta fila
                  const entregaDisplayVal = rowEntregaOverrides[item.id] !== undefined
                    ? rowEntregaOverrides[item.id]
                    : entregaInput;
                  const hasOverride = rowEntregaOverrides[item.id] !== undefined &&
                    rowEntregaOverrides[item.id] !== entregaInput;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setActiveRowId(activeRowId === item.id ? null : item.id);
                      }}
                      className={`border-b border-slate-800/50 transition-all duration-200 cursor-pointer ${
                        activeRowId === item.id
                          ? "bg-slate-700/60 border-y border-secondary/70 shadow-[inset_0_0_12px_rgba(224,242,254,0.12)]"
                          : "hover:bg-slate-900/30"
                      }`}
                      title="Haz clic para modificar la entrega de esta fila individualmente"
                    >
                      <td className={customTd} style={{ width: isRepartidorSelected ? "20%" : "10%" }}>
                        <span className="text-slate-100">{formatTijuanaOnlyDate(item.created_at)}</span>
                      </td>
                      <td className={customTdEquipo} style={{ width: isRepartidorSelected ? "20%" : "10%" }}>
                        {item.celular ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-100 text-xs font-bold">{item.celular}</span>
                            {item.color_celular && <span className="text-[10px] text-slate-500">{item.color_celular}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      
                      {!isRepartidorSelected && (
                        <>
                          <td className={customTd} style={{ width: "10%" }}>
                            <span className="text-slate-300">{formatCurrency(item.precio_compra)}</span>
                          </td>
                          <td className={customTd} style={{ width: "10%" }}>
                            <span className="text-slate-300">{formatCurrency(costoEquipo)}</span>
                          </td>
                          <td className={customTd} style={{ width: "11%" }}>
                            <span className="text-slate-300">{formatCurrency(-item.pago_inicial)}</span>
                          </td>
                          <td className={customTd} style={{ width: "10%" }}>
                            <span className="text-slate-300">{formatCurrency(-plataformaVal)}</span>
                          </td>
                        </>
                      )}

                      {/* Entrega: limpia de contenedores, destaca con estilo si fue modificada */}
                      <td className={customTd} style={{ width: isRepartidorSelected ? "20%" : "10%" }}>
                        <span className={hasOverride ? "text-secondary font-bold" : "text-slate-300"}>
                          {formatCurrency(isRepartidorSelected ? rowEntrega : -rowEntrega)}
                        </span>
                      </td>

                      <td className={customTd} style={{ width: isRepartidorSelected ? "20%" : "10%" }}>
                        <span className="text-slate-300">
                          {formatCurrency(isRepartidorSelected ? -pagoRecibido : pagoRecibido)}
                        </span>
                      </td>

                      {!isRepartidorSelected && (
                        <td className={customTd} style={{ width: "10%" }}>
                          <span className="text-slate-100 font-bold">{formatCurrency(subTotal)}</span>
                        </td>
                      )}

                      <td className={customTd} style={{ width: isRepartidorSelected ? "20%" : "9%" }}>
                        <span className="text-secondary font-bold">{formatCurrency(comision)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de Resumen de Liquidación */}
      {selectedUserId !== "" && (filteredList.length > 0 || bonoVal > 0 || sueldoVal > 0) && (
        <div className={`${styles.tableContainer} mt-6`}>
          <div className="bg-slate-950 p-4 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-200">Extras y total comisión</h4>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                {isRepartidorSelected ? (
                  <tr>
                    <th className={customTh} colSpan={2} style={{ width: "40%" }}></th>
                    <th className={customTh} style={{ width: "20%" }}>Bono</th>
                    <th className={customTh} style={{ width: "20%" }}>Sueldo</th>
                    <th className={customTh} style={{ width: "20%" }}>Total</th>
                  </tr>
                ) : (
                  <tr>
                    <th className={customTh} style={{ width: "10%" }}></th>
                    <th className={customTh} style={{ width: "10%" }}></th>
                    <th className={customTh} style={{ width: "10%" }}></th>
                    <th className={customTh} style={{ width: "10%" }}></th>
                    <th className={customTh} style={{ width: "11%" }}></th>
                    <th className={customTh} style={{ width: "10%" }}></th>
                    <th className={customTh} style={{ width: "10%" }}>Bono</th>
                    <th className={customTh} style={{ width: "10%" }}>Sueldo</th>
                    <th className={customTh} style={{ width: "10%" }}>Publicidad</th>
                    <th className={customTh} style={{ width: "9%" }}>Total</th>
                  </tr>
                )}
              </thead>
              <tbody>
                <tr className={styles.tr}>
                  {isRepartidorSelected ? (
                    <>
                      <td className={customTd} colSpan={2} style={{ width: "40%" }}></td>
                      <td className={customTd} style={{ width: "20%" }}>
                        <span className="text-slate-300">{formatCurrency(bonoVal)}</span>
                      </td>
                      <td className={customTd} style={{ width: "20%" }}>
                        <span className="text-slate-300">{formatCurrency(sueldoVal)}</span>
                      </td>
                      <td className={customTd} style={{ width: "20%" }}>
                        <span className="text-secondary font-bold">{formatCurrency(totalComision + bonoVal + sueldoVal)}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={customTd} style={{ width: "10%" }}></td>
                      <td className={customTd} style={{ width: "10%" }}></td>
                      <td className={customTd} style={{ width: "10%" }}></td>
                      <td className={customTd} style={{ width: "10%" }}></td>
                      <td className={customTd} style={{ width: "11%" }}></td>
                      <td className={customTd} style={{ width: "10%" }}></td>
                      <td className={customTd} style={{ width: "10%" }}>
                        <span className="text-slate-300">{formatCurrency(bonoVal)}</span>
                      </td>
                      <td className={customTd} style={{ width: "10%" }}>
                        <span className="text-slate-300">{formatCurrency(sueldoVal)}</span>
                      </td>
                      <td className={customTd} style={{ width: "10%" }}>
                        <span className="text-slate-305">{formatCurrency(-publicidadVal)}</span>
                      </td>
                      <td className={customTd} style={{ width: "9%" }}>
                        <span className="text-secondary font-bold">{formatCurrency(totalComision + bonoVal + sueldoVal - publicidadVal)}</span>
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
