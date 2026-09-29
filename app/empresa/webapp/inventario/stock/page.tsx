import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import { getVendedores, getDistinctBrands } from "@/app/empresa/webapp/stock/stock-actions";
import { fetchAllFromTable } from "@/utils/supabase/pagination";
import StockClientView from "@/components/empresa/StockClientView";
import { limpiarNombreModeloComercial } from "@/utils/pedido-sugerido";
import { getPlazaCostoPrincipal } from "@/config/cotizaciones";

export const revalidate = 0;

const styles = {
  container: "max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700",
  header: "flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  actions: "flex items-center justify-center md:justify-end gap-4 md:gap-3",
  btnPrimary: "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 border border-transparent transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap",
  btnOutline: "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap",
  btnHome: "flex items-center justify-center px-3 md:px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
};

interface RawStockItem {
  imei: string;
  producto_id: string;
  zona: string | null;
  estado: string;
  fecha_ingreso: string;
  fecha_en_envio?: string | null;
  estado_previo?: string | null;
  productos?: {
    id: string;
    marca: string;
    modelo: string;
    color: string | null;
    almacenamiento: string;
    ram: string;
  };
}

interface CostoProveedorRow {
  producto_id: string;
  proveedor: string;
  costo: number | string;
  costo_payjoy?: number | string;
}

interface ZonaRepartoRow {
  id: string;
  nombre_zona: string;
  sigla?: string | null;
  repartidor_id: string;
}

interface CatalogProductRow {
  id: string;
  marca: string;
  modelo: string;
  color: string | null;
  almacenamiento: string;
  ram: string | null;
}

/**
 * Resuelve la plaza comercial y el costo unitario de proveedor para una unidad de stock física.
 */
function resolveStockUnitWithPlazaCost(
  stockItem: RawStockItem,
  costos: CostoProveedorRow[],
  zonasReparto: ZonaRepartoRow[],
  catalogoGeneral: CatalogProductRow[]
) {
  const modeloUpper = (stockItem.productos?.modelo || "").toUpperCase();
  let plazaDetectada: "Tijuana" | "Monterrey" | "Guadalajara" = "Tijuana";

  // 1. Detectar plaza a partir de la nomenclatura del modelo (TIJ, MTY, GDL)
  if (modeloUpper.includes("MTY") || modeloUpper.includes("MONTERREY")) {
    plazaDetectada = "Monterrey";
  } else if (modeloUpper.includes("GDL") || modeloUpper.includes("GUADALAJARA")) {
    plazaDetectada = "Guadalajara";
  } else if (modeloUpper.includes("TIJ") || modeloUpper.includes("TIJUANA")) {
    plazaDetectada = "Tijuana";
  } else if (stockItem.zona) {
    // 2. Si el modelo no tiene sigla explícita, revisar la plaza asignada al chofer
    const matchedZona = zonasReparto.find((zonaItem) => zonaItem.repartidor_id === stockItem.zona);
    if (matchedZona) {
      const plazaFromZona = getPlazaCostoPrincipal(matchedZona.nombre_zona);
      if (plazaFromZona === "Monterrey" || plazaFromZona === "Guadalajara" || plazaFromZona === "Tijuana") {
        plazaDetectada = plazaFromZona;
      }
    }
  }

  // 3. Buscar costo exacto por producto_id y plaza detectada
  let matchedCostRecord = costos.find(
    (costoRecord) => costoRecord.producto_id === stockItem.producto_id && costoRecord.proveedor.toLowerCase() === plazaDetectada.toLowerCase()
  );

  // 4. Si no se encuentra en esa plaza, chequear si tiene algún costo registrado general
  if (!matchedCostRecord) {
    matchedCostRecord = costos.find((costoRecord) => costoRecord.producto_id === stockItem.producto_id);
  }

  // 5. Fallback por coincidencia de modelo comercial limpio + especificaciones
  if (!matchedCostRecord && stockItem.productos) {
    const cleanModelo = limpiarNombreModeloComercial(stockItem.productos.modelo).toLowerCase().replace(/\s+/g, "");
    const colorNorm = (stockItem.productos.color || "").toLowerCase().trim();
    const almNorm = (stockItem.productos.almacenamiento || "").toLowerCase().trim();

    const matchingCatalogProducts = catalogoGeneral.filter((catProduct) => {
      const pClean = limpiarNombreModeloComercial(catProduct.modelo).toLowerCase().replace(/\s+/g, "");
      return (
        pClean === cleanModelo &&
        (!colorNorm || (catProduct.color || "").toLowerCase().trim() === colorNorm) &&
        (!almNorm || (catProduct.almacenamiento || "").toLowerCase().trim() === almNorm)
      );
    });

    for (const catProduct of matchingCatalogProducts) {
      const foundCost = costos.find(
        (costoItem) =>
          costoItem.producto_id === catProduct.id &&
          costoItem.proveedor.toLowerCase() === plazaDetectada.toLowerCase()
      );
      if (foundCost) {
        matchedCostRecord = foundCost;
        break;
      }
    }
  }

  const costoUnitario = matchedCostRecord ? Number(matchedCostRecord.costo) || 0 : 0;

  return {
    ...stockItem,
    costo: costoUnitario,
    plaza: plazaDetectada
  };
}

export default async function StockPage() {
  const { role: userRole } = await getUserProfile();
  const canEdit = isAllowed(userRole, ["Admin", "Supervisor", "Developer", "JCI"]);

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Repartidor", "Developer", "JCI"])) {
    return <AccessDenied role={userRole} sectionName="Stock Disponible" />;
  }

  const supabase = await createClient();
  const vendedores = await getVendedores();
  const marcas = await getDistinctBrands();

  // Estados disponibles según el rol (incluyendo 'Test')
  const estados = ["Disponible", "A consultar", "En envío", "Concesión", "Test"];

  // Consultas en paralelo para optimizar el rendimiento del servidor
  const [
    { data: repartidoresRaw },
    unidadesRaw,
    { data: costosRaw },
    { data: zonasRaw },
    { data: catalogoRaw }
  ] = await Promise.all([
    supabase
      .from("repartidores")
      .select("id, nombre, activo")
      .order("nombre", { ascending: true }),
    fetchAllFromTable<RawStockItem>(
      supabase,
      "stock",
      `
        imei,
        producto_id,
        zona,
        estado,
        fecha_ingreso,
        fecha_en_envio,
        estado_previo,
        productos!inner (
          id,
          marca,
          modelo,
          color,
          almacenamiento,
          ram
        )
      `,
      {
        orderColumn: "fecha_ingreso",
        ascending: false
      }
    ),
    supabase
      .from("producto_costos_proveedores")
      .select("producto_id, proveedor, costo, costo_payjoy"),
    supabase
      .from("zonas_reparto")
      .select("id, nombre_zona, sigla, repartidor_id"),
    supabase
      .from("productos")
      .select("id, marca, modelo, color, almacenamiento, ram")
  ]);

  const repartidores = repartidoresRaw || [];
  const costos = (costosRaw || []) as CostoProveedorRow[];
  const zonasReparto = (zonasRaw || []) as ZonaRepartoRow[];
  const catalogoGeneral = (catalogoRaw || []) as CatalogProductRow[];

  // Mapear unidades físicas de stock resolviendo plaza y costo unitario
  const unidades = (unidadesRaw || []).map((rawUnit) =>
    resolveStockUnitWithPlazaCost(rawUnit, costos, zonasReparto, catalogoGeneral)
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Stock Disponible</h1>
          <p className="text-slate-500 text-sm">Listado detallado de unidades físicas disponibles</p>
        </div>

        <div className={styles.actions}>
          {canEdit && (
            <>
              <Link href="/empresa/webapp/inventario/stock/productos" className={styles.btnPrimary} title="Catálogo de Productos">
                <span className="material-symbols-outlined text-lg">smartphone</span>
                Productos
              </Link>
              <Link href="/empresa/webapp/inventario/stock/cargar" className={styles.btnOutline} title="Cargar nuevo Stock">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                Stock
              </Link>
            </>
          )}
          <Link href="/empresa/webapp/inventario" className={styles.btnHome} title="Volver a Inventario">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
        </div>
      </header>

      <StockClientView
        unidades={unidades}
        marcas={marcas}
        repartidores={repartidores}
        estados={estados}
        canEdit={canEdit}
        vendedores={vendedores}
      />
    </div>
  );
}

