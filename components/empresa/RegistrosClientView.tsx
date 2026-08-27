'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type {
  Venta,
  OrdenEntrega,
  Garantia,
  OrdenGarantia,
  PerfilOption,
  RepartidorOption,
  ZonaReparto,
  RegistrosTab
} from "@/types/registros";
import { RegistrosFilters } from "./registros/RegistrosFilters";
import { RegistrosTable } from "./registros/RegistrosTable";

export type { Venta, OrdenEntrega, PerfilOption, RepartidorOption, Garantia, OrdenGarantia, ZonaReparto };

interface RegistrosClientViewProps {
  ventas: Venta[];
  ordenes: OrdenEntrega[];
  garantias: Garantia[];
  ordenesGarantia: OrdenGarantia[];
  vendedores: PerfilOption[];
  repartidores: RepartidorOption[];
  zonasReparto: ZonaReparto[];
}

const ITEMS_PER_PAGE = 20;

export default function RegistrosClientView({
  ventas,
  ordenes,
  garantias,
  ordenesGarantia,
  vendedores,
  repartidores,
  zonasReparto
}: RegistrosClientViewProps) {
  // Estados principales
  const [activeTab, setActiveTab] = useState<RegistrosTab>("ventas");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendedor, setSelectedVendedor] = useState("");
  const [selectedRepartidor, setSelectedRepartidor] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isIOS, setIsIOS] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      const isIOSDevice = /iPhone|iPad|iPod/.test(ua);
      setIsIOS(isIOSDevice);
    }
  }, []);

  // Limpiar filtros al cambiar de pestaña
  const handleTabChange = (tab: RegistrosTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSelectedVendedor("");
    setSelectedRepartidor("");
    setFechaDesde("");
    setFechaHasta("");
    setCurrentPage(1);
  };

  // Limpiar todos los filtros manualmente
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedVendedor("");
    setSelectedRepartidor("");
    setFechaDesde("");
    setFechaHasta("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedVendedor !== "" ||
    selectedRepartidor !== "" ||
    fechaDesde !== "" ||
    fechaHasta !== "";

  const lastPickerOpen = React.useRef(0);

  const handleOpenPicker = (event: React.MouseEvent<HTMLInputElement>) => {
    const now = Date.now();
    if (now - lastPickerOpen.current < 500) return;

    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        lastPickerOpen.current = now;
        (event.currentTarget as HTMLInputElement).showPicker();
      } catch (err) {
        lastPickerOpen.current = 0;
      }
    }
  };

  // Filtrado de Ventas en Memoria
  const filteredVentas = useMemo(() => {
    if (activeTab !== "ventas") return [];

    return ventas.filter((venta) => {
      // 1. Buscador General
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const imeiMatch = venta.imei.toLowerCase().includes(query);
        const marcaMatch = venta.productos?.marca?.toLowerCase().includes(query);
        const modeloMatch = venta.productos?.modelo?.toLowerCase().includes(query);
        const colorMatch = venta.productos?.color?.toLowerCase().includes(query);
        const vendedorMatch = (venta.vendedor?.username || venta.vendedor_nombre || "").toLowerCase().includes(query);
        const repartidorMatch = venta.repartidor?.nombre?.toLowerCase().includes(query);

        if (!imeiMatch && !marcaMatch && !modeloMatch && !colorMatch && !vendedorMatch && !repartidorMatch) {
          return false;
        }
      }

      // 2. Filtro Vendedor
      if (selectedVendedor && venta.vendedor?.id !== selectedVendedor) {
        return false;
      }

      // 3. Filtro Repartidor
      if (selectedRepartidor && venta.repartidor?.id !== selectedRepartidor) {
        return false;
      }

      // 4. Fechas (Filtramos sobre fecha_venta)
      const fechaVenta = new Date(venta.fecha_venta);
      if (fechaDesde) {
        const desde = new Date(`${fechaDesde}T00:00:00`);
        if (fechaVenta < desde) return false;
      }
      if (fechaHasta) {
        const hasta = new Date(`${fechaHasta}T23:59:59`);
        if (fechaVenta > hasta) return false;
      }

      return true;
    });
  }, [activeTab, ventas, searchQuery, selectedVendedor, selectedRepartidor, fechaDesde, fechaHasta]);

  // Filtrado de Órdenes de Entrega en Memoria
  const filteredOrdenes = useMemo(() => {
    if (activeTab !== "ordenes") return [];

    return ordenes.filter((orden) => {
      // 1. Buscador General
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const folioMatch = orden.folio?.toLowerCase().includes(query);
        const clienteMatch = orden.nombre_cliente?.toLowerCase().includes(query);
        const curpMatch = orden.curp?.toLowerCase().includes(query);
        const telefonoMatch = orden.telefono?.toLowerCase().includes(query);
        const celularMatch = orden.celular?.toLowerCase().includes(query);
        const imeiMatch = orden.imei?.toLowerCase().includes(query);
        const vendedorMatch = (orden.vendedor?.username || orden.vendedor_nombre || "").toLowerCase().includes(query);
        const repartidorMatch = (orden.repartidor || orden.repartidores?.nombre || "").toLowerCase().includes(query);

        if (
          !folioMatch && !clienteMatch && !curpMatch && !telefonoMatch &&
          !celularMatch && !imeiMatch && !vendedorMatch && !repartidorMatch
        ) {
          return false;
        }
      }

      // 2. Filtro Vendedor
      if (selectedVendedor && orden.vendedor?.id !== selectedVendedor) {
        return false;
      }

      // 3. Filtro Repartidor
      if (selectedRepartidor && orden.repartidor_id !== selectedRepartidor) {
        return false;
      }

      // 4. Fechas (Filtramos sobre created_at)
      const fechaCreacion = new Date(orden.created_at);
      if (fechaDesde) {
        const desde = new Date(`${fechaDesde}T00:00:00`);
        if (fechaCreacion < desde) return false;
      }
      if (fechaHasta) {
        const hasta = new Date(`${fechaHasta}T23:59:59`);
        if (fechaCreacion > hasta) return false;
      }

      return true;
    });
  }, [activeTab, ordenes, searchQuery, selectedVendedor, selectedRepartidor, fechaDesde, fechaHasta]);

  // Filtrado de Garantías en Memoria
  const filteredGarantias = useMemo(() => {
    if (activeTab !== "garantias") return [];

    return garantias.filter((garantia) => {
      // 1. Buscador General
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const imeiMatch = garantia.imei.toLowerCase().includes(query);
        const marcaMatch = garantia.productos?.marca?.toLowerCase().includes(query);
        const modeloMatch = garantia.productos?.modelo?.toLowerCase().includes(query);
        const colorMatch = garantia.productos?.color?.toLowerCase().includes(query);
        const solicitanteMatch = (garantia.solicitante?.username || garantia.solicitante_nombre || "").toLowerCase().includes(query);
        const repartidorMatch = garantia.repartidor?.nombre?.toLowerCase().includes(query);
        const motivoMatch = garantia.motivo?.toLowerCase().includes(query);

        if (
          !imeiMatch && !marcaMatch && !modeloMatch && !colorMatch &&
          !solicitanteMatch && !repartidorMatch && !motivoMatch
        ) {
          return false;
        }
      }

      // 2. Filtro Solicitante (Vendedor)
      if (selectedVendedor && garantia.solicitante?.id !== selectedVendedor) {
        return false;
      }

      // 3. Filtro Repartidor
      if (selectedRepartidor && garantia.repartidor?.id !== selectedRepartidor) {
        return false;
      }

      // 4. Fechas (Filtramos sobre fecha_garantia)
      const fechaGarantia = new Date(garantia.fecha_garantia);
      if (fechaDesde) {
        const desde = new Date(`${fechaDesde}T00:00:00`);
        if (fechaGarantia < desde) return false;
      }
      if (fechaHasta) {
        const hasta = new Date(`${fechaHasta}T23:59:59`);
        if (fechaGarantia > hasta) return false;
      }

      return true;
    });
  }, [activeTab, garantias, searchQuery, selectedVendedor, selectedRepartidor, fechaDesde, fechaHasta]);

  // Filtrado de Órdenes de Garantía en Memoria
  const filteredOrdenesGarantia = useMemo(() => {
    if (activeTab !== "ordenes_garantia") return [];

    return ordenesGarantia.filter((orden) => {
      // 1. Buscador General
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const folioMatch = orden.folio?.toLowerCase().includes(query);
        const clienteMatch = orden.nombre_cliente?.toLowerCase().includes(query);
        const telefonoMatch = orden.telefono?.toLowerCase().includes(query);
        const imeiMatch = orden.imei?.toLowerCase().includes(query);
        const tagMatch = orden.tag?.toLowerCase().includes(query);
        const modeloMatch = orden.modelo?.toLowerCase().includes(query);
        const motivoMatch = orden.motivo_garantia?.toLowerCase().includes(query);
        const fallaMatch = orden.descripcion_falla?.toLowerCase().includes(query);
        const vendedorMatch = (orden.vendedor?.username || orden.vendedor_nombre || "").toLowerCase().includes(query);

        if (
          !folioMatch && !clienteMatch && !telefonoMatch && !imeiMatch &&
          !tagMatch && !modeloMatch && !motivoMatch && !fallaMatch && !vendedorMatch
        ) {
          return false;
        }
      }

      // 2. Filtro Vendedor
      if (selectedVendedor && orden.vendedor?.id !== selectedVendedor) {
        return false;
      }

      // 3. Filtro Repartidor / Ubicación (relacionando la zona con el repartidor)
      if (selectedRepartidor) {
        const zonasDeRepartidor = zonasReparto
          .filter(zona => zona.repartidor_id === selectedRepartidor)
          .map(zona => zona.nombre_zona.toLowerCase());
        
        if (!zonasDeRepartidor.includes(orden.zona.toLowerCase())) {
          return false;
        }
      }

      // 4. Fechas (Filtramos sobre created_at)
      const fechaCreacion = new Date(orden.created_at);
      if (fechaDesde) {
        const desde = new Date(`${fechaDesde}T00:00:00`);
        if (fechaCreacion < desde) return false;
      }
      if (fechaHasta) {
        const hasta = new Date(`${fechaHasta}T23:59:59`);
        if (fechaCreacion > hasta) return false;
      }

      return true;
    });
  }, [activeTab, ordenesGarantia, searchQuery, selectedVendedor, selectedRepartidor, fechaDesde, fechaHasta, zonasReparto]);

  const activeData = (
    activeTab === "ventas" 
      ? filteredVentas 
      : activeTab === "ordenes" 
        ? filteredOrdenes 
        : activeTab === "garantias"
          ? filteredGarantias
          : filteredOrdenesGarantia
  ) as (Venta | OrdenEntrega | Garantia | OrdenGarantia)[];

  // Lógica de Paginación
  const totalPages = Math.max(1, Math.ceil(activeData.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activeData.slice(start, start + ITEMS_PER_PAGE);
  }, [activeData, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const styles = {
    container: "max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12",
    header: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6",
    title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
    subtitle: "text-slate-500 text-sm",
    btnHome: "flex items-center justify-center p-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer w-fit -translate-y-1.5 sm:translate-y-0",
    tabContainer: "grid grid-cols-2 lg:flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full lg:w-fit gap-1.5 lg:gap-0",
    tabButton: (active: boolean) =>
      `flex flex-col sm:flex-row items-center justify-center text-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none col-span-1 ${
        active
          ? "bg-secondary text-slate-950 shadow-lg shadow-secondary/20"
          : "text-slate-400 hover:text-white"
      }`
  };

  return (
    <div className={styles.container}>
      {/* ENCABEZADO */}
      <header className={styles.header}>
        <div className="w-full sm:w-auto">
          <div className="flex items-center justify-between w-full gap-4">
            <h1 className={styles.title}>Auditoría de Registros</h1>
            <div className="flex sm:hidden items-center gap-3">
              <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
                <span className="material-symbols-outlined text-xl">home</span>
              </Link>
            </div>
          </div>
          <p className={`${styles.subtitle} mt-1`}>Consulta y exportación unificada del historial operativo</p>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      {/* SELECTOR DE PESTAÑA */}
      <div className={styles.tabContainer}>
        <button
          type="button"
          className={styles.tabButton(activeTab === "ventas")}
          onClick={() => handleTabChange("ventas")}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">sell</span>
          Ventas
        </button>
        <button
          type="button"
          className={styles.tabButton(activeTab === "garantias")}
          onClick={() => handleTabChange("garantias")}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">published_with_changes</span>
          Garantías
        </button>
        <button
          type="button"
          className={styles.tabButton(activeTab === "ordenes_garantia")}
          onClick={() => handleTabChange("ordenes_garantia")}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">build_circle</span>
          Órdenes de Garantía
        </button>
        <button
          type="button"
          className={styles.tabButton(activeTab === "ordenes")}
          onClick={() => handleTabChange("ordenes")}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">local_shipping</span>
          Órdenes de Entrega
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <RegistrosFilters
        activeTab={activeTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedVendedor={selectedVendedor}
        setSelectedVendedor={setSelectedVendedor}
        selectedRepartidor={selectedRepartidor}
        setSelectedRepartidor={setSelectedRepartidor}
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        setCurrentPage={setCurrentPage}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        vendedores={vendedores}
        repartidores={repartidores}
        isIOS={isIOS}
        handleOpenPicker={handleOpenPicker}
        activeData={activeData}
      />

      {/* RESULTADOS INFO */}
      <div className="flex justify-between items-center text-slate-400 text-sm font-semibold px-2">
        <span>Mostrando registros: <strong className="text-secondary text-base">{activeData.length}</strong></span>
        <span>Página {currentPage} de {totalPages}</span>
      </div>

      {/* TABLAS DE DATOS Y PAGINACIÓN */}
      <RegistrosTable
        activeTab={activeTab}
        paginatedData={paginatedData}
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
      />
    </div>
  );
}
