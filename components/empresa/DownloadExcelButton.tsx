'use client';

import React from "react";
import * as XLSX from "xlsx";
import { calculateSaldoRestante, calculateSemanasTranscurridas, formatFechaDDMMYYYY } from "@/utils/date-tijuana";

type DownloadPreset = 'stock' | 'ventas' | 'comprobantes' | 'ordenes_entrega' | 'garantias' | 'ordenes_garantia' | 'seguimiento_pagos';

interface RepartidorOption {
  id: string;
  nombre: string;
}

interface DownloadExcelButtonProps {
  data: any[];
  type: DownloadPreset;
  repartidores?: RepartidorOption[];
  label?: string;
  className?: string;
}

export default function DownloadExcelButton({ data, type, repartidores, label, className }: DownloadExcelButtonProps) {

  const downloadExcel = () => {
    if (!data || data.length === 0) return;

    let worksheetData: any[] = [];
    let fileNamePrefix = "Data";
    let sheetName = "Hoja 1";

    if (type === 'stock') {
      fileNamePrefix = "Stock";
      sheetName = "Stock";
      worksheetData = data.map(stockItem => {
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
        } catch {
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
        "Fecha Próximo Pago": item.fecha_proximo_pago || "",
        "Precio Compra": item.precio_compra,
        "Pago Inicial": item.pago_inicial,
        "Pago Recibido": item.pago_recibido,
        "Pago Semanal": item.pago_semanal ?? "",
        "Plazos": item.plazos ?? "",
        "Precio Total": item.precio_total ?? "",
        "Tag": item.tag || "",
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
    else if (type === 'seguimiento_pagos') {
      fileNamePrefix = "Seguimiento_Pagos";
      sheetName = "Seguimiento de Pagos";
      worksheetData = data.map(item => {
        const totalSemanas = item.plazos || 0;
        const semanaActualIndice = calculateSemanasTranscurridas(item.fecha_proximo_pago, totalSemanas);
        const semanaKey = `semana_${semanaActualIndice || 1}`;
        const estadoActual = item.estados_semanales?.[semanaKey] || 'En revisión';
        const saldoRestante = calculateSaldoRestante(
          item.precio_total,
          item.pago_inicial,
          item.pago_semanal,
          item.fecha_proximo_pago,
          item.plazos
        );

        return {
          "Cliente": item.nombre_cliente || "",
          "Celular": item.celular || "—",
          "Color": item.color_celular || "—",
          "IMEI": item.imei || "—",
          "Vendedor": item.vendedor?.username || "—",
          "Repartidor": item.repartidor?.nombre || "—",
          "Tag": item.tag || "",
          "Próximo Pago": item.fecha_proximo_pago ? formatFechaDDMMYYYY(item.fecha_proximo_pago) : "Sin fecha",
          "Saldo Restante": saldoRestante,
          "Semana Actual": semanaActualIndice ? `Semana ${semanaActualIndice} de ${totalSemanas}` : "",
          "Estado Semana": estadoActual,
          "Pago Semanal": item.pago_semanal || 0,
          "Precio Total": item.precio_total || 0,
          "Pago Inicial": item.pago_inicial || 0,
          "Plazos": item.plazos || 0
        };
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const fileName = `${fileNamePrefix}_Finvora_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const titles: Record<DownloadPreset, string> = {
    stock: "Descargar Stock en Excel",
    ventas: "Descargar Historial de Ventas",
    comprobantes: "Descargar Comprobantes en Excel",
    ordenes_entrega: "Descargar Órdenes de Entrega en Excel",
    garantias: "Descargar Historial de Garantías en Excel",
    ordenes_garantia: "Descargar Órdenes de Garantía en Excel",
    seguimiento_pagos: "Descargar Seguimiento de Pagos en Excel"
  };

  const isDisabled = !data || data.length === 0;

  const defaultClassName = `flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl transition-all ${
    isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-700 hover:text-white cursor-pointer"
  }`;

  return (
    <button
      onClick={downloadExcel}
      disabled={isDisabled}
      className={className || defaultClassName}
      title={titles[type]}
    >
      <span className="material-symbols-outlined text-base md:text-xl shrink-0">download</span>
      {label && <span className="text-xs md:text-sm font-semibold">{label}</span>}
    </button>
  );
}
