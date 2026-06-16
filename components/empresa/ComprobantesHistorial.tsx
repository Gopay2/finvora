'use client';

import React, { useState, useMemo } from "react";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";
import JSZip from "jszip";
import FiltrosHistorial from "./FiltrosHistorial";
import { styles, formatTijuanaDate, formatCurrency } from "./comprobantes-types";
import type { OptionItem } from "./comprobantes-types";

interface ComprobantesHistorialProps {
  comprobantes: ComprobanteRecord[];
  vendedores: OptionItem[];
  repartidores: OptionItem[];
  onDeleteRequest: (item: ComprobanteRecord) => void;
}

export default function ComprobantesHistorial({
  comprobantes,
  vendedores,
  repartidores,
  onDeleteRequest
}: ComprobantesHistorialProps) {
  // Estado para los filtros compartidos con el sub-componente modular
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    filterVendedor: "",
    filterRepartidor: ""
  });

  // Estados para descarga masiva de archivos
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");

  // Filtrado en memoria por rango de fechas, vendedor y repartidor/ubicación
  const filteredList = useMemo(() => {
    return comprobantes.filter((item) => {
      // Filtro de fecha
      const tijuanaDateStr = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(item.created_at)); // Retorna "YYYY-MM-DD"

      if (filters.dateFrom && tijuanaDateStr < filters.dateFrom) return false;
      if (filters.dateTo && tijuanaDateStr > filters.dateTo) return false;

      // Filtro de vendedor
      if (filters.filterVendedor && (!item.vendedor || item.vendedor.id !== filters.filterVendedor)) return false;

      // Filtro de repartidor/ubicación
      if (filters.filterRepartidor && (!item.repartidor || item.repartidor.id !== filters.filterRepartidor)) return false;

      return true;
    });
  }, [comprobantes, filters]);

  // Descarga en lote empaquetada en un solo archivo ZIP para soportar dispositivos móviles
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

        const ext = url.split('.').pop()?.split('?')[0] || 'bin';
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
      downloadAnchor.download = `Comprobantes_Finvora_${new Date().toISOString().split('T')[0]}.zip`;
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

  return (
    <div className={styles.tableContainer}>
      {/* Header con botón para Excel y descarga masiva */}
      <div className="bg-slate-950 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Registro Histórico</h3>
          <p className="text-xs text-slate-400 mt-1">Lista detallada de comprobantes cargados.</p>
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

      {/* Filtros Modulares */}
      <FiltrosHistorial
        vendedores={vendedores}
        repartidores={repartidores}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        onFilterChange={setFilters}
      />

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
              <th className={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">
                  No hay comprobantes que coincidan con los filtros aplicados.
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
                  <td className={styles.td}>
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(item)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer animate-in duration-200"
                        title="Eliminar Comprobante"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
