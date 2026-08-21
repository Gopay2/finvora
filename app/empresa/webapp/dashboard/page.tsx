import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import SalesChart from "@/components/empresa/SalesChart";
import FiltrosDashboard from "@/components/empresa/FiltrosDashboard";
import PerformancePieChart from "@/components/empresa/PerformancePieChart";
import type { VentaDashboard } from "@/components/empresa/PerformancePieChart";
import { getTijuanaDate, getTijuanaMonthWeeks } from "@/utils/date-helpers";

// ─── Revalidación y Configuración ──────────────────────────────────────────
export const revalidate = 0; // Deshabilitamos caché para responder inmediatamente a los URL Search Params

// ─── Estilos (Tailwind) ──────────────────────────────────────────────────────
const styles = {
  container: "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12",
  header: "flex items-center justify-between",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer select-none",

  // KPI Cards Grid
  kpiGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6",
  kpiCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-secondary/30 transition-all shadow-lg",
  kpiValue: "text-sm sm:text-base md:text-lg font-bold text-white text-center break-words line-clamp-2 w-full",
  kpiLabel: "text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center mt-0.5",
};

// ─── Helper de Descarga por Lotes (Chunks) en Supabase ──────────────────────
async function fetchSalesChunked(
  supabase: any,
  startDate?: Date | null,
  endDate?: Date | null
): Promise<VentaDashboard[]> {
  const PAGE_SIZE = 1000;
  let from = 0;
  let allSales: VentaDashboard[] = [];
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("ventas")
      .select(`
        fecha_venta,
        vendedor_nombre,
        vendedor:perfiles(username),
        productos(marca, modelo)
      `)
      .order("fecha_venta", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (startDate) {
      query = query.gte("fecha_venta", startDate.toISOString());
    }
    if (endDate) {
      query = query.lte("fecha_venta", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allSales = allSales.concat(data as VentaDashboard[]);
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    }
  }

  return allSales;
}

// ─── Componente Principal de Página ──────────────────────────────────────────
interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    week?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Developer", "Supervisor"])) {
    return <AccessDenied role={userRole} sectionName="Dashboard" />;
  }

  // 1. Resolver parámetros de búsqueda (Filtros)
  const resolvedParams = await searchParams;
  const isDefaultState = Object.keys(resolvedParams).length === 0;
  const yearParam = resolvedParams.year || 'actual';
  const weekParam = isDefaultState ? 'actual' : (resolvedParams.week || '');
  const monthParam = isDefaultState
    ? 'actual'
    : (resolvedParams.month || (weekParam ? 'actual' : ''));

  const supabase = await createClient();

  // 2. Lógica Temporal de Tijuana (America/Tijuana)
  const now = new Date();

  const getTijuanaDateString = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Tijuana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);

  const tijuanaTodayStr = getTijuanaDateString(now);
  const [currYear, currMonth, currDay] = tijuanaTodayStr.split('-').map(Number);

  const currentTijuanaYear = currYear;
  const currentTijuanaMonth = currMonth - 1; // 0-11

  // 3. Rangos de Fecha para KPIs Fijos del Período Actual
  const yesterdayDateHelper = new Date(Date.UTC(currYear, currMonth - 1, currDay - 1));
  const tijuanaYesterdayStr = yesterdayDateHelper.toISOString().split('T')[0];

  // Semana vigente (Lunes a Domingo)
  const tempUtcTijuana = new Date(Date.UTC(currYear, currMonth - 1, currDay));
  const dayOfWeek = tempUtcTijuana.getUTCDay(); // 0 = Domingo, 1 = Lunes, etc.
  const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  
  const mondayDateHelper = new Date(Date.UTC(currYear, currMonth - 1, currDay));
  mondayDateHelper.setUTCDate(mondayDateHelper.getUTCDate() - diffToMonday);

  const startOfWeek = getTijuanaDate(
    mondayDateHelper.getUTCFullYear(),
    mondayDateHelper.getUTCMonth(),
    mondayDateHelper.getUTCDate(),
    0, 0, 0, 0
  );

  const sundayDateHelper = new Date(mondayDateHelper);
  sundayDateHelper.setUTCDate(mondayDateHelper.getUTCDate() + 6);

  const endOfWeek = getTijuanaDate(
    sundayDateHelper.getUTCFullYear(),
    sundayDateHelper.getUTCMonth(),
    sundayDateHelper.getUTCDate(),
    23, 59, 59, 999
  );

  // Mes actual
  const startOfMonth = getTijuanaDate(currentTijuanaYear, currentTijuanaMonth, 1, 0, 0, 0, 0);
  const lastDayCurrentMonth = new Date(currentTijuanaYear, currentTijuanaMonth + 1, 0).getDate();
  const endOfMonth = getTijuanaDate(currentTijuanaYear, currentTijuanaMonth, lastDayCurrentMonth, 23, 59, 59, 999);

  // El inicio más temprano requerido para calcular los KPIs fijos (Hoy, Ayer, Semana, Mes)
  const startOfYesterday = getTijuanaDate(currYear, currMonth - 1, currDay - 1, 0, 0, 0, 0);
  const kpiStartDate = new Date(
    Math.min(startOfWeek.getTime(), startOfMonth.getTime(), startOfYesterday.getTime())
  );

  // 4. Determinar Fechas y Modo del Gráfico según Filtros
  const filterYearNum = yearParam === 'actual' ? currentTijuanaYear : (yearParam === 'historico' ? null : parseInt(yearParam));
  const filterMonthIdx = monthParam === 'actual' ? currentTijuanaMonth : (monthParam ? parseInt(monthParam) - 1 : null);

  let weeksInSelectedMonth = 0;
  if (filterYearNum !== null && filterMonthIdx !== null) {
    weeksInSelectedMonth = getTijuanaMonthWeeks(filterYearNum, filterMonthIdx).length;
  }

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let chartViewMode: 'semanal' | 'mensual' | 'anual' | 'historico' = 'historico';

  if (yearParam !== 'historico') {
    const targetYear = yearParam === 'actual' ? currentTijuanaYear : parseInt(yearParam);

    if (!monthParam || monthParam === '') {
      // Todo el año
      startDate = getTijuanaDate(targetYear, 0, 1, 0, 0, 0, 0);
      endDate = getTijuanaDate(targetYear, 11, 31, 23, 59, 59, 999);
      chartViewMode = 'anual';
    } else {
      const targetMonthIndex = monthParam === 'actual' ? currentTijuanaMonth : parseInt(monthParam) - 1;

      if (!weekParam || weekParam === '') {
        // Todo el mes
        startDate = getTijuanaDate(targetYear, targetMonthIndex, 1, 0, 0, 0, 0);
        const lastDayFilteredMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
        endDate = getTijuanaDate(targetYear, targetMonthIndex, lastDayFilteredMonth, 23, 59, 59, 999);
        chartViewMode = 'mensual';
      } else if (weekParam === 'actual') {
        startDate = startOfWeek;
        endDate = endOfWeek;
        chartViewMode = 'semanal';
      } else if (weekParam === 'anterior') {
        startDate = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(endOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
        chartViewMode = 'semanal';
      } else if (weekParam.startsWith('S')) {
        const weekNum = parseInt(weekParam.substring(1));
        const monthWeeks = getTijuanaMonthWeeks(targetYear, targetMonthIndex);
        const selectedWeek = monthWeeks[weekNum - 1];
        if (selectedWeek) {
          startDate = selectedWeek.start;
          endDate = selectedWeek.end;
          chartViewMode = 'semanal';
        }
      }
    }
  }

  // 5. Ejecutar Consultas Optimizadas en Paralelo
  const [
    currentPeriodSales,
    filteredSalesResult,
    oldestSaleResult,
    newestSaleResult,
    allHistoricalSalesResult
  ] = await Promise.all([
    // A: Ventas para KPIs fijos (solo desde el inicio del período actual)
    fetchSalesChunked(supabase, kpiStartDate, endOfMonth),
    
    // B: Ventas para los gráficos (filtradas en BD por el rango exacto)
    fetchSalesChunked(supabase, startDate, endDate),

    // C: Venta más antigua para conocer el año mínimo disponible
    supabase.from("ventas").select("fecha_venta").order("fecha_venta", { ascending: true }).limit(1),

    // D: Venta más nueva para conocer el año máximo disponible
    supabase.from("ventas").select("fecha_venta").order("fecha_venta", { ascending: false }).limit(1),

    // E: Ventas históricas para ganadores históricos (si el filtro no es ya histórico)
    yearParam === 'historico'
      ? Promise.resolve([])
      : fetchSalesChunked(supabase, null, null)
  ]);

  const filteredSales = filteredSalesResult;
  const historicalSales = yearParam === 'historico' ? filteredSalesResult : allHistoricalSalesResult;

  // 6. Calcular KPIs Fijos (Absolutos)
  let ventasHoy = 0;
  currentPeriodSales.forEach((sale: VentaDashboard) => {
    const saleDate = new Date(sale.fecha_venta);
    if (getTijuanaDateString(saleDate) === tijuanaTodayStr) {
      ventasHoy++;
    }
  });

  let ventasAyer = 0;
  currentPeriodSales.forEach((sale: VentaDashboard) => {
    const saleDate = new Date(sale.fecha_venta);
    if (getTijuanaDateString(saleDate) === tijuanaYesterdayStr) {
      ventasAyer++;
    }
  });

  let ventasSemana = 0;
  currentPeriodSales.forEach((sale: VentaDashboard) => {
    const saleDate = new Date(sale.fecha_venta);
    if (saleDate >= startOfWeek && saleDate <= endOfWeek) {
      ventasSemana++;
    }
  });

  let ventasMesActual = 0;
  currentPeriodSales.forEach((sale: VentaDashboard) => {
    const saleDate = new Date(sale.fecha_venta);
    if (saleDate >= startOfMonth && saleDate <= endOfMonth) {
      ventasMesActual++;
    }
  });

  // 7. Mejores Vendedores (Mes actual vs Histórico)
  const vendedoresMesStats: Record<string, number> = {};
  currentPeriodSales.forEach((sale: VentaDashboard) => {
    const saleDate = new Date(sale.fecha_venta);
    if (saleDate >= startOfMonth && saleDate <= endOfMonth) {
      const vName = sale.vendedor?.username || sale.vendedor_nombre || "Desconocido";
      vendedoresMesStats[vName] = (vendedoresMesStats[vName] || 0) + 1;
    }
  });

  const vendedoresHistoricoStats: Record<string, number> = {};
  historicalSales.forEach((sale: VentaDashboard) => {
    const vName = sale.vendedor?.username || sale.vendedor_nombre || "Desconocido";
    vendedoresHistoricoStats[vName] = (vendedoresHistoricoStats[vName] || 0) + 1;
  });

  const getWinnerName = (stats: Record<string, number>) => {
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const nameRaw = sorted[0]?.[0] || "---";
    if (nameRaw === "---" || nameRaw === "Desconocido") return "---";
    return nameRaw.charAt(0).toUpperCase() + nameRaw.slice(1);
  };

  const mejorVendedorMes = getWinnerName(vendedoresMesStats);
  const mejorVendedorHistorico = getWinnerName(vendedoresHistoricoStats);

  // 8. Celulares más vendidos (Mes actual vs Histórico)
  const productosMesStats: Record<string, number> = {};
  currentPeriodSales.forEach((sale: VentaDashboard) => {
    const saleDate = new Date(sale.fecha_venta);
    if (saleDate >= startOfMonth && saleDate <= endOfMonth) {
      const pName = sale.productos ? `${sale.productos.marca} ${sale.productos.modelo}` : "Desconocido";
      productosMesStats[pName] = (productosMesStats[pName] || 0) + 1;
    }
  });

  const productosHistoricoStats: Record<string, number> = {};
  historicalSales.forEach((sale: VentaDashboard) => {
    const pName = sale.productos ? `${sale.productos.marca} ${sale.productos.modelo}` : "Desconocido";
    productosHistoricoStats[pName] = (productosHistoricoStats[pName] || 0) + 1;
  });

  const getWinnerProduct = (stats: Record<string, number>) => {
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "---";
  };

  const celularMasVendidoMes = getWinnerProduct(productosMesStats);
  const celularMasVendidoHistorico = getWinnerProduct(productosHistoricoStats);

  // 9. Extraer Años Disponibles
  const minYear = oldestSaleResult?.data?.[0]?.fecha_venta
    ? new Date(oldestSaleResult.data[0].fecha_venta).getFullYear()
    : currentTijuanaYear;
  const maxYear = newestSaleResult?.data?.[0]?.fecha_venta
    ? new Date(newestSaleResult.data[0].fecha_venta).getFullYear()
    : currentTijuanaYear;

  const availableYears: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    availableYears.push(y);
  }
  if (availableYears.length === 0) {
    availableYears.push(currentTijuanaYear);
  }

  return (
    <div className={styles.container}>
      {/* ─── FILA 0: ENCABEZADO ───────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className="space-y-1">
          <h2 className={styles.title}>Dashboard</h2>
          <p className="text-slate-500 text-sm">Resumen operativo y métricas en tiempo real</p>
        </div>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* ─── FILA 1: 4 TARJETAS VENTAS ─────────────────────────────── */}
      <div className={styles.kpiGrid}>
        {/* KPI: Ventas Hoy */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{ventasHoy}</span>
          <span className={styles.kpiLabel}>Ventas de hoy</span>
        </div>

        {/* KPI: Ventas Ayer */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{ventasAyer}</span>
          <span className={styles.kpiLabel}>Ventas de ayer</span>
        </div>

        {/* KPI: Ventas Última Semana */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{ventasSemana}</span>
          <span className={styles.kpiLabel}>Ventas Última Semana</span>
        </div>

        {/* KPI: Ventas Mes Actual */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{ventasMesActual}</span>
          <span className={styles.kpiLabel}>Ventas Mes Actual</span>
        </div>
      </div>

      {/* ─── FILA 2: BARRA DE FILTROS COMBINABLES ─────────────────────────────── */}
      <FiltrosDashboard
        currentYear={yearParam}
        currentMonth={monthParam}
        currentWeek={weekParam}
        availableYears={availableYears}
        weeksInSelectedMonth={weeksInSelectedMonth}
      />

      {/* ─── FILA 3: GRÁFICO LINEAL DE VENTAS (ANCHO COMPLETO) ────────────────── */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden h-[24rem] sm:h-96 flex flex-col w-full">
        <SalesChart
          sales={filteredSales}
          viewMode={chartViewMode}
          startDateStr={startDate ? startDate.toISOString() : undefined}
          weekParam={weekParam}
        />
      </div>

      {/* ─── FILA 4: 4 TARJETAS GANADORES Y PRODUCTOS (MES VS HISTÓRICO) ────── */}
      <div className={styles.kpiGrid}>
        {/* Mejor Vendedor del Mes */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{mejorVendedorMes}</span>
          <span className={styles.kpiLabel}>Mejor Vendedor Mes</span>
        </div>

        {/* Mejor Vendedor Histórico */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{mejorVendedorHistorico}</span>
          <span className={styles.kpiLabel}>Mejor Vendedor Histórico</span>
        </div>

        {/* Celular Más Vendido del Mes */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{celularMasVendidoMes}</span>
          <span className={styles.kpiLabel}>Celular Más Vendido Mes</span>
        </div>

        {/* Celular Más Vendido Histórico */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{celularMasVendidoHistorico}</span>
          <span className={styles.kpiLabel}>Celular Más Vendido Histórico</span>
        </div>
      </div>

      {/* ─── FILA 5: GRÁFICO DE TORTA DE RENDIMIENTO (ANCHO COMPLETO) ────────── */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] w-full flex flex-col">
        <div className="text-center mb-6">
          <h4 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">Top Closers del Período</h4>
          <p className="text-white font-black text-2xl">Rendimiento</p>
        </div>
        <PerformancePieChart sales={filteredSales} />
      </div>
    </div>
  );
}
