import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import SalesChart from "@/components/empresa/SalesChart";
import FiltrosDashboard from "@/components/empresa/FiltrosDashboard";

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

// ─── Helpers de Fecha (Zona Horaria México - CST UTC-6) ─────────────────────
function getMexicoDate(year: number, monthIndex: number, day: number, hours = 0, minutes = 0, seconds = 0, ms = 0): Date {
  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  return new Date(`${dateStr}-06:00`); // Offset estándar CST de Ciudad de México
}

// Calcular las semanas del mes calendario (de Lunes a Domingo)
function getMexicoMonthWeeks(year: number, monthIndex: number): { start: Date; end: Date }[] {
  const firstDay = getMexicoDate(year, monthIndex, 1, 0, 0, 0, 0);
  const lastDayDate = new Date(getMexicoDate(year, monthIndex + 1, 1, 0, 0, 0, 0).getTime() - 1);
  const weeks: { start: Date; end: Date }[] = [];

  let currentStart = new Date(firstDay);

  while (currentStart <= lastDayDate) {
    const dayOfWeek = currentStart.getDay(); // 0 = Domingo, 1 = Lunes
    const daysToSunday = (7 - dayOfWeek) % 7;
    
    const sundayDate = new Date(currentStart);
    sundayDate.setDate(currentStart.getDate() + daysToSunday);
    
    const sundayEndOfDay = getMexicoDate(
      sundayDate.getFullYear(),
      sundayDate.getMonth(),
      sundayDate.getDate(),
      23, 59, 59, 999
    );

    const currentEnd = sundayEndOfDay > lastDayDate ? new Date(lastDayDate) : sundayEndOfDay;

    weeks.push({
      start: new Date(currentStart),
      end: new Date(currentEnd)
    });

    // Avanzamos al lunes siguiente
    const nextMonday = new Date(currentEnd.getTime() + 1);
    currentStart = nextMonday;
  }

  return weeks;
}

// ─── Componente para Gráfico de Torta Dinámico de Vendedores ──────────────────
interface PerformancePieChartProps {
  sales: any[];
}

const PerformancePieChart = ({ sales }: PerformancePieChartProps) => {
  // Calcular rendimiento de vendedores para el período seleccionado
  const stats: Record<string, number> = {};
  sales.forEach((sale: any) => {
    const name = sale.vendedor?.username || "Desconocido";
    stats[name] = (stats[name] || 0) + 1;
  });

  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const totalSales = sales.length;

  if (totalSales === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Sin ventas registradas en este período</span>
      </div>
    );
  }

  // Tomamos el mejor vendedor
  const topSalesName = sortedStats[0]?.[0] || "---";
  const topSalesCount = sortedStats[0]?.[1] || 0;
  const topPct = topSalesCount / totalSales;
  const restPct = 1 - topPct;
  
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const topDash = topPct * circumference;

  const getLabelPos = (pct: number) => {
    const angle = pct * 2 * Math.PI;
    const x = 50 + Math.cos(angle) * 28;
    const y = 50 + Math.sin(angle) * 28;
    return { x, y };
  };

  const topPos = getLabelPos(topPct / 2);
  const restPos = getLabelPos(topPct + restPct / 2);

  return (
    <div className="flex flex-col md:flex-row items-center justify-around gap-8 w-full mt-4">
      {/* Gráfico SVG circular */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-56 h-56 sm:w-64 sm:h-64 relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-2xl">
            {/* Resto de vendedores (fondo completo) */}
            <circle 
              r={radius} cx="50" cy="50" 
              fill="transparent" 
              stroke="#3b82f6" 
              strokeWidth="50" 
              className="hover:opacity-80 transition-opacity" 
            />
            {/* Mejor vendedor (porción superior) */}
            {topPct > 0 && (
              <circle 
                r={radius} cx="50" cy="50" 
                fill="transparent" 
                stroke="#10b981" 
                strokeWidth="50" 
                strokeDasharray={`${topDash} ${circumference}`} 
                strokeDashoffset="0" 
                className="hover:opacity-80 transition-opacity" 
              />
            )}
            
            {/* Textos de Porcentajes */}
            {restPct > 0.05 && (
              <text 
                x={restPos.x} y={restPos.y} 
                fill="#001c3a" fontSize="10" fontWeight="black" 
                textAnchor="middle" dominantBaseline="central"
                transform={`rotate(90 ${restPos.x} ${restPos.y})`} 
                className="pointer-events-none font-bold"
              >
                {Math.round(restPct * 100)}%
              </text>
            )}
            {topPct > 0.05 && (
              <text 
                x={topPos.x} y={topPos.y} 
                fill="#001f27" fontSize="10" fontWeight="black" 
                textAnchor="middle" dominantBaseline="central"
                transform={`rotate(90 ${topPos.x} ${topPos.y})`} 
                className="pointer-events-none font-bold"
              >
                {Math.round(topPct * 100)}%
              </text>
            )}
          </svg>
        </div>
        {/* Leyenda */}
        <div className="flex gap-4 sm:gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
              {topSalesName.substring(0, 15)} ({topSalesCount} U.)
            </span>
          </div>
          {restPct > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Resto ({totalSales - topSalesCount} U.)</span>
            </div>
          )}
        </div>
      </div>

      {/* Ranking de vendedores completo con barra de progreso */}
      <div className="flex-1 w-full max-w-sm space-y-4">
        <h5 className="text-slate-400 text-sm sm:text-base font-bold uppercase tracking-widest border-b border-slate-800/80 pb-2">
          Ranking de Vendedores
        </h5>
        <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
          {sortedStats.map(([name, count], index) => {
            const percentage = Math.round((count / totalSales) * 100);
            const isTopOne = index === 0;
            return (
              <div key={name} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <div className="flex items-center gap-3 text-slate-300 font-semibold">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-black ${
                      isTopOne 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="capitalize">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold text-xs sm:text-sm">
                      {count} <span className="text-[10px] sm:text-xs text-slate-400 font-medium">U.</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black border ${
                      isTopOne 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTopOne ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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

  // 2. Obtener todas las ventas del sistema
  const { data: allSales } = await supabase
    .from("ventas")
    .select(`
      fecha_venta,
      vendedor:perfiles(username),
      productos(marca, modelo)
    `);

  const sales = allSales || [];

  // 3. Lógica Temporal de México (CST UTC-6)
  const now = new Date();
  const mexicoNowStr = now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
  const currentMexicoDate = new Date(mexicoNowStr);
  const currentMexicoYear = currentMexicoDate.getFullYear();
  const currentMexicoMonth = currentMexicoDate.getMonth(); // 0-11

  const getMexicoDateString = (date: Date) => 
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);

  const mexicoTodayStr = getMexicoDateString(currentMexicoDate);

  // 4. Calcular KPIs Fijos (Absolutos)
  
  // A. Ventas Hoy
  let ventasHoy = 0;
  sales.forEach((sale: any) => {
    const saleDate = new Date(sale.fecha_venta);
    if (getMexicoDateString(saleDate) === mexicoTodayStr) {
      ventasHoy++;
    }
  });

  // B. Ventas Última Semana (Semana vigente de Lunes a Domingo)
  const dayOfWeek = currentMexicoDate.getDay();
  const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const startOfWeek = getMexicoDate(
    currentMexicoDate.getFullYear(),
    currentMexicoDate.getMonth(),
    currentMexicoDate.getDate(),
    0, 0, 0, 0
  );
  startOfWeek.setDate(currentMexicoDate.getDate() - diffToMonday);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  let ventasSemana = 0;
  sales.forEach((sale: any) => {
    const saleDate = new Date(sale.fecha_venta);
    if (saleDate >= startOfWeek && saleDate <= endOfWeek) {
      ventasSemana++;
    }
  });

  // C. Ventas Mes Actual
  const startOfMonth = getMexicoDate(currentMexicoYear, currentMexicoMonth, 1, 0, 0, 0, 0);
  const lastDayCurrentMonth = new Date(currentMexicoYear, currentMexicoMonth + 1, 0).getDate();
  const endOfMonth = getMexicoDate(currentMexicoYear, currentMexicoMonth, lastDayCurrentMonth, 23, 59, 59, 999);

  let ventasMesActual = 0;
  sales.forEach((sale: any) => {
    const saleDate = new Date(sale.fecha_venta);
    if (saleDate >= startOfMonth && saleDate <= endOfMonth) {
      ventasMesActual++;
    }
  });

  // D. Mejores Vendedores (Mes actual vs Histórico)
  const vendedoresMesStats: Record<string, number> = {};
  const vendedoresHistoricoStats: Record<string, number> = {};
  
  sales.forEach((sale: any) => {
    const saleDate = new Date(sale.fecha_venta);
    const vName = (sale.vendedor as any)?.username || "Desconocido";
    
    vendedoresHistoricoStats[vName] = (vendedoresHistoricoStats[vName] || 0) + 1;
    
    if (saleDate >= startOfMonth && saleDate <= endOfMonth) {
      vendedoresMesStats[vName] = (vendedoresMesStats[vName] || 0) + 1;
    }
  });

  const getWinnerName = (stats: Record<string, number>) => {
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const nameRaw = sorted[0]?.[0] || "---";
    if (nameRaw === "---" || nameRaw === "Desconocido") return "---";
    return nameRaw.charAt(0).toUpperCase() + nameRaw.slice(1);
  };

  const mejorVendedorMes = getWinnerName(vendedoresMesStats);
  const mejorVendedorHistorico = getWinnerName(vendedoresHistoricoStats);

  // E. Celulares más vendidos (Mes actual vs Histórico)
  const productosMesStats: Record<string, number> = {};
  const productosHistoricoStats: Record<string, number> = {};

  sales.forEach((sale: any) => {
    const saleDate = new Date(sale.fecha_venta);
    const pName = sale.productos ? `${(sale.productos as any).marca} ${(sale.productos as any).modelo}` : "Desconocido";
    
    productosHistoricoStats[pName] = (productosHistoricoStats[pName] || 0) + 1;
    
    if (saleDate >= startOfMonth && saleDate <= endOfMonth) {
      productosMesStats[pName] = (productosMesStats[pName] || 0) + 1;
    }
  });

  const getWinnerProduct = (stats: Record<string, number>) => {
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "---";
  };

  const celularMasVendidoMes = getWinnerProduct(productosMesStats);
  const celularMasVendidoHistorico = getWinnerProduct(productosHistoricoStats);

  // 5. Calcular Parámetros de Filtro
  const filterYearNum = yearParam === 'actual' ? currentMexicoYear : (yearParam === 'historico' ? null : parseInt(yearParam));
  const filterMonthIdx = monthParam === 'actual' ? currentMexicoMonth : (monthParam ? parseInt(monthParam) - 1 : null);

  // Determinar cuántas semanas tiene el mes seleccionado
  let weeksInSelectedMonth = 0;
  if (filterYearNum !== null && filterMonthIdx !== null) {
    weeksInSelectedMonth = getMexicoMonthWeeks(filterYearNum, filterMonthIdx).length;
  }

  // 6. Aplicar Filtro de Fechas para los Gráficos
  let filteredSales = sales;
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let chartViewMode: 'semanal' | 'mensual' | 'anual' | 'historico' = 'historico';

  if (yearParam !== 'historico') {
    const targetYear = yearParam === 'actual' ? currentMexicoYear : parseInt(yearParam);
    
    if (!monthParam || monthParam === '') {
      // Todo el año
      startDate = getMexicoDate(targetYear, 0, 1, 0, 0, 0, 0);
      endDate = getMexicoDate(targetYear, 11, 31, 23, 59, 59, 999);
      chartViewMode = 'anual';
    } else {
      const targetMonthIndex = monthParam === 'actual' ? currentMexicoMonth : parseInt(monthParam) - 1;
      
      if (!weekParam || weekParam === '') {
        // Todo el mes
        startDate = getMexicoDate(targetYear, targetMonthIndex, 1, 0, 0, 0, 0);
        const lastDayFilteredMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
        endDate = getMexicoDate(targetYear, targetMonthIndex, lastDayFilteredMonth, 23, 59, 59, 999);
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
        const monthWeeks = getMexicoMonthWeeks(targetYear, targetMonthIndex);
        const selectedWeek = monthWeeks[weekNum - 1];
        if (selectedWeek) {
          startDate = selectedWeek.start;
          endDate = selectedWeek.end;
          chartViewMode = 'semanal';
        }
      }
    }
  }

  // Filtrar en memoria
  if (startDate && endDate) {
    filteredSales = sales.filter((sale: any) => {
      const saleDate = new Date(sale.fecha_venta);
      return saleDate >= startDate! && saleDate <= endDate!;
    });
  }

  // Extraer los años únicos que tienen datos de ventas reales en la base de datos
  const yearsWithSalesData = Array.from(
    new Set(sales.map((sale: any) => new Date(sale.fecha_venta).getFullYear()))
  ) as number[];
  yearsWithSalesData.sort((a, b) => b - a);
  const availableYears = yearsWithSalesData.length > 0 ? yearsWithSalesData : [currentMexicoYear];

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

      {/* ─── FILA 1: DETALLE + 3 TARJETAS VENTAS ─────────────────────────────── */}
      <div className={styles.kpiGrid}>
        {/* Tarjeta Enlace a Historial */}
        <Link 
          href="/empresa/webapp/dashboard/detalle-ventas" 
          className={`${styles.kpiCard} group relative overflow-hidden border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.12)] hover:shadow-[0_0_35px_rgba(16,185,129,0.22)] hover:bg-emerald-500/10 transition-all duration-500 cursor-pointer h-24 sm:h-28`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent -translate-x-full animate-shimmer-smooth pointer-events-none w-[200%]" />
          <span className={`${styles.kpiValue} text-emerald-400 group-hover:text-emerald-200 transition-colors`}>Detalle ventas</span>
          <span className="material-symbols-outlined text-emerald-500/50 absolute top-2 right-2 text-sm opacity-40 group-hover:opacity-100 transition-opacity">open_in_new</span>
        </Link>
        
        {/* KPI: Ventas Hoy */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{ventasHoy}</span>
          <span className={styles.kpiLabel}>Ventas Hoy</span>
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
