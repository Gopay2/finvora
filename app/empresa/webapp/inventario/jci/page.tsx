import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import FiltrosDashboard from "@/components/empresa/FiltrosDashboard";
import JciTablasView from "@/components/empresa/jci/JciTablasView";
import type { ProveedorSemanalItem } from "@/components/empresa/jci/JciTablasView";
import { getTijuanaDate, getTijuanaMonthWeeks } from "@/utils/date-helpers";
import { createClient } from "@/utils/supabase/server";
import { fetchAllFromTable } from "@/utils/supabase/pagination";

export const revalidate = 0;

interface PageProps {
  searchParams?: Promise<{
    year?: string;
    month?: string;
    week?: string;
  }>;
}

interface JciRecordItem {
  id: string;
  imei: string;
  proveedor: string;
  area_proveedor: string;
  fecha_ingreso: string;
}

const styles = {
  container: "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12",
  header: "flex items-center justify-between",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  subtitle: "text-slate-500 text-sm",
  btnBack: "text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors",

  // KPI Cards Grid
  kpiGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6",
  kpiCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-secondary/30 transition-all shadow-lg",
  kpiValue: "text-sm sm:text-base md:text-lg font-bold text-white text-center break-words line-clamp-2 w-full",
  kpiLabel: "text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center mt-0.5",
};

/**
 * Procesa y agrupa registros individuales en filas por proveedor y día de la semana (Lunes a Domingo)
 * evaluando estrictamente la fecha en la zona horaria de Tijuana (America/Tijuana).
 */
function agruparPorProveedorYSemana(items: JciRecordItem[]): ProveedorSemanalItem[] {
  const map = new Map<string, ProveedorSemanalItem>();

  // Base inicial de los proveedores registrados en el sistema
  const baseProveedores = [
    { proveedor: "Android Tj", ciudad: "Tijuana" },
    { proveedor: "WindCell", ciudad: "Guadalajara" },
    { proveedor: "Sbmx", ciudad: "Monterrey" },
  ];

  baseProveedores.forEach((bp, index) => {
    map.set(bp.proveedor.toLowerCase(), {
      id: String(index + 1),
      proveedor: bp.proveedor,
      ciudad: bp.ciudad,
      lunes: 0,
      martes: 0,
      miercoles: 0,
      jueves: 0,
      viernes: 0,
      sabado: 0,
      domingo: 0,
      total: 0,
    });
  });

  items.forEach((item) => {
    const provRaw = (item.proveedor || "").trim() || "Desconocido";
    const provKey = provRaw.toLowerCase();
    const area = (item.area_proveedor || "").trim() || "Tijuana";

    if (!map.has(provKey)) {
      map.set(provKey, {
        id: provKey,
        proveedor: provRaw,
        ciudad: area,
        lunes: 0,
        martes: 0,
        miercoles: 0,
        jueves: 0,
        viernes: 0,
        sabado: 0,
        domingo: 0,
        total: 0,
      });
    }

    const row = map.get(provKey)!;
    const fechaObj = new Date(item.fecha_ingreso);

    // Determinar día de la semana en horario Tijuana
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Tijuana",
      weekday: "short",
    }).format(fechaObj);

    switch (weekday) {
      case "Mon": row.lunes++; break;
      case "Tue": row.martes++; break;
      case "Wed": row.miercoles++; break;
      case "Thu": row.jueves++; break;
      case "Fri": row.viernes++; break;
      case "Sat": row.sabado++; break;
      case "Sun": row.domingo++; break;
    }

    row.total++;
  });

  return Array.from(map.values());
}

export default async function JciPage({ searchParams }: PageProps) {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer", "JCI"])) {
    return <AccessDenied role={userRole} sectionName="JCI" />;
  }

  // 1. Resolver parámetros de búsqueda para los filtros
  const resolvedParams = searchParams ? await searchParams : {};
  const isDefaultState = Object.keys(resolvedParams).length === 0;
  const yearParam = resolvedParams.year || "actual";
  const weekParam = isDefaultState ? "actual" : (resolvedParams.week || "");
  const monthParam = isDefaultState
    ? "actual"
    : (resolvedParams.month || (weekParam ? "actual" : ""));

  // 2. Lógica Temporal de Tijuana (America/Tijuana)
  const now = new Date();
  const getTijuanaDateString = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Tijuana",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

  const tijuanaTodayStr = getTijuanaDateString(now);
  const [currYear, currMonth, currDay] = tijuanaTodayStr.split("-").map(Number);
  const currentTijuanaYear = currYear;
  const currentTijuanaMonth = currMonth - 1; // 0-11

  // Semana actual en Tijuana (Lunes a Domingo)
  const tempUtcTijuana = new Date(Date.UTC(currYear, currMonth - 1, currDay));
  const dayOfWeek = tempUtcTijuana.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

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

  // 3. Determinar Rangos de Fecha según los Filtros Seleccionados
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (yearParam !== "historico") {
    const targetYear = yearParam === "actual" ? currentTijuanaYear : parseInt(yearParam, 10);

    if (!monthParam || monthParam === "") {
      // Todo el año seleccionado
      startDate = getTijuanaDate(targetYear, 0, 1, 0, 0, 0, 0);
      endDate = getTijuanaDate(targetYear, 11, 31, 23, 59, 59, 999);
    } else {
      const targetMonthIndex = monthParam === "actual" ? currentTijuanaMonth : parseInt(monthParam, 10) - 1;

      if (!weekParam || weekParam === "") {
        // Todo el mes seleccionado
        startDate = getTijuanaDate(targetYear, targetMonthIndex, 1, 0, 0, 0, 0);
        const lastDayFilteredMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
        endDate = getTijuanaDate(targetYear, targetMonthIndex, lastDayFilteredMonth, 23, 59, 59, 999);
      } else if (weekParam === "actual") {
        startDate = startOfWeek;
        endDate = endOfWeek;
      } else if (weekParam === "anterior") {
        const prevMondayHelper = new Date(mondayDateHelper);
        prevMondayHelper.setUTCDate(prevMondayHelper.getUTCDate() - 7);
        startDate = getTijuanaDate(
          prevMondayHelper.getUTCFullYear(),
          prevMondayHelper.getUTCMonth(),
          prevMondayHelper.getUTCDate(),
          0, 0, 0, 0
        );

        const prevSundayHelper = new Date(sundayDateHelper);
        prevSundayHelper.setUTCDate(prevSundayHelper.getUTCDate() - 7);
        endDate = getTijuanaDate(
          prevSundayHelper.getUTCFullYear(),
          prevSundayHelper.getUTCMonth(),
          prevSundayHelper.getUTCDate(),
          23, 59, 59, 999
        );
      } else if (weekParam.startsWith("S")) {
        const weekNum = parseInt(weekParam.substring(1), 10);
        const monthWeeks = getTijuanaMonthWeeks(targetYear, targetMonthIndex);
        const selectedWeek = monthWeeks[weekNum - 1];
        if (selectedWeek) {
          startDate = selectedWeek.start;
          endDate = selectedWeek.end;
        }
      }
    }
  }

  // Años disponibles en el selector de filtros
  const availableYears = [currentTijuanaYear, currentTijuanaYear - 1, currentTijuanaYear - 2];
  let selectedMonthIndex = currentTijuanaMonth;
  if (monthParam && monthParam !== "actual") {
    const parsed = parseInt(monthParam, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
      selectedMonthIndex = parsed - 1;
    }
  }
  const filterYearNum = yearParam === "actual" ? currentTijuanaYear : (yearParam === "historico" ? currentTijuanaYear : parseInt(yearParam, 10));
  const weeksInSelectedMonth = getTijuanaMonthWeeks(filterYearNum, selectedMonthIndex).length || 5;

  // 4. Descarga de datos sin límite de 1.000 filas (Paginación automática por chunks)
  const supabase = await createClient();

  const [creditoRaw, concesionRaw] = await Promise.all([
    fetchAllFromTable<JciRecordItem>(
      supabase,
      "jci_equipos_credito",
      "id, imei, proveedor, area_proveedor, fecha_ingreso",
      {
        orderColumn: "fecha_ingreso",
        ascending: false,
        filterFn: (query) => {
          if (startDate) query = query.gte("fecha_ingreso", startDate.toISOString());
          if (endDate) query = query.lte("fecha_ingreso", endDate.toISOString());
          return query;
        },
      }
    ).catch((err) => {
      console.warn("Aviso: jci_equipos_credito aún no creada o sin datos en Supabase:", err);
      return [] as JciRecordItem[];
    }),

    fetchAllFromTable<JciRecordItem>(
      supabase,
      "jci_equipos_concesion",
      "id, imei, proveedor, area_proveedor, fecha_ingreso",
      {
        orderColumn: "fecha_ingreso",
        ascending: false,
        filterFn: (query) => {
          if (startDate) query = query.gte("fecha_ingreso", startDate.toISOString());
          if (endDate) query = query.lte("fecha_ingreso", endDate.toISOString());
          return query;
        },
      }
    ).catch((err) => {
      console.warn("Aviso: jci_equipos_concesion aún no creada o sin datos en Supabase:", err);
      return [] as JciRecordItem[];
    }),
  ]);

  // 5. Agrupación por Proveedor y Día de la Semana (Lunes a Domingo)
  const creditoRows = agruparPorProveedorYSemana(creditoRaw);
  const concesionRows = agruparPorProveedorYSemana(concesionRaw);

  // 6. Cálculo de KPIs Consolidados del Período
  const totalCredito = creditoRaw.length;
  const totalConcesion = concesionRaw.length;
  const totalGeneral = totalCredito + totalConcesion;

  // Calcular proveedor líder en volumen dentro del período
  const volumenPorProveedor = new Map<string, number>();
  [...creditoRaw, ...concesionRaw].forEach((item) => {
    const prov = (item.proveedor || "").trim() || "Desconocido";
    volumenPorProveedor.set(prov, (volumenPorProveedor.get(prov) || 0) + 1);
  });

  let proveedorLider = "—";
  let maxVolumen = 0;
  volumenPorProveedor.forEach((vol, prov) => {
    if (vol > maxVolumen) {
      maxVolumen = vol;
      proveedorLider = prov;
    }
  });

  // 7. Formatear rango de fechas reflejado en las tablas (Horario Tijuana)
  const formatTijuanaDateShort = (d: Date) =>
    new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Tijuana",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);

  let periodoLabel = "Histórico";
  if (yearParam !== "historico" && startDate && endDate) {
    const startFormatted = formatTijuanaDateShort(startDate);
    const endFormatted = formatTijuanaDateShort(endDate);
    periodoLabel =
      startFormatted === endFormatted
        ? startFormatted
        : `${startFormatted} al ${endFormatted}`;
  }

  return (
    <div className={styles.container}>
      {/* ─── ENCABEZADO ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>JCI</h1>
          <p className={styles.subtitle}>Panel de control, auditoría y métricas de inventario</p>
        </div>
        <Link href="/empresa/webapp/inventario" className={styles.btnBack} title="Volver a Inventario">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </header>

      {/* ─── FILA 1: 4 KPIS DINÁMICOS CONECTADOS ─────────────────────────────── */}
      <div className={styles.kpiGrid}>
        {/* KPI 1: Total General */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{totalGeneral}</span>
          <span className={styles.kpiLabel}>Total Equipos</span>
        </div>

        {/* KPI 2: Total Crédito */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{totalCredito}</span>
          <span className={styles.kpiLabel}>Equipos a Crédito</span>
        </div>

        {/* KPI 3: Total Concesión */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue}>{totalConcesion}</span>
          <span className={styles.kpiLabel}>Equipos a Concesión</span>
        </div>

        {/* KPI 4: Proveedor Líder */}
        <div className={`${styles.kpiCard} h-24 sm:h-28`}>
          <span className={styles.kpiValue} title={proveedorLider}>
            {proveedorLider}
          </span>
          <span className={styles.kpiLabel}>Proveedor Líder</span>
        </div>
      </div>

      {/* ─── FILA 2: BARRA DE FILTROS (SEMANA, MES, AÑO) ────────────────────── */}
      <FiltrosDashboard
        currentYear={yearParam}
        currentMonth={monthParam}
        currentWeek={weekParam}
        availableYears={availableYears}
        weeksInSelectedMonth={weeksInSelectedMonth}
      />

      {/* ─── FILA 3: TABLAS VISUALES DINÁMICAS (CRÉDITO Y CONCESIÓN) ────────── */}
      <JciTablasView
        creditoRows={creditoRows}
        concesionRows={concesionRows}
        periodoLabel={periodoLabel}
      />
    </div>
  );
}
