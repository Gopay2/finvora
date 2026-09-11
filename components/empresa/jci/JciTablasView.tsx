'use client';

import React from 'react';

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface ProveedorSemanalItem {
  id: string;
  proveedor: string;
  ciudad: string;
  lunes: number;
  martes: number;
  miercoles: number;
  jueves: number;
  viernes: number;
  sabado: number;
  domingo: number;
  total: number;
}

interface AuditoriaDiariaTablaProps {
  title: string;
  subtitle?: string;
  icon?: string;
  rows: ProveedorSemanalItem[];
  periodoLabel?: string;
}

export interface JciTablasViewProps {
  creditoRows: ProveedorSemanalItem[];
  concesionRows: ProveedorSemanalItem[];
  periodoLabel?: string;
}

// ─── Estilos Extraídos (Tailwind) ───────────────────────────────────────────
const styles = {
  tableWrapper: "overflow-x-auto custom-scrollbar touch-pan-x",
  table: "w-full border-collapse text-center text-sm",
  thBase: "px-3 sm:px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap",
  thLeft: "px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap",
  tdBase: "px-3 sm:px-4 py-3.5 text-center text-slate-300 font-medium text-[13px] whitespace-nowrap",
  tdProvider: "px-4 sm:px-6 py-3.5 text-left text-slate-200 font-medium text-[13px] whitespace-nowrap",
  tdTotal: "px-3 sm:px-4 py-3.5 text-center text-secondary font-bold text-[13px] whitespace-nowrap",
};

function AuditoriaDiariaTabla({
  title,
  subtitle = "Visualización consolidada en una sola vista con pie de balance integrado.",
  icon = "analytics",
  rows,
  periodoLabel = "Semana actual",
}: AuditoriaDiariaTablaProps) {
  // Cálculo de totales por columna (Suma para el pie de tabla)
  const totalLunes = rows.reduce((acc, r) => acc + r.lunes, 0);
  const totalMartes = rows.reduce((acc, r) => acc + r.martes, 0);
  const totalMiercoles = rows.reduce((acc, r) => acc + r.miercoles, 0);
  const totalJueves = rows.reduce((acc, r) => acc + r.jueves, 0);
  const totalViernes = rows.reduce((acc, r) => acc + r.viernes, 0);
  const totalSabado = rows.reduce((acc, r) => acc + r.sabado, 0);
  const totalDomingo = rows.reduce((acc, r) => acc + r.domingo, 0);
  const granTotal = rows.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Cabecera estilizada */}
      <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">{icon}</span>
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Indicador de período reflejado */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800 self-start md:self-auto shadow-inner">
          <span className="material-symbols-outlined text-secondary text-sm">calendar_today</span>
          <span className="text-xs text-slate-400 font-semibold">Periodo:</span>
          <span className="text-xs sm:text-sm font-bold text-slate-200">{periodoLabel}</span>
        </div>
      </div>

      {/* Tabla con tfoot integrado */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className={styles.thLeft} style={{ width: "22%" }}>Proveedor</th>
              <th className={styles.thBase} style={{ width: "9.5%" }}>Lunes</th>
              <th className={styles.thBase} style={{ width: "9.5%" }}>Martes</th>
              <th className={styles.thBase} style={{ width: "9.5%" }}>Miércoles</th>
              <th className={styles.thBase} style={{ width: "9.5%" }}>Jueves</th>
              <th className={styles.thBase} style={{ width: "9.5%" }}>Viernes</th>
              <th className={styles.thBase} style={{ width: "9.5%" }}>Sábado</th>
              <th className={styles.thBase} style={{ width: "9.5%" }}>Domingo</th>
              <th className={styles.thBase} style={{ width: "11%" }}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                  <span className="material-symbols-outlined text-3xl mb-1.5 block opacity-40">inventory_2</span>
                  No se registraron ingresos en este período para esta modalidad.
                </td>
              </tr>
            ) : (
              rows.map((fila) => (
                <tr
                  key={fila.id}
                  className="hover:bg-slate-850/40 transition-colors duration-150"
                >
                  <td className={styles.tdProvider}>
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-secondary/80 shrink-0"></span>
                      <span className="font-semibold text-slate-100">{fila.proveedor}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
                        {fila.ciudad}
                      </span>
                    </div>
                  </td>
                  <td className={styles.tdBase}>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs min-w-[32px] font-semibold ${
                      fila.lunes > 0 ? "bg-slate-950/40 text-slate-200" : "text-slate-600"
                    }`}>
                      {fila.lunes}
                    </span>
                  </td>
                  <td className={styles.tdBase}>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs min-w-[32px] font-semibold ${
                      fila.martes > 0 ? "bg-slate-950/40 text-slate-200" : "text-slate-600"
                    }`}>
                      {fila.martes}
                    </span>
                  </td>
                  <td className={styles.tdBase}>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs min-w-[32px] font-semibold ${
                      fila.miercoles > 0 ? "bg-slate-950/40 text-slate-200" : "text-slate-600"
                    }`}>
                      {fila.miercoles}
                    </span>
                  </td>
                  <td className={styles.tdBase}>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs min-w-[32px] font-semibold ${
                      fila.jueves > 0 ? "bg-slate-950/40 text-slate-200" : "text-slate-600"
                    }`}>
                      {fila.jueves}
                    </span>
                  </td>
                  <td className={styles.tdBase}>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs min-w-[32px] font-semibold ${
                      fila.viernes > 0 ? "bg-slate-950/40 text-slate-200" : "text-slate-600"
                    }`}>
                      {fila.viernes}
                    </span>
                  </td>
                  <td className={styles.tdBase}>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs min-w-[32px] font-semibold ${
                      fila.sabado > 0 ? "bg-slate-950/40 text-slate-200" : "text-slate-600"
                    }`}>
                      {fila.sabado}
                    </span>
                  </td>
                  <td className={styles.tdBase}>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs min-w-[32px] font-semibold ${
                      fila.domingo > 0 ? "bg-slate-950/40 text-slate-200" : "text-slate-600"
                    }`}>
                      {fila.domingo}
                    </span>
                  </td>
                  <td className={styles.tdTotal}>
                    <span className="text-secondary font-black text-sm">{fila.total}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* PIE DE TABLA DESTACADO (TFOOT) */}
          <tfoot className="bg-slate-950 border-t-2 border-slate-800">
            <tr className="font-bold">
              <td className="px-4 sm:px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">equalizer</span>
                  <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">Total Acumulado</span>
                </div>
              </td>
              <td className="px-3 sm:px-4 py-4 text-center text-slate-100 font-bold text-sm">{totalLunes}</td>
              <td className="px-3 sm:px-4 py-4 text-center text-slate-100 font-bold text-sm">{totalMartes}</td>
              <td className="px-3 sm:px-4 py-4 text-center text-slate-100 font-bold text-sm">{totalMiercoles}</td>
              <td className="px-3 sm:px-4 py-4 text-center text-slate-100 font-bold text-sm">{totalJueves}</td>
              <td className="px-3 sm:px-4 py-4 text-center text-slate-100 font-bold text-sm">{totalViernes}</td>
              <td className="px-3 sm:px-4 py-4 text-center text-slate-100 font-bold text-sm">{totalSabado}</td>
              <td className="px-3 sm:px-4 py-4 text-center text-slate-500 font-bold text-sm">{totalDomingo}</td>
              <td className="px-3 sm:px-4 py-4 text-center text-secondary font-black text-base bg-secondary/10 border-l border-slate-800">
                {granTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function JciTablasView({
  creditoRows,
  concesionRows,
  periodoLabel = "Período actual",
}: JciTablasViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ─── TABLA 1: DETALLE DE EQUIPOS A CRÉDITO ──────────────────────── */}
      <AuditoriaDiariaTabla
        title="Detalle de equipos a Crédito"
        subtitle="Visualización diaria de equipos ingresados a crédito por proveedor."
        icon="credit_score"
        rows={creditoRows}
        periodoLabel={periodoLabel}
      />

      {/* ─── TABLA 2: DETALLE DE EQUIPOS A CONCESIÓN ────────────────────── */}
      <AuditoriaDiariaTabla
        title="Detalle de equipos a Concesión"
        subtitle="Visualización diaria de equipos ingresados a concesión por proveedor."
        icon="handshake"
        rows={concesionRows}
        periodoLabel={periodoLabel}
      />
    </div>
  );
}
