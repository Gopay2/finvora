import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import type { MappedUser } from "@/app/empresa/webapp/sueldos/page";

export type { ComprobanteRecord, MappedUser };

export interface SueldosConfig {
  plataformaVal: number;
  entregaVal: number;
  comisionPercent: number;
  bonoVal: number;
  sueldoVal: number;
  publicidadVal: number;
  rowEntregaOverrides: { [id: string]: string };
}
