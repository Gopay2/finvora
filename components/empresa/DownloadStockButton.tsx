'use client';

import React from "react";
import * as XLSX from "xlsx";

interface StockItem {
  imei: string;
  zona: string;
  estado: string;
  fecha_ingreso: string;
  productos: {
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
    ram: string;
  };
}

interface DownloadStockButtonProps {
  data: StockItem[];
}

export default function DownloadStockButton({ data }: DownloadStockButtonProps) {
  const downloadExcel = () => {
    // 1. Transformamos los datos para que el Excel sea legible
    const worksheetData = data.map(item => ({
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

    // 2. Creamos el libro y la hoja
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

    // 3. Generamos el archivo y disparamos la descarga
    const fileName = `Stock_Finvora_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <button 
      onClick={downloadExcel}
      className="flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
      title="Descargar Stock en Excel"
    >
      <span className="material-symbols-outlined text-xl">download</span>
    </button>
  );
}
