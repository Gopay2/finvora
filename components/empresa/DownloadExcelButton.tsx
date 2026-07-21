'use client';

import React from "react";
import * as XLSX from "xlsx";

type DownloadPreset = 'stock' | 'ventas' | 'comprobantes' | 'ordenes_entrega' | 'garantias' | 'ordenes_garantia';

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
        "Nombre Cliente": item.nombre_cliente || "",
        "Comentarios": item.comentarios || "",
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
    else if (type === 'ordenes_entrega') {
      fileNamePrefix = "Ordenes_Entrega";
      sheetName = "Ordenes de Entrega";
      worksheetData = data.map(orden => ({
        "Folio": orden.folio || "",
        "Fecha Entrega": orden.fecha_entrega || "N/A",
        "Hora Entrega": orden.hora_entrega || "N/A",
        "Cliente": orden.nombre_cliente || "",
        "Teléfono": orden.telefono || "",
        "Dirección": orden.direccion || "",
        "Celular": orden.celular || "",
        "Color": orden.color_celular || "",
        "Enganche": orden.enganche || 0,
        "IMEI": orden.imei || "N/A",
        "Cuenta Activa": orden.cuenta_activa || "N/A",
        "Historial Cliente": orden.cliente_historial || "N/A",
        "Zona": orden.zona || "",
        "Repartidor": orden.repartidor || (orden.repartidores?.nombre || "Sin Asignar"),
        "Vendedor": orden.vendedor?.username || "Desconocido",
        "CURP": orden.curp || "",
        "Identificación": orden.identificacion_fisica || "",
        "Especificar Local": orden.especificar_local || "",
        "Comentarios": orden.comentarios || "",
        "Creado en": new Date(orden.created_at).toLocaleDateString('es-AR') + " " + new Date(orden.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }));
    }
    else if (type === 'garantias') {
      fileNamePrefix = "Garantias";
      sheetName = "Garantias";
      worksheetData = data.map(garantiaItem => ({
        "IMEI": garantiaItem.imei,
        "Marca": garantiaItem.productos?.marca || "N/A",
        "Modelo": garantiaItem.productos?.modelo || "N/A",
        "Color": garantiaItem.productos?.color || "N/A",
        "RAM": garantiaItem.productos?.ram || "N/A",
        "Almacenamiento": garantiaItem.productos?.almacenamiento || "N/A",
        "Ubicación": garantiaItem.repartidor?.nombre || "Sin Asignar",
        "Solicitado Por": garantiaItem.solicitante?.username || "Desconocido",
        "Motivo": garantiaItem.motivo || "",
        "Fecha Ingreso": new Date(garantiaItem.fecha_ingreso).toLocaleDateString('es-AR'),
        "Fecha Garantía": new Date(garantiaItem.fecha_garantia).toLocaleDateString('es-AR') + " " + new Date(garantiaItem.fecha_garantia).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }));
    }
    else if (type === 'ordenes_garantia') {
      fileNamePrefix = "Ordenes_Garantia";
      sheetName = "Órdenes de Garantía";
      worksheetData = data.map(orden => ({
        "Folio": orden.folio || "",
        "Fecha Registro": new Date(orden.created_at).toLocaleDateString('es-AR') + " " + new Date(orden.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        "Cliente": orden.nombre_cliente || "",
        "Teléfono": orden.telefono || "",
        "Ubicación / Maps": orden.ubicacion || "",
        "Zona": orden.zona || "",
        "Modelo Equipo": orden.modelo || "",
        "IMEI": orden.imei || "",
        "Tag": orden.tag || "",
        "Vendedor": orden.vendedor?.username || "Desconocido",
        "Fecha de Compra": orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-AR') : "N/A",
        "Costo Equipo": orden.costo_equipo || 0,
        "Enganche Registrado": orden.enganche_registrado || 0,
        "Enganche Recibido": orden.enganche_recibido || 0,
        "Motivo Garantía": orden.motivo_garantia || "",
        "Descripción de Falla": orden.descripcion_falla || "",
        "Accesorios Entregados": orden.accesorios_entregados || "",
        "Estado fisico del equipo al recibir": orden.estado_fisico || "",
        "Observaciones": orden.observaciones || ""
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
    comprobantes: "Descargar Comprobantes en Excel",
    ordenes_entrega: "Descargar Órdenes de Entrega en Excel",
    garantias: "Descargar Historial de Garantías en Excel",
    ordenes_garantia: "Descargar Órdenes de Garantía en Excel"
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
