'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";

// Interfaces de tipos
interface Venta {
  id: string;
  imei: string;
  precio_costo: number;
  fecha_ingreso: string;
  fecha_venta: string;
  repartidor?: {
    id: string;
    nombre: string;
  };
  productos?: {
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
    ram: string;
  };
  vendedor?: {
    id: string;
    username: string;
  };
}

interface OrdenEntrega {
  id: string;
  folio: string;
  consecutivo: number;
  nombre_cliente: string;
  identificacion_fisica?: string;
  curp?: string;
  telefono: string;
  direccion: string;
  enganche?: number;
  celular: string;
  color_celular: string;
  imei?: string;
  cuenta_activa?: string;
  cliente_historial?: string;
  zona: string;
  repartidor?: string;
  repartidor_id?: string;
  especificar_local?: string;
  fecha_entrega?: string;
  hora_entrega?: string;
  comentarios?: string;
  created_at: string;
  vendedor?: {
    id: string;
    username: string;
  };
  repartidores?: {
    id: string;
    nombre: string;
  };
}

interface PerfilOption {
  id: string;
  username: string;
}

interface RepartidorOption {
  id: string;
  nombre: string;
}

interface RegistrosClientViewProps {
  ventas: Venta[];
  ordenes: OrdenEntrega[];
  vendedores: PerfilOption[];
  repartidores: RepartidorOption[];
}

const ITEMS_PER_PAGE = 20;

export default function RegistrosClientView({
  ventas,
  ordenes,
  vendedores,
  repartidores
}: RegistrosClientViewProps) {
  // Estados principales
  const [activeTab, setActiveTab] = useState<"ventas" | "ordenes">("ventas");
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
  const handleTabChange = (tab: "ventas" | "ordenes") => {
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
        (event.currentTarget as any).showPicker();
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
        const vendedorMatch = venta.vendedor?.username?.toLowerCase().includes(query);
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
        const vendedorMatch = orden.vendedor?.username?.toLowerCase().includes(query);
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

  const activeData = (activeTab === "ventas" ? filteredVentas : filteredOrdenes) as any[];

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
    titleGroup: "space-y-1",
    title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
    subtitle: "text-slate-500 text-sm",
    btnHome: "flex items-center justify-center p-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer w-fit",

    // Tabs
    tabContainer: "flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-fit",
    tabButton: (active: boolean) =>
      `flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${active
        ? "bg-secondary text-slate-950 shadow-lg shadow-secondary/20"
        : "text-slate-400 hover:text-white"
      }`,

    // Filtros Grid
    filtersGrid: "bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-end",
    filterGroup: "flex flex-col gap-1.5",
    label: "text-[10px] uppercase tracking-wider text-slate-400 font-bold",
    input: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary/40 transition-all",
    select: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary/40 transition-all appearance-none cursor-pointer",

    // Tabla wrapper
    tableWrapper: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl",
    table: "w-full text-center border-collapse",
    th: "px-6 py-4 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-800 text-center",
    td: "px-6 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-center",
    tr: "hover:bg-slate-800/20 transition-colors",

    // Badges y utilidades
    imeiBadge: "font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-secondary text-xs font-bold",
    folioBadge: "font-mono bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800 text-blue-400 text-[12px] font-black uppercase tracking-wider whitespace-nowrap",
    zonaBadge: "inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap",
    userBadge: "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700 whitespace-nowrap",
    resetBtn: "flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition-all cursor-pointer",

    // Paginación
    pagination: "flex items-center justify-between border-t border-slate-800/60 px-6 py-4",
    pBtn: (disabled: boolean) =>
      `px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold transition-all ${disabled
        ? "opacity-30 cursor-not-allowed text-slate-500"
        : "hover:bg-slate-700 hover:text-white cursor-pointer"
      }`
  };

  return (
    <div className={styles.container}>
      {/* ENCABEZADO */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Auditoría de Registros</h1>
          <p className={styles.subtitle}>Consulta y exportación unificada del historial operativo</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      {/* SELECTOR DE PESTAÑA */}
      <div className={styles.tabContainer}>
        <div
          className={styles.tabButton(activeTab === "ventas")}
          onClick={() => handleTabChange("ventas")}
        >
          <span className="material-symbols-outlined text-lg">sell</span>
          Ventas
        </div>
        <div
          className={styles.tabButton(activeTab === "ordenes")}
          onClick={() => handleTabChange("ordenes")}
        >
          <span className="material-symbols-outlined text-lg">local_shipping</span>
          Órdenes de Entrega
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl space-y-4">
        {/* Fila Superior: 3 Filtros principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Buscador */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Buscador General</label>
            <input
              type="text"
              placeholder={activeTab === "ventas" ? "Buscar por IMEI, modelo..." : "Buscar folio, cliente, IMEI..."}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={styles.input}
              suppressHydrationWarning
            />
          </div>

          {/* 2. Vendedor */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Vendedor</label>
            <select
              value={selectedVendedor}
              onChange={(e) => { setSelectedVendedor(e.target.value); setCurrentPage(1); }}
              className={styles.select}
              suppressHydrationWarning
            >
              <option value="">Todos</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.username}</option>
              ))}
            </select>
          </div>

          {/* 3. Repartidor */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Repartidor</label>
            <select
              value={selectedRepartidor}
              onChange={(e) => { setSelectedRepartidor(e.target.value); setCurrentPage(1); }}
              className={styles.select}
              suppressHydrationWarning
            >
              <option value="">Todos</option>
              {repartidores.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila Inferior: Filtros de fecha y botones de acción */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Desde */}
          <div className={`col-span-1 md:col-span-4 ${styles.filterGroup}`}>
            <label className={styles.label}>Desde</label>
            <div className="relative flex items-center w-full">
              <span className="absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base">calendar_today</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setCurrentPage(1); }}
                onClick={handleOpenPicker}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-4 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary/40 transition-all [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                style={{ paddingLeft: "48px" }}
                suppressHydrationWarning
              />
              {!fechaDesde && isIOS && (
                <span
                  className="absolute text-slate-500 text-base md:text-sm pointer-events-none select-none"
                  style={{ left: "48px" }}
                >
                  dd/mm/aaaa
                </span>
              )}
            </div>
          </div>

          {/* Hasta */}
          <div className={`col-span-1 md:col-span-4 ${styles.filterGroup}`}>
            <label className={styles.label}>Hasta</label>
            <div className="relative flex items-center w-full">
              <span className="absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base">calendar_today</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setCurrentPage(1); }}
                onClick={handleOpenPicker}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-4 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary/40 transition-all [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                style={{ paddingLeft: "48px" }}
                suppressHydrationWarning
              />
              {!fechaHasta && isIOS && (
                <span
                  className="absolute text-slate-500 text-base md:text-sm pointer-events-none select-none"
                  style={{ left: "48px" }}
                >
                  dd/mm/aaaa
                </span>
              )}
            </div>
          </div>

          {/* Botones de Acción (Esquina inferior derecha) */}
          <div className="col-span-1 md:col-span-4 h-[42px] flex items-center justify-end gap-3">
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={`${styles.resetBtn} flex-initial h-full flex items-center justify-center gap-2 transition-all duration-300 ${hasActiveFilters
                ? "opacity-100 cursor-pointer"
                : "opacity-0 pointer-events-none"
                }`}
              title="Limpiar filtros"
            >
              <span className="material-symbols-outlined text-base">filter_alt_off</span>
              <span>Limpiar Filtros</span>
            </button>
            <DownloadExcelButton
              data={activeData}
              type={activeTab === "ventas" ? "ventas" : "ordenes_entrega"}
            />
          </div>
        </div>
      </div>

      {/* RESULTADOS INFO */}
      <div className="flex justify-between items-center text-slate-400 text-sm font-semibold px-2">
        <span>Mostrando registros: <strong className="text-secondary text-base">{activeData.length}</strong></span>
        <span>Página {currentPage} de {totalPages}</span>
      </div>

      {/* TABLAS DE DATOS */}
      <div className={styles.tableWrapper}>
        <div className="overflow-x-auto custom-scrollbar">
          {activeTab === "ventas" ? (
            /* TABLA DE VENTAS */
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>IMEI</th>
                  <th className={`${styles.th} w-56 min-w-[200px]`}>Producto</th>
                  <th className={`${styles.th} w-28 min-w-[90px]`}>Vendedor</th>
                  <th className={styles.th}>Repartidor / Ubicación</th>
                  <th className={styles.th}>Costo</th>
                  <th className={`${styles.th} w-32 min-w-[120px] whitespace-nowrap`}>Fecha Venta</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  (paginatedData as Venta[]).map((venta) => (
                    <tr key={venta.id} className={styles.tr}>
                      <td className={styles.td}>
                        <span className={styles.imeiBadge}>{venta.imei}</span>
                      </td>
                      <td className={styles.td}>
                        <div className="flex flex-col items-center">
                          <div className="font-bold text-white flex items-center gap-2 justify-center">
                            {venta.productos?.marca} {venta.productos?.modelo}
                            <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-2 ml-1">
                              {venta.productos?.color}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 justify-center text-[10px] text-slate-400 font-bold bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800/60 mt-1">
                            <span>RAM {venta.productos?.ram}</span>
                            <span>•</span>
                            <span>ALM {venta.productos?.almacenamiento}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.userBadge}>
                          <span className="material-symbols-outlined text-[10px]">person</span>
                          {venta.vendedor?.username || "Desconocido"}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.zonaBadge}>
                          {venta.repartidor?.nombre || "Sin Asignar"}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className="text-secondary font-mono font-bold">
                          ${new Intl.NumberFormat("es-AR").format(venta.precio_costo)}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-300 font-medium">
                            {new Date(venta.fecha_venta).toLocaleDateString("es-MX", {
                              timeZone: "America/Tijuana",
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                          <span className="text-slate-500 text-[10px] uppercase">
                            {new Date(venta.fecha_venta).toLocaleTimeString("es-MX", {
                              timeZone: "America/Tijuana",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                      No se encontraron ventas con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* TABLA DE ÓRDENES DE ENTREGA */
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.th} w-44 min-w-[170px] whitespace-nowrap`}>Folio</th>
                  <th className={`${styles.th} w-32`}>Cliente / Teléfono</th>
                  <th className={`${styles.th} w-36`}>Celular</th>
                  <th className={`${styles.th} w-20`}>Vendedor</th>
                  <th className={`${styles.th} w-28`}>Zona / Repartidor</th>
                  <th className={`${styles.th} w-28`}>Entrega programada</th>
                  <th className={`${styles.th} w-20`}>Creada</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  (paginatedData as OrdenEntrega[]).map((orden) => (
                    <tr key={orden.id} className={styles.tr}>
                      <td className={styles.td}>
                        <span className={styles.folioBadge}>{orden.folio}</span>
                      </td>
                      <td className={styles.td}>
                        <div className="flex flex-col items-center">
                          <div className="font-bold text-white">{orden.nombre_cliente}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{orden.telefono}</div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className="flex flex-col items-center">
                          <div className="font-bold text-white">{orden.celular}</div>
                          <div className="text-[10px] text-slate-500 uppercase mt-0.5">{orden.color_celular}</div>
                          {orden.imei && (
                            <span className="mt-1 text-[9px] bg-slate-950 text-slate-400 px-1 py-0.5 rounded font-mono border border-slate-800">
                              IMEI: {orden.imei}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className={styles.td}>
                        <div className={styles.userBadge}>
                          <span className="material-symbols-outlined text-[10px]">person</span>
                          {orden.vendedor?.username || "Desconocido"}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className="flex flex-col items-center gap-1">
                          <span className={styles.zonaBadge}>{orden.zona}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {orden.repartidor || orden.repartidores?.nombre || "Sin Asignar"}
                          </span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        {orden.fecha_entrega ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-300 font-medium text-xs">
                              {(() => {
                                const [y, m, d] = orden.fecha_entrega.split('-').map(Number);
                                return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", {
                                  timeZone: "UTC",
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                });
                              })()}
                            </span>
                            {orden.hora_entrega && (
                              <span className="text-slate-500 text-[10px]">{orden.hora_entrega.slice(0, 5)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Sin fecha</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span className="text-xs text-slate-500">
                          {new Date(orden.created_at).toLocaleDateString("es-MX", {
                            timeZone: "America/Tijuana",
                            day: "2-digit",
                            month: "short"
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                      No se encontraron órdenes con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.pBtn(currentPage === 1)}
            >
              Anterior
            </button>
            <span className="text-slate-400 text-xs">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.pBtn(currentPage === totalPages)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
