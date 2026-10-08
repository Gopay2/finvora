'use client';

// ─── Grupo 1: React y Next.js ───────────────────────────────────────────────
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Grupo 2: Librerías Externas ───────────────────────────────────────────
import * as XLSX from 'xlsx';

// ─── Grupo 3: Componentes Internos ──────────────────────────────────────────
import { DetalleEquiposFilters } from './DetalleEquiposFilters';
import { DetalleEquiposTable } from './DetalleEquiposTable';

// ─── Grupo 4: Tipos e Interfaces ────────────────────────────────────────────
import type {
  StockConcesionItem,
  VentaItem,
  RepartidorOption,
  PerfilOption,
  DetalleEquiposTab,
} from '@/types/detalle-equipos-jci';

interface DetalleEquiposClientViewProps {
  equiposConcesion: StockConcesionItem[];
  ventasConcesion: VentaItem[];
  ventasCredito: VentaItem[];
  repartidores: RepartidorOption[];
  vendedores: PerfilOption[];
}

const ITEMS_PER_PAGE = 20;

// Formateador de fechas para celdas de exportación a Excel
const tijuanaDateFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Tijuana',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatearFechaExcel(fechaIso: string): string {
  try {
    return tijuanaDateFormatter.format(new Date(fechaIso));
  } catch {
    return '—';
  }
}

/**
 * Vista cliente principal de Detalle de Equipos.
 * Gestiona el estado de pestañas, búsqueda global, filtros contextuales, paginación y exportación XLSX.
 */
export default function DetalleEquiposClientView({
  equiposConcesion,
  ventasConcesion,
  ventasCredito,
  repartidores,
  vendedores,
}: DetalleEquiposClientViewProps) {
  // Estado de pestañas (3 pestañas activas)
  const [activeTab, setActiveTab] = useState<DetalleEquiposTab>('concesion');

  // Filtros reactivos
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUbicacion, setSelectedUbicacion] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      const isIOSDevice = /iPhone|iPad|iPod/.test(userAgent);
      setIsIOS(isIOSDevice);
    }
  }, []);

  const lastPickerOpen = useRef(0);
  const handleOpenPicker = (event: React.MouseEvent<HTMLInputElement>) => {
    const now = Date.now();
    if (now - lastPickerOpen.current < 500) return;

    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        lastPickerOpen.current = now;
        (event.currentTarget as HTMLInputElement).showPicker();
      } catch {
        lastPickerOpen.current = 0;
      }
    }
  };

  const handleTabChange = (tab: DetalleEquiposTab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSelectedUbicacion('');
    setSelectedVendedor('');
    setFechaDesde('');
    setFechaHasta('');
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedUbicacion('');
    setSelectedVendedor('');
    setFechaDesde('');
    setFechaHasta('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedUbicacion !== '' ||
    selectedVendedor !== '' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  // Filtrado de Datos en Memoria según el Tab Activo
  const filteredData = useMemo(() => {
    // 1. Pestaña: Concesión (Stock Físico)
    if (activeTab === 'concesion') {
      return equiposConcesion.filter((equipoStock) => {
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim();
          const imeiMatch = equipoStock.imei.toLowerCase().includes(query);
          const marcaMatch = (equipoStock.productos?.marca || '').toLowerCase().includes(query);
          const modeloMatch = (equipoStock.productos?.modelo || '').toLowerCase().includes(query);
          const colorMatch = (equipoStock.productos?.color || '').toLowerCase().includes(query);
          const ubicacionMatch = (equipoStock.repartidores?.nombre || '').toLowerCase().includes(query);

          if (!imeiMatch && !marcaMatch && !modeloMatch && !colorMatch && !ubicacionMatch) {
            return false;
          }
        }

        if (selectedUbicacion && equipoStock.zona !== selectedUbicacion) {
          return false;
        }

        if (fechaDesde || fechaHasta) {
          const fechaIngreso = new Date(equipoStock.fecha_ingreso);
          if (fechaDesde) {
            const desde = new Date(`${fechaDesde}T00:00:00`);
            if (fechaIngreso < desde) return false;
          }
          if (fechaHasta) {
            const hasta = new Date(`${fechaHasta}T23:59:59`);
            if (fechaIngreso > hasta) return false;
          }
        }

        return true;
      });
    }

    // Dataset para pestañas de ventas (concesión o crédito)
    const datasetVentas = activeTab === 'vendidos_concesion' ? ventasConcesion : ventasCredito;

    return datasetVentas.filter((ventaItem) => {
      // Buscador General (IMEI, Marca, Modelo, Color, Vendedor)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const imeiMatch = ventaItem.imei.toLowerCase().includes(query);
        const marcaMatch = (ventaItem.productos?.marca || '').toLowerCase().includes(query);
        const modeloMatch = (ventaItem.productos?.modelo || '').toLowerCase().includes(query);
        const colorMatch = (ventaItem.productos?.color || '').toLowerCase().includes(query);
        const vendedorMatch = (
          ventaItem.vendedor?.username ||
          ventaItem.vendedor_nombre ||
          ''
        ).toLowerCase().includes(query);

        if (!imeiMatch && !marcaMatch && !modeloMatch && !colorMatch && !vendedorMatch) {
          return false;
        }
      }

      // Filtro Vendedor
      if (selectedVendedor && ventaItem.vendedor_id !== selectedVendedor && ventaItem.vendedor?.id !== selectedVendedor) {
        return false;
      }

      // Filtro Repartidor / Ubicación
      if (selectedUbicacion && ventaItem.zona !== selectedUbicacion) {
        return false;
      }

      // Rango de Fechas sobre fecha_venta (Salida)
      if (fechaDesde || fechaHasta) {
        const fechaVenta = new Date(ventaItem.fecha_venta);
        if (fechaDesde) {
          const desde = new Date(`${fechaDesde}T00:00:00`);
          if (fechaVenta < desde) return false;
        }
        if (fechaHasta) {
          const hasta = new Date(`${fechaHasta}T23:59:59`);
          if (fechaVenta > hasta) return false;
        }
      }

      return true;
    });
  }, [
    activeTab,
    equiposConcesion,
    ventasConcesion,
    ventasCredito,
    searchQuery,
    selectedUbicacion,
    selectedVendedor,
    fechaDesde,
    fechaHasta,
  ]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Exportar Excel adaptado al tab activo
  const handleExportExcel = () => {
    if (!filteredData || filteredData.length === 0) return;

    if (activeTab === 'concesion') {
      const worksheetData = (filteredData as StockConcesionItem[]).map((equipoStock) => ({
        Modelo: `${equipoStock.productos?.marca || ''} ${equipoStock.productos?.modelo || ''}`.trim(),
        Color: equipoStock.productos?.color || '—',
        RAM: equipoStock.productos?.ram || '—',
        Almacenamiento: equipoStock.productos?.almacenamiento || '—',
        IMEI: equipoStock.imei,
        'Fecha Ingreso': formatearFechaExcel(equipoStock.fecha_ingreso),
        Ubicación: equipoStock.repartidores?.nombre || 'Sin Asignar',
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Concesión');

      const fileName = `Detalle_Concesion_Finvora_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else {
      const worksheetData = (filteredData as VentaItem[]).map((ventaItem) => ({
        Modelo: `${ventaItem.productos?.marca || ''} ${ventaItem.productos?.modelo || ''}`.trim(),
        Color: ventaItem.productos?.color || '—',
        RAM: ventaItem.productos?.ram || '—',
        Almacenamiento: ventaItem.productos?.almacenamiento || '—',
        IMEI: ventaItem.imei,
        'Fecha Entrada': formatearFechaExcel(ventaItem.fecha_ingreso),
        'Fecha Salida': formatearFechaExcel(ventaItem.fecha_venta),
        Vendedor: ventaItem.vendedor?.username || ventaItem.vendedor_nombre || 'Desconocido',
      }));

      const sheetName = activeTab === 'vendidos_concesion' ? 'Vendidos Concesión' : 'Vendidos Crédito';
      const filePrefix = activeTab === 'vendidos_concesion' ? 'Detalle_Vendidos_Concesion' : 'Detalle_Vendidos_Credito';

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const fileName = `${filePrefix}_Finvora_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }
  };


  const styles = {
    container: 'max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12',
    header: 'flex flex-col gap-2 sm:gap-4 border-b border-slate-800/80 pb-5 sm:pb-6',
    title: 'text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent',
    subtitle: 'text-slate-500 text-sm mt-0.5',
    btnBack: 'text-slate-400 hover:text-slate-200 flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer shrink-0',
    tabContainer: 'grid grid-cols-1 md:flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full md:w-fit gap-1.5 md:gap-0',
    tabButton: (active: boolean) =>
      `flex flex-row items-center justify-center text-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
        active
          ? 'bg-secondary text-slate-950 shadow-lg shadow-secondary/20'
          : 'text-slate-400 hover:text-white'
      }`,
  };

  return (
    <div className={styles.container}>
      {/* ─── ENCABEZADO ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        {/* Botón Volver en Celular (Arriba del título, alineado a la derecha) */}
        <div className="flex sm:hidden justify-end w-full">
          <Link
            href="/empresa/webapp/inventario/jci"
            className={styles.btnBack}
            title="Volver al panel JCI"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Volver</span>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className={styles.title}>Detalle de Equipos</h1>
            <p className={styles.subtitle}>
              Auditoría y consulta de unidades en stock y vendidas
            </p>
          </div>

          {/* Botón Volver en Escritorio (Alineado a la derecha del título) */}
          <div className="hidden sm:flex items-center shrink-0">
            <Link
              href="/empresa/webapp/inventario/jci"
              className={styles.btnBack}
              title="Volver al panel JCI"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Volver</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── SELECTOR DE PESTAÑAS ─────────────────────────────────────────── */}
      <div className={styles.tabContainer}>
        {/* Tab 1: Equipos en stock a concesión */}
        <button
          type="button"
          onClick={() => handleTabChange('concesion')}
          className={styles.tabButton(activeTab === 'concesion')}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">handshake</span>
          <span>Equipos en stock a concesión</span>
        </button>

        {/* Tab 2: Equipos vendidos a concesión */}
        <button
          type="button"
          onClick={() => handleTabChange('vendidos_concesion')}
          className={styles.tabButton(activeTab === 'vendidos_concesion')}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">sell</span>
          <span>Equipos vendidos a concesión</span>
        </button>

        {/* Tab 3: Equipos vendidos a crédito */}
        <button
          type="button"
          onClick={() => handleTabChange('vendidos_credito')}
          className={styles.tabButton(activeTab === 'vendidos_credito')}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">credit_card</span>
          <span>Equipos vendidos a crédito</span>
        </button>
      </div>

      {/* ─── FILTROS Y BÚSQUEDA CONTEXTUAL ──────────────────────────────────── */}
      <DetalleEquiposFilters
        activeTab={activeTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedUbicacion={selectedUbicacion}
        setSelectedUbicacion={setSelectedUbicacion}
        selectedVendedor={selectedVendedor}
        setSelectedVendedor={setSelectedVendedor}
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        setCurrentPage={setCurrentPage}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        repartidores={repartidores}
        vendedores={vendedores}
        isIOS={isIOS}
        handleOpenPicker={handleOpenPicker}
        onExportExcel={handleExportExcel}
        hasDataToExport={filteredData.length > 0}
      />

      {/* ─── RESULTADOS INFO ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center text-slate-400 text-sm font-semibold px-2">
        <span>
          Mostrando registros: <strong className="text-secondary text-base">{filteredData.length}</strong>
        </span>
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>

      {/* ─── TABLA DE DATOS ──────────────────────────────────────────────────── */}
      <DetalleEquiposTable
        activeTab={activeTab}
        paginatedData={paginatedData}
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
      />
    </div>
  );
}
