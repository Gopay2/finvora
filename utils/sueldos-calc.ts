import type { ComprobanteRecord } from "@/types/sueldos";

interface CalculateComisionParams {
  filteredList: ComprobanteRecord[];
  isRepartidorSelected: boolean;
  rowEntregaOverrides: { [id: string]: string };
  entregaVal: number;
  plataformaVal: number;
  comisionPercent: number;
  cancelacionesCount?: number;
  recoleccionCount?: number;
  garantiasCount?: number;
}

/**
 * Calcula el total de comisión sumando todas las operaciones del período.
 */
export function calculateTotalComision({
  filteredList,
  isRepartidorSelected,
  rowEntregaOverrides,
  entregaVal,
  plataformaVal,
  comisionPercent,
  cancelacionesCount = 0,
  recoleccionCount = 0,
  garantiasCount = 0
}: CalculateComisionParams): number {
  if (isRepartidorSelected) {
    const entregasComision = filteredList.reduce((acc, item) => {
      const pagoRecibido = Number(item.pago_recibido) || 0;
      const rowEntrega = rowEntregaOverrides[item.id] !== undefined
        ? (Number(rowEntregaOverrides[item.id]) || 0)
        : entregaVal;
      return acc + (rowEntrega - pagoRecibido);
    }, 0);
    const cancelacionesTotal = cancelacionesCount * 150;
    const recoleccionesTotal = recoleccionCount * 150;
    const garantiasTotal = garantiasCount * 450;
    return entregasComision + cancelacionesTotal + recoleccionesTotal + garantiasTotal;
  }

  return filteredList.reduce((acc, item) => {
    const costoEquipo = Number(item.costo_equipo) || 0;
    const precioCompra = Number(item.precio_compra) || 0;
    const pagoInicial = Number(item.pago_inicial) || 0;
    const pagoRecibido = Number(item.pago_recibido) || 0;
    const rowEntrega = rowEntregaOverrides[item.id] !== undefined
      ? (Number(rowEntregaOverrides[item.id]) || 0)
      : entregaVal;
    const subTotal = precioCompra - costoEquipo - pagoInicial - plataformaVal - rowEntrega + pagoRecibido;
    return acc + (subTotal * (comisionPercent / 100));
  }, 0);
}
