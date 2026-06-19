'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";
import JSZip from "jszip";
import { styles, formatTijuanaDate, formatCurrency } from "./comprobantes-types";

interface MisOperacionesClientPageProps {
  comprobantesList: ComprobanteRecord[];
}

export default function MisOperacionesClientPage({
  comprobantesList
}: MisOperacionesClientPageProps) {
  // Estado para filtros: Fechas
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Estados para descarga masiva de archivos
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");

  // Filtrado en memoria
  const filteredList = useMemo(() => {
    return comprobantesList.filter((item) => {
      // Filtro de fecha en zona horaria Tijuana
      const tijuanaDateStr = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(item.created_at)); // Retorna "YYYY-MM-DD"

      if (dateFrom && tijuanaDateStr < dateFrom) return false;
      if (dateTo && tijuanaDateStr > dateTo) return false;

      return true;
    });
  }, [comprobantesList, dateFrom, dateTo]);

  // Descarga masiva empaquetada en ZIP
  const handleDownloadAllFiles = async () => {
    if (filteredList.length === 0) return;
    setIsDownloading(true);
    const zip = new JSZip();

    for (let i = 0; i < filteredList.length; i++) {
      const item = filteredList[i];
      const url = item.comprobante_url;
      setDownloadProgress(`Descargando ${i + 1} de ${filteredList.length}...`);

      try {
        const response = await fetch(url);
        const blob = await response.blob();

        const ext = url.split('.').pop()?.split('?')[0] || 'png';
        const vendorName = item.vendedor?.username || 'vendedor';
        const formattedDate = new Intl.DateTimeFormat('es-MX', {
          timeZone: 'America/Tijuana',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(new Date(item.created_at)).replace(/[/:\s,]/g, '_');

        const fileName = `Comprobante_${vendorName}_${formattedDate}.${ext}`;
        zip.file(fileName, blob);
      } catch (error) {
        console.error("Error al agregar archivo al ZIP:", url, error);
      }
    }

    setDownloadProgress("Generando archivo ZIP...");
    try {
      const zipContent = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipContent);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = `Comprobantes_MisOperaciones_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al generar o descargar el ZIP:", error);
    }

    setIsDownloading(false);
    setDownloadProgress("");
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Mis Operaciones
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">Consulta tu historial personal de entregas y ventas registradas.</p>
        </div>
        <Link href="/empresa/webapp" className="flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer" title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* Contenedor de la Tabla */}
      <div className={styles.tableContainer}>
        {/* Header de la Tabla */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Historial Reciente</h3>
            <p className="text-xs text-slate-400 mt-1">Lista de comprobantes asociados a tus operaciones de los últimos 2 meses.</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 self-center">
            <DownloadExcelButton data={filteredList} type="comprobantes" />

            <button
              type="button"
              onClick={handleDownloadAllFiles}
              disabled={isDownloading || filteredList.length === 0}
              className="flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-secondary text-slate-950 rounded-xl hover:bg-secondary/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-secondary/15"
              title={isDownloading ? downloadProgress : `Descargar archivos (${filteredList.length})`}
            >
              {isDownloading ? (
                <span className="animate-spin h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full" />
              ) : (
                <span className="material-symbols-outlined text-base md:text-xl">download</span>
              )}
            </button>
          </div>
        </div>

        {/* Filtros Integrados */}
        <div className="bg-slate-900/50 p-6 border-b border-slate-800/60 flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filtro de Fechas */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base">calendar_month</span>
                <span className="text-slate-300 font-semibold text-sm">Fechas:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs sm:text-sm text-slate-400 font-semibold min-w-[85px] sm:min-w-0 shrink-0">Desde:</label>
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
                <label className="text-xs sm:text-sm text-slate-400 font-semibold min-w-[85px] sm:min-w-0 shrink-0">Hasta:</label>
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

            {/* Limpiar Filtros / Estado de descarga */}
            {(dateFrom || dateTo || isDownloading) && (
              <div className="flex items-center gap-4 w-full sm:w-auto sm:ml-auto justify-end max-sm:justify-start">
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Limpiar Filtros
                  </button>
                )}
                {isDownloading && (
                  <div className="text-xs text-secondary font-semibold animate-pulse flex items-center gap-2">
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-secondary border-t-transparent rounded-full" />
                    {downloadProgress}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Fecha</th>
                <th className={styles.th}>Cliente</th>
                <th className={styles.th}>Vendedor</th>
                <th className={styles.th}>Repartidor/Ubicación</th>
                <th className={styles.th}>Equipo</th>
                <th className={styles.th}>Pago Recibido</th>
                <th className={styles.th}>Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                    No tienes operaciones registradas en el período o que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span className="text-slate-100">{formatTijuanaDate(item.created_at)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className="text-slate-100 font-bold">{item.nombre_cliente}</span>
                    </td>
                    <td className={styles.td}>
                      {item.vendedor ? (
                        <div className="flex flex-col items-center">
                          <span className="text-slate-100 font-bold">{item.vendedor.username.charAt(0).toUpperCase() + item.vendedor.username.slice(1)}</span>
                          <span className="text-[10px] text-slate-500">{item.vendedor.role}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Desconocido</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {item.repartidor ? (
                        <div className="flex flex-col items-center">
                          <span className="text-slate-100 font-bold">{item.repartidor.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Desconocido</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {item.celular ? (
                        <div className="flex flex-col items-center">
                          <span className="text-slate-100 text-xs font-bold">{item.celular}</span>
                          {item.color_celular && <span className="text-[10px] text-slate-500">{item.color_celular}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className="text-slate-300">{formatCurrency(item.pago_recibido)}</span>
                    </td>
                    <td className={styles.td}>
                      <a
                        href={item.comprobante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkBtn}
                        title="Ver archivo"
                      >
                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
