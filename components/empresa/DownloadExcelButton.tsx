'use client';

import React from "react";
import * as XLSX from "xlsx";

type DownloadPreset = 'stock' | 'ventas';

interface DownloadExcelButtonProps {
  data: any[];
  type: DownloadPreset;
}

export default function DownloadExcelButton({ data, type }: DownloadExcelButtonProps) {
  
  const downloadExcel = () => {
    if (!data || data.length === 0) return;

    let worksheetData: any[] = [];
    let fileNamePrefix = "Data";
    let sheetName = "Hoja 1";

    // Centralizamos aquí las "recetas" de transformación
    if (type === 'stock') {
      fileNamePrefix = "Stock";
      sheetName = "Stock";
      worksheetData = data.map(item => ({
        "IMEI": item.imei,
        "Marca": item.productos?.marca || "N/A",
        "Modelo": item.productos?.modelo || "N/A",
        "Color": item.productos?.color || "N/A",
        "RAM": item.productos?.ram || "N/A",
        "Almacenamiento": item.productos?.almacenamiento || "N/A",
        "Ubicación": item.zona,
        "Estado": item.estado,
        "Fecha de Ingreso": new Date(item.fecha_ingreso).toLocaleDateString('es-AR')
      }));
    } 
    else if (type === 'ventas') {
      fileNamePrefix = "Ventas";
      sheetName = "Ventas";
      worksheetData = data.map(item => ({
        "IMEI": item.imei,
        "Marca": item.productos?.marca || "N/A",
        "Modelo": item.productos?.modelo || "N/A",
        "Color": item.productos?.color || "N/A",
        "RAM": item.productos?.ram || "N/A",
        "Almacenamiento": item.productos?.almacenamiento || "N/A",
        "Ubicación": item.zona,
        "Vendedor": item.vendedor?.username || "Desconocido",
        "Precio Costo": item.precio_costo,
        "Fecha Ingreso": new Date(item.fecha_ingreso).toLocaleDateString('es-AR'),
        "Fecha Venta": new Date(item.fecha_venta).toLocaleDateString('es-AR') + " " + new Date(item.fecha_venta).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
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
    ventas: "Descargar Historial de Ventas"
  };

  return (
    <button 
      onClick={downloadExcel}
      className="flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
      title={titles[type]}
    >
      <span className="material-symbols-outlined text-xl">download</span>
    </button>
  );
}
