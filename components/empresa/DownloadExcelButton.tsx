'use client';

import React from "react";
import * as XLSX from "xlsx";

type DownloadPreset = 'stock' | 'ventas' | 'comprobantes';

interface RepartidorOption {
  id: string;
  nombre: string;
}

interface DownloadExcelButtonProps {
  data: any[];
  type: DownloadPreset;
  repartidores?: RepartidorOption[];
}

export default function DownloadExcelButton({ data, type, repartidores }: DownloadExcelButtonProps) {

  const downloadExcel = () => {
    if (!data || data.length === 0) return;

    let worksheetData: any[] = [];
    let fileNamePrefix = "Data";
    let sheetName = "Hoja 1";

    // Centralizamos aquí las "recetas" de transformación
    if (type === 'stock') {
      fileNamePrefix = "Stock";
      sheetName = "Stock";
      worksheetData = data.map(stockItem => {
        // Mapear el UUID zona al nombre del repartidor
        const nombreUbicacion = repartidores
          ? (repartidores.find(repartidor => repartidor.id === stockItem.zona)?.nombre || "Sin Asignar")
          : (stockItem.zona || "Sin Asignar");

        return {
          "IMEI": stockItem.imei,
          "Marca": stockItem.productos?.marca || "N/A",
          "Modelo": stockItem.productos?.modelo || "N/A",
          "Color": stockItem.productos?.color || "N/A",
          "RAM": stockItem.productos?.ram || "N/A",
          "Almacenamiento": stockItem.productos?.almacenamiento || "N/A",
          "Ubicación": nombreUbicacion,
          "Estado": stockItem.estado,
          "Fecha de Ingreso": new Date(stockItem.fecha_ingreso).toLocaleDateString('es-AR')
        };
      });
    }
    else if (type === 'ventas') {
      fileNamePrefix = "Ventas";
      sheetName = "Ventas";
      worksheetData = data.map(ventaItem => ({
        "IMEI": ventaItem.imei,
        "Marca": ventaItem.productos?.marca || "N/A",
        "Modelo": ventaItem.productos?.modelo || "N/A",
        "Color": ventaItem.productos?.color || "N/A",
        "RAM": ventaItem.productos?.ram || "N/A",
        "Almacenamiento": ventaItem.productos?.almacenamiento || "N/A",
        "Ubicación": ventaItem.repartidor?.nombre || "Sin Asignar",
        "Vendedor": ventaItem.vendedor?.username || "Desconocido",
        "Precio Costo": ventaItem.precio_costo,
        "Fecha Ingreso": new Date(ventaItem.fecha_ingreso).toLocaleDateString('es-AR'),
        "Fecha Venta": new Date(ventaItem.fecha_venta).toLocaleDateString('es-AR') + " " + new Date(ventaItem.fecha_venta).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }));
    }
    else if (type === 'comprobantes') {
      fileNamePrefix = "Comprobantes";
      sheetName = "Comprobantes";

      const formatTijuanaDate = (dateStr: string) => {
        try {
          return new Intl.DateTimeFormat('es-MX', {
            timeZone: 'America/Tijuana',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).format(new Date(dateStr));
        } catch (e) {
          return dateStr;
        }
      };

      worksheetData = data.map(item => ({
        "Fecha (Tijuana)": formatTijuanaDate(item.created_at),
        "Vendedor": item.vendedor?.username || "Desconocido",
        "Repartidor": item.repartidor?.nombre || "Desconocido",
        "Celular": item.celular || "",
        "Color": item.color_celular || "",
        "IMEI": item.imei || "",
        "Precio Compra": item.precio_compra,
        "Pago Inicial": item.pago_inicial,
        "Pago Recibido": item.pago_recibido,
        "Cargado Por": item.creador?.username || "Desconocido",
        "URL Comprobante": item.comprobante_url
      }));
    }

    // Proceso de generación de Excel
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const fileName = `${fileNamePrefix}_Finvora_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const titles = {
    stock: "Descargar Stock en Excel",
    ventas: "Descargar Historial de Ventas",
    comprobantes: "Descargar Comprobantes en Excel"
  };

  const isDisabled = !data || data.length === 0;

  return (
    <button
      onClick={downloadExcel}
      disabled={isDisabled}
      className={`flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl transition-all ${isDisabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-slate-700 hover:text-white cursor-pointer"
        }`}
      title={titles[type]}
    >
      <span className="material-symbols-outlined text-base md:text-xl">download</span>
    </button>
  );
}
