'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { ComprobanteRecord, MappedUser } from "@/types/sueldos";
import { exportarReciboPDF } from "./sueldosPdfHelper";
import { calculateTotalComision } from "@/utils/sueldos-calc";
import { SueldosFiltros } from "./sueldos/SueldosFiltros";
import { SueldosTablaOperaciones } from "./sueldos/SueldosTablaOperaciones";
import { SueldosTablaResumen } from "./sueldos/SueldosTablaResumen";

const styles = {
  btnActionSecondary: "flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl hover:bg-secondary/20 transition-all cursor-pointer text-xs md:text-sm font-semibold gap-1.5",
  btnActionRose: "flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/10 disabled:text-slate-500 transition-all cursor-pointer text-xs md:text-sm font-semibold gap-1.5",
  btnLinkHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-750 hover:text-white transition-all cursor-pointer",
  tableContainer: "bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl mt-8",
};

interface CalculadoraSueldosClientPageProps {
  comprobantesList: ComprobanteRecord[];
  usersList: MappedUser[];
}

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

  // Overrides individuales de entrega por fila
  const [rowEntregaOverrides, setRowEntregaOverrides] = useState<{ [id: string]: string }>({});
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
      const tijuanaDateStr = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(item.created_at));

      if (dateFrom && tijuanaDateStr < dateFrom) return false;
      if (dateTo && tijuanaDateStr > dateTo) return false;

      const userMatch = usersList.find(user => user.id === selectedUserId);
      if (userMatch) {
        const isVendedor = item.vendedor?.id === userMatch.id;
        const isCreador = item.creador?.id === userMatch.id;
        const isRepartidor = userMatch.repartidorId && item.repartidor?.id === userMatch.repartidorId;

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
    return calculateTotalComision({
      filteredList,
      isRepartidorSelected: !!isRepartidorSelected,
      rowEntregaOverrides,
      entregaVal,
      plataformaVal,
      comisionPercent
    });
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
          bonoInput={bonoInput}
          setBonoInput={setBonoInput}
          sueldoInput={sueldoInput}
          setSueldoInput={setSueldoInput}
          plataformaVal={plataformaVal}
          entregaVal={entregaVal}
        />

        {/* Tabla de operaciones */}
        <SueldosTablaOperaciones
          isRepartidorSelected={!!isRepartidorSelected}
          filteredList={filteredList}
          selectedUserId={selectedUserId}
          rowEntregaOverrides={rowEntregaOverrides}
          entregaVal={entregaVal}
          plataformaVal={plataformaVal}
          comisionPercent={comisionPercent}
          activeRowId={activeRowId}
          setActiveRowId={setActiveRowId}
        />
      </div>

      {/* Tabla de Resumen de Liquidación */}
      {selectedUserId !== "" && (filteredList.length > 0 || bonoVal > 0 || sueldoVal > 0) && (
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
