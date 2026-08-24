import * as XLSX from "xlsx";
import type { ComprobanteRecord, MappedUser } from "@/types/sueldos";

interface ExportarSueldosExcelProps {
  empleado: MappedUser;
  operaciones: ComprobanteRecord[];
  config: {
    plataformaVal: number;
    entregaVal: number;
    comisionPercent: number;
    bonoVal: number;
    sueldoVal: number;
    publicidadVal: number;
    cancelacionesCount?: number;
    recoleccionCount?: number;
    garantiasCount?: number;
    rowEntregaOverrides: { [id: string]: string };
  };
  totalComision: number;
}

export function exportarSueldosExcel({
  empleado,
  operaciones,
  config,
  totalComision
}: ExportarSueldosExcelProps) {
  const isRepartidor = empleado.role?.toLowerCase() === "repartidor";
  const cancelacionesCount = config.cancelacionesCount || 0;
  const recoleccionCount = config.recoleccionCount || 0;
  const garantiasCount = config.garantiasCount || 0;

  const formatTijuanaOnlyDate = (dateStr: string) => {
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
      }
      return new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const getEquipmentName = (item: ComprobanteRecord) => {
    if (item.celular) {
      return `${item.celular}${item.color_celular ? ` (${item.color_celular})` : ""}`;
    }
    return "—";
  };

  let headers: string[] = [];
  let bodyRows: (string | number)[][] = [];

  if (isRepartidor) {
    headers = ["Fecha", "Equipo", "Entrega", "Pago Recibido", "Cancelaciones", "Recolección", "Garantías", "Comisión"];
    bodyRows = operaciones.map((item) => {
      const rowEntrega = config.rowEntregaOverrides[item.id] !== undefined
        ? (Number(config.rowEntregaOverrides[item.id]) || 0)
        : config.entregaVal;
      const pagoRecibido = Number(item.pago_recibido) || 0;
      const comision = rowEntrega - pagoRecibido;

      return [
        formatTijuanaOnlyDate(item.created_at),
        getEquipmentName(item),
        rowEntrega,
        -pagoRecibido,
        "—",
        "—",
        "—",
        comision
      ];
    });

    if (cancelacionesCount > 0) {
      for (let i = 0; i < cancelacionesCount; i++) {
        bodyRows.push([
          "—",
          `Cancelación #${i + 1}`,
          "—",
          "—",
          150,
          "—",
          "—",
          150
        ]);
      }
    }

    if (recoleccionCount > 0) {
      for (let i = 0; i < recoleccionCount; i++) {
        bodyRows.push([
          "—",
          `Recolección #${i + 1}`,
          "—",
          "—",
          "—",
          150,
          "—",
          150
        ]);
      }
    }

    if (garantiasCount > 0) {
      for (let i = 0; i < garantiasCount; i++) {
        bodyRows.push([
          "—",
          `Garantía #${i + 1}`,
          "—",
          "—",
          "—",
          "—",
          450,
          450
        ]);
      }
    }
  } else {
    headers = ["Fecha", "Equipo", "P. Compra", "Costo Eq.", "P. Inicial", "Plataforma", "Entrega", "P. Recibido", "Sub-Total", "Comisión"];
    bodyRows = operaciones.map((item) => {
      const costoEquipo = Number(item.costo_equipo) || 0;
      const precioCompra = Number(item.precio_compra) || 0;
      const pagoInicial = Number(item.pago_inicial) || 0;
      const pagoRecibido = Number(item.pago_recibido) || 0;
      const rowEntrega = config.rowEntregaOverrides[item.id] !== undefined
        ? (Number(config.rowEntregaOverrides[item.id]) || 0)
        : config.entregaVal;

      const subTotal = precioCompra - costoEquipo - pagoInicial - config.plataformaVal - rowEntrega + pagoRecibido;
      const comision = subTotal * (config.comisionPercent / 100);

      return [
        formatTijuanaOnlyDate(item.created_at),
        getEquipmentName(item),
        precioCompra,
        -costoEquipo,
        -pagoInicial,
        -config.plataformaVal,
        -rowEntrega,
        pagoRecibido,
        subTotal,
        comision
      ];
    });
  }

  const aoaData: (string | number)[][] = [];

  // 1. Encabezados de operaciones
  aoaData.push(headers);

  // 2. Filas de operaciones o placeholder si está vacío
  if (bodyRows.length === 0) {
    const emptyRow = Array(headers.length).fill("—");
    emptyRow[1] = "Sin operaciones registradas en el período";
    aoaData.push(emptyRow);
  } else {
    bodyRows.forEach((row) => aoaData.push(row));
  }

  // 3. Fila separadora
  aoaData.push([]);

  // 4. Sección de Extras y Total Comisión
  aoaData.push(["EXTRAS Y TOTAL COMISIÓN"]);
  aoaData.push(["Concepto", "Monto"]);

  if (isRepartidor) {
    const netoACobrar = totalComision + config.bonoVal + config.sueldoVal;
    aoaData.push(["Bono", config.bonoVal]);
    aoaData.push(["Sueldo", config.sueldoVal]);
    aoaData.push(["Total Comisión", totalComision]);
    aoaData.push(["NETO A COBRAR", netoACobrar]);
  } else {
    const netoACobrar = totalComision + config.bonoVal + config.sueldoVal - config.publicidadVal;
    aoaData.push(["Bono", config.bonoVal]);
    aoaData.push(["Sueldo", config.sueldoVal]);
    aoaData.push(["Publicidad", -config.publicidadVal]);
    aoaData.push(["Total Comisión", totalComision]);
    aoaData.push(["NETO A COBRAR", netoACobrar]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Anchos automáticos de columnas
  worksheet["!cols"] = isRepartidor
    ? [
        { wch: 14 }, // Fecha
        { wch: 30 }, // Equipo
        { wch: 14 }, // Entrega
        { wch: 16 }, // Pago Recibido
        { wch: 15 }, // Cancelaciones
        { wch: 15 }, // Recolección
        { wch: 15 }, // Garantías
        { wch: 14 }, // Comisión
      ]
    : [
        { wch: 14 }, // Fecha
        { wch: 30 }, // Equipo
        { wch: 14 }, // P. Compra
        { wch: 14 }, // Costo Eq.
        { wch: 14 }, // P. Inicial
        { wch: 14 }, // Plataforma
        { wch: 14 }, // Entrega
        { wch: 15 }, // P. Recibido
        { wch: 15 }, // Sub-Total
        { wch: 14 }, // Comisión
      ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Liquidación");

  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `Liquidacion_${empleado.username}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export interface ExportarConsolidadoExcelProps {
  empleados: {
    id: string;
    username: string;
    role: string;
    operacionesCount: number;
    totalPagar: number;
  }[];
  totalOperaciones: number;
  granTotalPagar: number;
  periodo?: {
    desde?: string;
    hasta?: string;
  };
}

export function exportarSueldosConsolidadoExcel({
  empleados,
  totalOperaciones,
  granTotalPagar,
  periodo,
}: ExportarConsolidadoExcelProps) {
  const aoaData: (string | number)[][] = [];

  // Título
  aoaData.push(["FINVORA - LIQUIDACIÓN CONSOLIDADA DE EMPLEADOS"]);
  if (periodo?.desde || periodo?.hasta) {
    const pDesde = periodo.desde ? periodo.desde.split('-').reverse().join('/') : "Inicio";
    const pHasta = periodo.hasta ? periodo.hasta.split('-').reverse().join('/') : "Actualidad";
    aoaData.push([`Período: ${pDesde} - ${pHasta}`]);
  }
  aoaData.push([]);

  // Encabezados
  aoaData.push(["Empleado", "Rol", "Operaciones", "Total a Pagar"]);

  // Filas por empleado
  empleados.forEach((emp) => {
    const displayName = emp.username.charAt(0).toUpperCase() + emp.username.slice(1);
    const roleCapitalized = emp.role ? (emp.role.charAt(0).toUpperCase() + emp.role.slice(1)) : "Sin Rol";
    aoaData.push([
      displayName,
      roleCapitalized,
      emp.operacionesCount,
      emp.totalPagar
    ]);
  });

  // Fila separadora
  aoaData.push([]);

  // Fila de Total General
  aoaData.push(["TOTAL GENERAL APROX", "Todos", totalOperaciones, granTotalPagar]);

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  worksheet["!cols"] = [
    { wch: 25 }, // Empleado
    { wch: 18 }, // Rol
    { wch: 16 }, // Operaciones
    { wch: 20 }, // Total a Pagar
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen Global");

  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `Liquidacion_Consolidada_Todos_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
