import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import type { MappedUser } from "@/app/empresa/webapp/sueldos/page";

// ─── CONFIGURACIÓN EDITABLE DEL PDF ───
export const PDF_CONFIG = {
  empresaNombre: "FINVORA",
  empresaSubtitulo: "Liquidación de Haberes y Operaciones",
  empresaDetalle: "Tijuana, B.C., México",
  tituloRecibo: "DETALLE DE LIQUIDACIÓN DE SUELDO",
  colores: {
    primario: [15, 23, 42] as [number, number, number],      // Slate 900
    secundario: [71, 85, 105] as [number, number, number],  // Slate 600
    textoPrincipal: [51, 65, 85] as [number, number, number], // Slate 700
    textoOscuro: [15, 23, 42] as [number, number, number],    // Slate 900
    grisClaro: [248, 250, 252] as [number, number, number],  // Slate 50
    grisBorde: [226, 232, 240] as [number, number, number],  // Slate 200
  }
};

// ─── UTILIDADES DE FORMATEO LOCALES ───

/**
 * Formatea un string de fecha a formato local DD/MM/YYYY.
 * Si es un input literal "YYYY-MM-DD", preserva el valor literal para evitar desvíos de zona horaria.
 * Si es un timestamp completo, lo formatea bajo la zona horaria 'America/Tijuana'.
 * 
 * @param dateStr - El string de fecha o timestamp a formatear.
 * @returns La fecha formateada en formato "DD/MM/YYYY" o el string original en caso de error.
 */
const formatTijuanaOnlyDate = (dateStr: string) => {
  try {
    // Si viene de un input tipo date (YYYY-MM-DD), parsear literalmente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    }
    
    // Si es un timestamp completo de la base de datos (con zona horaria)
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Tijuana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(dateStr));
  } catch (error) {
    return dateStr;
  }
};

/**
 * Formatea un valor numérico a moneda mexicana (MXN).
 * 
 * @param value - El monto numérico a formatear.
 * @returns El string formateado como moneda, por ejemplo, "$1,500.00".
 */
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
};

/**
 * Propiedades requeridas para la generación del recibo PDF de sueldos.
 */
interface ExportarReciboPDFProps {
  /** El perfil y rol del empleado a liquidar */
  empleado: MappedUser;
  /** El listado de comprobantes/operaciones filtradas en el período */
  operaciones: ComprobanteRecord[];
  /** La configuración de valores, bonos y descuentos ingresada en el cliente */
  config: {
    plataformaVal: number;
    entregaVal: number;
    comisionPercent: number;
    bonoVal: number;
    sueldoVal: number;
    publicidadVal: number;
    rowEntregaOverrides: { [id: string]: string };
  };
  /** El período de fechas de los filtros aplicados */
  periodo: {
    desde: string;
    hasta: string;
  };
  /** La sumatoria de comisiones calculada por el cliente */
  totalComision: number;
}

/**
 * Genera, maqueta y descarga un documento PDF en formato A4 Vertical que detalla la
 * liquidación de haberes y desglose de operaciones de un empleado para la empresa FINVORA.
 * 
 * @param props - Propiedades de configuración y datos del empleado.
 */
export async function exportarReciboPDF({
  empleado,
  operaciones,
  config,
  periodo,
  totalComision
}: ExportarReciboPDFProps) {
  const isRepartidor = empleado.role?.toLowerCase() === "repartidor";

  // Intentar cargar el logo de la empresa desde la ruta pública
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = "/brands/logorecibo.png";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  } catch (e) {
    console.warn("No se pudo cargar el logo de Finvora, se usará texto de respaldo.");
  }

  // ─── 1. INICIALIZACIÓN DEL DOCUMENTO A4 ───
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const marginX = 12;
  const areaWidth = 210 - (2 * marginX); // 186mm
  let currentY = 15;

  // ─── 2. RENDERIZADO DEL ENCABEZADO Y LOGO DE LA EMPRESA ───
  if (logoImg) {
    // Dibujar logo de 32mm de ancho por 11mm de alto
    doc.addImage(logoImg, "PNG", marginX, currentY - 3, 32, 11);
    currentY += 14;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(PDF_CONFIG.colores.primario[0], PDF_CONFIG.colores.primario[1], PDF_CONFIG.colores.primario[2]);
    doc.text(PDF_CONFIG.empresaNombre, marginX, currentY);
    currentY += 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(PDF_CONFIG.colores.secundario[0], PDF_CONFIG.colores.secundario[1], PDF_CONFIG.colores.secundario[2]);
  doc.text(PDF_CONFIG.empresaSubtitulo, marginX, currentY);

  // Fecha de Emisión (Alineado a la derecha en la misma línea superior, fija en Y = 16)
  const fechaEmision = new Date().toLocaleDateString('es-MX');
  doc.setFont("helvetica", "bold");
  doc.text(`Emisión: ${fechaEmision}`, 210 - marginX, 16, { align: "right" });

  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(PDF_CONFIG.empresaDetalle, marginX, currentY);

  currentY += 5.5;
  // Línea divisoria superior
  doc.setDrawColor(PDF_CONFIG.colores.grisBorde[0], PDF_CONFIG.colores.grisBorde[1], PDF_CONFIG.colores.grisBorde[2]);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, 210 - marginX, currentY);

  currentY += 8;

  // ─── 3. TÍTULO PRINCIPAL DEL RECIBO ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(PDF_CONFIG.colores.primario[0], PDF_CONFIG.colores.primario[1], PDF_CONFIG.colores.primario[2]);
  doc.text(PDF_CONFIG.tituloRecibo, marginX, currentY);

  currentY += 4;

  // ─── 4. CUADRO DE INFORMACIÓN GENERAL DEL EMPLEADO ───
  const infoBoxHeight = 20;
  doc.setFillColor(PDF_CONFIG.colores.grisClaro[0], PDF_CONFIG.colores.grisClaro[1], PDF_CONFIG.colores.grisClaro[2]);
  doc.rect(marginX, currentY, areaWidth, infoBoxHeight, "F");
  
  // Bordes del cuadro de información
  doc.setDrawColor(PDF_CONFIG.colores.grisBorde[0], PDF_CONFIG.colores.grisBorde[1], PDF_CONFIG.colores.grisBorde[2]);
  doc.setLineWidth(0.2);
  doc.rect(marginX, currentY, areaWidth, infoBoxHeight, "S");

  // Rellenar información adentro
  doc.setFontSize(9);
  const textPaddingX = marginX + 4;
  let infoY = currentY + 6;

  // Columna 1 de datos
  doc.setFont("helvetica", "bold");
  doc.text("Empleado:", textPaddingX, infoY);
  doc.setFont("helvetica", "normal");
  const nombreEmpleado = empleado.username.charAt(0).toUpperCase() + empleado.username.slice(1);
  doc.text(nombreEmpleado, textPaddingX + 20, infoY);

  doc.setFont("helvetica", "bold");
  doc.text("Rol / Puesto:", textPaddingX, infoY + 8);
  doc.setFont("helvetica", "normal");
  doc.text(empleado.role || "Sin Rol", textPaddingX + 22, infoY + 8);

  // Columna 2 de datos (mitad de cuadro)
  const col2X = marginX + (areaWidth / 2) + 10;
  doc.setFont("helvetica", "bold");
  doc.text("Período:", col2X, infoY);
  doc.setFont("helvetica", "normal");
  let periodStr = "Todos los registros";
  if (periodo.desde && periodo.hasta) {
    periodStr = `${formatTijuanaOnlyDate(periodo.desde)} al ${formatTijuanaOnlyDate(periodo.hasta)}`;
  } else if (periodo.desde) {
    periodStr = `Desde ${formatTijuanaOnlyDate(periodo.desde)}`;
  } else if (periodo.hasta) {
    periodStr = `Hasta ${formatTijuanaOnlyDate(periodo.hasta)}`;
  }
  doc.text(periodStr, col2X + 16, infoY);

  doc.setFont("helvetica", "bold");
  doc.text("Esquema:", col2X, infoY + 8);
  doc.setFont("helvetica", "normal");
  
  let esquemaStr = "";
  const roleLower = (empleado.role || "").toLowerCase();
  if (roleLower === "repartidor") {
    esquemaStr = "Comisión Fija por Entrega";
  } else if (roleLower === "supervisor") {
    esquemaStr = "Comisión de Ventas (50%) / Sueldo Fijo";
  } else if (roleLower === "developer" || roleLower === "admin") {
    esquemaStr = "Sueldo Fijo";
  } else {
    esquemaStr = `Comisión de Ventas (${config.comisionPercent}%)`;
  }
  doc.text(esquemaStr, col2X + 18, infoY + 8);

  currentY += infoBoxHeight + 8;

  // ─── 5. DEFINICIÓN DE COLUMNAS Y FILAS DE DETALLE ───
  let headers: string[] = [];
  let bodyRows: any[][] = [];

  if (isRepartidor) {
    headers = ["Fecha", "Equipo", "Entrega", "Pago Recibido", "Comisión"];
    bodyRows = operaciones.map((item) => {
      const rowEntrega = config.rowEntregaOverrides[item.id] !== undefined
        ? (Number(config.rowEntregaOverrides[item.id]) || 0)
        : config.entregaVal;
      const pagoRecibido = Number(item.pago_recibido) || 0;
      const comision = rowEntrega - pagoRecibido;

      return [
        formatTijuanaOnlyDate(item.created_at),
        item.celular ? `${item.celular}${item.color_celular ? ` (${item.color_celular})` : ""}` : "—",
        formatCurrency(rowEntrega),
        formatCurrency(-pagoRecibido),
        formatCurrency(comision)
      ];
    });
  } else {
    headers = ["Fecha", "Equipo", "P. Compra", "Costo Eq.", "P. Inicial", "Plataf.", "Entrega", "P. Recib.", "Sub-Tot.", "Comisión"];
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
        item.celular ? `${item.celular}${item.color_celular ? ` (${item.color_celular})` : ""}` : "—",
        formatCurrency(precioCompra),
        formatCurrency(-costoEquipo),
        formatCurrency(-pagoInicial),
        formatCurrency(-config.plataformaVal),
        formatCurrency(-rowEntrega),
        formatCurrency(pagoRecibido),
        formatCurrency(subTotal),
        formatCurrency(comision)
      ];
    });
  }

  // Si no hay operaciones en el período, agregar fila de marcador para evitar que la tabla quede colapsada o vacía
  if (bodyRows.length === 0) {
    const colCount = isRepartidor ? 5 : 10;
    const placeholderRow = Array(colCount).fill("—");
    placeholderRow[1] = "Sin operaciones registradas en el período";
    bodyRows.push(placeholderRow);
  }

  // ─── 6. RENDERIZADO DE LA GRILLA DE OPERACIONES (AUTOTABLE) ───
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: bodyRows,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      font: 'helvetica',
      textColor: PDF_CONFIG.colores.textoPrincipal,
      lineColor: PDF_CONFIG.colores.grisBorde,
      lineWidth: 0.1,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: PDF_CONFIG.colores.grisClaro,
      textColor: PDF_CONFIG.colores.textoOscuro,
      fontStyle: 'bold',
      fontSize: 7.2,
      lineWidth: 0.2,
      lineColor: PDF_CONFIG.colores.grisBorde,
    },
    columnStyles: isRepartidor ? {
      0: { cellWidth: 28 }, // Fecha
      1: { cellWidth: 50, halign: 'left' }, // Equipo
      2: { cellWidth: 32 }, // Entrega
      3: { cellWidth: 32 }, // Pago Recibido
      4: { cellWidth: 44, fontStyle: 'bold', textColor: PDF_CONFIG.colores.primario } // Comisión
    } : {
      0: { cellWidth: 16 }, // Fecha
      1: { cellWidth: 38, halign: 'left' }, // Equipo
      2: { cellWidth: 16 }, // Precio Compra
      3: { cellWidth: 16 }, // Costo Equipo
      4: { cellWidth: 16 }, // Pago Inicial
      5: { cellWidth: 15 }, // Plataforma
      6: { cellWidth: 15 }, // Entrega
      7: { cellWidth: 16 }, // Pago Recibido
      8: { cellWidth: 18 }, // Sub-Total
      9: { cellWidth: 20, fontStyle: 'bold', textColor: PDF_CONFIG.colores.primario } // Comisión
    },
    alternateRowStyles: {
      fillColor: [253, 254, 255]
    }
  });

  // Obtener la posición final para colocar la tabla resumen
  let finalY = (doc as any).lastAutoTable.finalY + 8;

  // Si queda muy poco espacio vertical al final de la página (menos de 45mm), agregamos página nueva
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  // ─── 7. MAQUETACIÓN DE TABLA DE TOTALES Y LIQUIDACIÓN FINAL ───
  const netoACobrar = isRepartidor
    ? totalComision + config.bonoVal + config.sueldoVal
    : totalComision + config.bonoVal + config.sueldoVal - config.publicidadVal;

  const totalHeaders = ["Concepto", "Monto"];
  const totalRows = [
    ["Comisión Ventas/Entregas", formatCurrency(totalComision)],
    ["Bono", formatCurrency(config.bonoVal)],
    ["Sueldo Fijo", formatCurrency(config.sueldoVal)]
  ];

  if (!isRepartidor) {
    totalRows.push(["Descuento Publicidad", formatCurrency(-config.publicidadVal)]);
  }

  totalRows.push(["NETO A COBRAR", formatCurrency(netoACobrar)]);

  // Dibujamos la tabla de totales alineada e integrada con la de arriba
  autoTable(doc, {
    startY: finalY,
    head: [totalHeaders],
    body: totalRows,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      font: 'helvetica',
      textColor: PDF_CONFIG.colores.textoPrincipal,
      lineColor: PDF_CONFIG.colores.grisBorde,
      lineWidth: 0.1,
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: PDF_CONFIG.colores.grisClaro,
      textColor: PDF_CONFIG.colores.textoOscuro,
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: PDF_CONFIG.colores.grisBorde,
      lineWidth: 0.2,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 140, fontStyle: 'normal' },
      1: { cellWidth: 46, fontStyle: 'bold', textColor: PDF_CONFIG.colores.textoOscuro }
    },
    didParseCell: (data) => {
      // Estilo destacado para la fila final del NETO A COBRAR
      if (data.row.index === totalRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 10;
        data.cell.styles.textColor = [15, 23, 42]; // Slate 900
        
        // Agregar color de fondo para la celda del neto a cobrar
        data.cell.styles.fillColor = [241, 245, 249]; // Slate 100
      }
    }
  });

  // ─── 8. GENERACIÓN Y DESCARGA DEL ARCHIVO PDF ───
  const filename = `Recibo_${empleado.username}_${fechaEmision.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}
