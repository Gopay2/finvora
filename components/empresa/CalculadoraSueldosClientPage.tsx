'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { ComprobanteRecord, MappedUser } from "@/types/sueldos";
import { exportarReciboPDF, exportarReciboConsolidadoPDF } from "./sueldosPdfHelper";
import { exportarSueldosExcel, exportarSueldosConsolidadoExcel } from "./sueldosExcelHelper";
import { calculateTotalComision } from "@/utils/sueldos-calc";
import { SueldosFiltros } from "./sueldos/SueldosFiltros";
import { SueldosTablaOperaciones } from "./sueldos/SueldosTablaOperaciones";
import { SueldosTablaResumen } from "./sueldos/SueldosTablaResumen";
import { SueldosTablaConsolidada, EmpleadoConsolidado } from "./sueldos/SueldosTablaConsolidada";

const styles = {
  btnActionSecondary: "flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl hover:bg-secondary/20 transition-all cursor-pointer text-xs md:text-sm font-semibold gap-1.5",
  btnActionEmerald: "flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/10 disabled:text-slate-500 transition-all cursor-pointer text-xs md:text-sm font-semibold gap-1.5",
  btnActionRose: "flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/10 disabled:text-slate-500 transition-all cursor-pointer text-xs md:text-sm font-semibold gap-1.5",
  btnLinkHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-750 hover:text-white transition-all cursor-pointer",
  tableContainer: "bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl mt-8",
};

interface CalculadoraSueldosClientPageProps {
  comprobantesList: ComprobanteRecord[];
  usersList: MappedUser[];
}

// Formateador estático único para evitar crear miles de instancias de Intl en cada render
const tijuanaFormatter = new Intl.DateTimeFormat('fr-CA', {
  timeZone: 'America/Tijuana',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export default function CalculadoraSueldosClientPage({
  comprobantesList,
  usersList
}: CalculadoraSueldosClientPageProps) {
  // Estado para filtros
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [plataformaInput, setPlataformaInput] = useState<string>("500");
  const [entregaInput, setEntregaInput] = useState<string>("500");
  const [comisionPercent, setComisionPercent] = useState<number>(50);
  const [bonoInput, setBonoInput] = useState<string>("0");
  const [sueldoInput, setSueldoInput] = useState<string>("0");
  const [publicidadInput, setPublicidadInput] = useState<string>("0");
  const [cancelacionesInput, setCancelacionesInput] = useState<string>("0");
  const [recoleccionInput, setRecoleccionInput] = useState<string>("0");
  const [garantiasInput, setGarantiasInput] = useState<string>("0");

  // Overrides individuales de entrega por fila
  const [rowEntregaOverrides, setRowEntregaOverrides] = useState<{ [id: string]: string }>({});
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const isTodosSelected = selectedUserId === "todos";

  const selectedUser = useMemo(() => {
    if (isTodosSelected) return undefined;
    return usersList.find((user) => user.id === selectedUserId);
  }, [usersList, selectedUserId, isTodosSelected]);

  const isRepartidorSelected = selectedUser?.role?.toLowerCase() === "repartidor";

  const plataformaVal = isRepartidorSelected ? 0 : (Number(plataformaInput) || 0);
  const entregaVal = Number(entregaInput) || 0;
  const bonoVal = Number(bonoInput) || 0;
  const sueldoVal = Number(sueldoInput) || 0;
  const publicidadVal = isRepartidorSelected ? 0 : (Number(publicidadInput) || 0);
  const cancelacionesCount = isRepartidorSelected ? (Number(cancelacionesInput) || 0) : 0;
  const recoleccionCount = isRepartidorSelected ? (Number(recoleccionInput) || 0) : 0;
  const garantiasCount = isRepartidorSelected ? (Number(garantiasInput) || 0) : 0;

  // Pre-indexación en memoria de comprobantes (fechas y valores numéricos calculados una sola vez)
  const indexedComprobantes = useMemo(() => {
    return comprobantesList.map((item) => {
      let tijuanaDate = "";
      try {
        tijuanaDate = tijuanaFormatter.format(new Date(item.created_at));
      } catch {
        tijuanaDate = item.created_at ? item.created_at.slice(0, 10) : "";
      }

      return {
        raw: item,
        tijuanaDate,
        vendedorId: item.vendedor?.id,
        creadorId: item.creador?.id,
        repartidorId: item.repartidor?.id,
        pagoRecibido: Number(item.pago_recibido) || 0,
        costoEquipo: Number(item.costo_equipo) || 0,
        precioCompra: Number(item.precio_compra) || 0,
        pagoInicial: Number(item.pago_inicial) || 0,
      };
    });
  }, [comprobantesList]);

  // Filtrado reactivo ultra-rápido en una sola pasada para un empleado individual
  const filteredList = useMemo(() => {
    if (!selectedUserId || isTodosSelected) return [];

    const userMatch = usersList.find((u) => u.id === selectedUserId);
    if (!userMatch) return [];

    const isRepartidor = Boolean(userMatch.repartidorId);
    const repId = userMatch.repartidorId;
    const uId = userMatch.id;

    const result: ComprobanteRecord[] = [];
    for (let i = 0; i < indexedComprobantes.length; i++) {
      const item = indexedComprobantes[i];
      if (dateFrom && item.tijuanaDate < dateFrom) continue;
      if (dateTo && item.tijuanaDate > dateTo) continue;

      if (isRepartidor) {
        if (item.repartidorId === repId) {
          result.push(item.raw);
        }
      } else {
        if (item.vendedorId === uId || item.creadorId === uId) {
          result.push(item.raw);
        }
      }
    }
    return result;
  }, [indexedComprobantes, usersList, dateFrom, dateTo, selectedUserId, isTodosSelected]);

  const hasDateFilter = Boolean(dateFrom || dateTo);

  // Lista consolidada ultra-rápida en una sola pasada O(N) (tiempo de cálculo < 1ms)
  const consolidatedList = useMemo<EmpleadoConsolidado[]>(() => {
    if (!isTodosSelected || !hasDateFilter) return [];

    const stats: Record<string, { count: number; total: number }> = {};
    const repartidorToUserId: Record<string, string> = {};
    const userRoleMap: Record<string, { isRepartidor: boolean }> = {};

    usersList.forEach((user) => {
      stats[user.id] = { count: 0, total: 0 };
      const isRep = user.role?.toLowerCase() === "repartidor";
      userRoleMap[user.id] = { isRepartidor: isRep };
      if (user.repartidorId) {
        repartidorToUserId[user.repartidorId] = user.id;
      }
    });

    for (let i = 0; i < indexedComprobantes.length; i++) {
      const item = indexedComprobantes[i];
      if (dateFrom && item.tijuanaDate < dateFrom) continue;
      if (dateTo && item.tijuanaDate > dateTo) continue;

      // 1. Repartidor
      if (item.repartidorId && repartidorToUserId[item.repartidorId]) {
        const repUserId = repartidorToUserId[item.repartidorId];
        const s = stats[repUserId];
        if (s) {
          s.count += 1;
          s.total += (500 - item.pagoRecibido);
        }
      }

      // 2. Vendedor / Creador
      const sellerId = item.vendedorId || item.creadorId;
      if (sellerId && stats[sellerId] && !userRoleMap[sellerId]?.isRepartidor) {
        const s = stats[sellerId];
        s.count += 1;
        const subTotal = item.precioCompra - item.costoEquipo - item.pagoInicial - 500 - 500 + item.pagoRecibido;
        s.total += subTotal * 0.5;
      }
    }

    return usersList.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role || "Sin Rol",
      operacionesCount: stats[user.id]?.count || 0,
      totalPagar: Math.round((stats[user.id]?.total || 0) * 100) / 100,
    }));
  }, [isTodosSelected, hasDateFilter, usersList, indexedComprobantes, dateFrom, dateTo]);

  const totalOperacionesConsolidado = useMemo(() => {
    return consolidatedList.reduce((acc, curr) => acc + curr.operacionesCount, 0);
  }, [consolidatedList]);

  const granTotalConsolidado = useMemo(() => {
    return consolidatedList.reduce((acc, curr) => acc + curr.totalPagar, 0);
  }, [consolidatedList]);

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
    setCancelacionesInput("0");
    setRecoleccionInput("0");
    setGarantiasInput("0");
    setRowEntregaOverrides({});
    setActiveRowId(null);
  };

  const totalComision = useMemo(() => {
    if (isTodosSelected) return 0;
    return calculateTotalComision({
      filteredList,
      isRepartidorSelected: !!isRepartidorSelected,
      rowEntregaOverrides,
      entregaVal,
      plataformaVal,
      comisionPercent,
      cancelacionesCount,
      recoleccionCount,
      garantiasCount
    });
  }, [filteredList, plataformaVal, entregaVal, comisionPercent, isRepartidorSelected, rowEntregaOverrides, cancelacionesCount, recoleccionCount, garantiasCount, isTodosSelected]);

  const hasOperations = isTodosSelected
    ? (hasDateFilter && totalOperacionesConsolidado > 0)
    : (filteredList.length > 0 || bonoVal > 0 || sueldoVal > 0 || cancelacionesCount > 0 || recoleccionCount > 0 || garantiasCount > 0);

  const handleDownloadPDF = async () => {
    if (!hasOperations) return;

    if (isTodosSelected) {
      await exportarReciboConsolidadoPDF({
        empleados: consolidatedList,
        totalOperaciones: totalOperacionesConsolidado,
        granTotalPagar: granTotalConsolidado,
        periodo: {
          desde: dateFrom,
          hasta: dateTo
        }
      });
      return;
    }

    if (!selectedUser) return;
    await exportarReciboPDF({
      empleado: selectedUser,
      operaciones: filteredList,
      config: {
        plataformaVal,
        entregaVal,
        comisionPercent,
        bonoVal,
        sueldoVal,
        publicidadVal,
        cancelacionesCount,
        recoleccionCount,
        garantiasCount,
        rowEntregaOverrides
      },
      periodo: {
        desde: dateFrom,
        hasta: dateTo
      },
      totalComision
    });
  };

  const handleDownloadExcel = () => {
    if (!hasOperations) return;

    if (isTodosSelected) {
      exportarSueldosConsolidadoExcel({
        empleados: consolidatedList,
        totalOperaciones: totalOperacionesConsolidado,
        granTotalPagar: granTotalConsolidado,
        periodo: {
          desde: dateFrom,
          hasta: dateTo
        }
      });
      return;
    }

    if (!selectedUser) return;
    exportarSueldosExcel({
      empleado: selectedUser,
      operaciones: filteredList,
      config: {
        plataformaVal,
        entregaVal,
        comisionPercent,
        bonoVal,
        sueldoVal,
        publicidadVal,
        cancelacionesCount,
        recoleccionCount,
        garantiasCount,
        rowEntregaOverrides
      },
      totalComision
    });
  };

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

      {/* Contenedor principal de liquidación */}
      <div className={styles.tableContainer}>
        {/* Header de la Tabla */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {isTodosSelected ? "Liquidación Consolidada de Empleados" : "Operaciones del Período"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isTodosSelected
                ? "Resumen de operaciones y total acumulado a liquidar por cada empleado."
                : "Lista de ventas y comisiones del empleado seleccionado."}
            </p>
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
              onClick={handleDownloadExcel}
              disabled={!selectedUserId || !hasOperations}
              className={styles.btnActionEmerald}
              title="Descargar Tabla en Excel"
              suppressHydrationWarning
            >
              <span className="material-symbols-outlined text-base md:text-xl">table_view</span>
              Descargar Excel
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={!selectedUserId || !hasOperations}
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
        <SueldosFiltros
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          usersList={usersList}
          comisionPercent={comisionPercent}
          setComisionPercent={setComisionPercent}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          handleClearFilters={handleClearFilters}
          isRepartidorSelected={!!isRepartidorSelected}
          plataformaInput={plataformaInput}
          setPlataformaInput={setPlataformaInput}
          entregaInput={entregaInput}
          setEntregaInput={setEntregaInput}
          activeRowId={activeRowId}
          rowEntregaOverrides={rowEntregaOverrides}
          setRowEntregaOverrides={setRowEntregaOverrides}
          publicidadInput={publicidadInput}
          setPublicidadInput={setPublicidadInput}
          cancelacionesInput={cancelacionesInput}
          setCancelacionesInput={setCancelacionesInput}
          recoleccionInput={recoleccionInput}
          setRecoleccionInput={setRecoleccionInput}
          garantiasInput={garantiasInput}
          setGarantiasInput={setGarantiasInput}
          bonoInput={bonoInput}
          setBonoInput={setBonoInput}
          sueldoInput={sueldoInput}
          setSueldoInput={setSueldoInput}
          plataformaVal={plataformaVal}
          entregaVal={entregaVal}
        />

        {/* Renderizado de Tabla: Consolidada vs Individual */}
        {isTodosSelected ? (
          <SueldosTablaConsolidada
            empleados={consolidatedList}
            totalOperaciones={totalOperacionesConsolidado}
            granTotalPagar={granTotalConsolidado}
            hasDateFilter={hasDateFilter}
            onSelectEmpleado={(id) => setSelectedUserId(id)}
          />
        ) : selectedUserId !== "" ? (
          <SueldosTablaOperaciones
            isRepartidorSelected={!!isRepartidorSelected}
            filteredList={filteredList}
            selectedUserId={selectedUserId}
            rowEntregaOverrides={rowEntregaOverrides}
            entregaVal={entregaVal}
            plataformaVal={plataformaVal}
            comisionPercent={comisionPercent}
            cancelacionesCount={cancelacionesCount}
            recoleccionCount={recoleccionCount}
            garantiasCount={garantiasCount}
            activeRowId={activeRowId}
            setActiveRowId={setActiveRowId}
          />
        ) : (
          <div className="py-16 text-center text-slate-500 text-sm">
            Selecciona un empleado o la opción <span className="text-secondary font-semibold">"Todos"</span> para consultar las liquidaciones.
          </div>
        )}
      </div>

      {/* Tabla de Resumen de Liquidación (solo en vista individual) */}
      {!isTodosSelected && selectedUserId !== "" && hasOperations && (
        <SueldosTablaResumen
          isRepartidorSelected={!!isRepartidorSelected}
          bonoVal={bonoVal}
          sueldoVal={sueldoVal}
          publicidadVal={publicidadVal}
          totalComision={totalComision}
        />
      )}
    </div>
  );
}

