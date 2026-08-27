// 1. React y Next.js
import React from "react";
import Link from "next/link";

// 2. Componentes internos
import AccessDenied from "@/components/empresa/AccessDenied";
import { CotizacionesCreditoClient } from "@/components/empresa/cotizaciones-credito/CotizacionesCreditoClient";

// 3. Utilidades y Supabase
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { createClient } from "@/utils/supabase/server";
import { ZONAS_PREDETERMINADAS } from "@/config/cotizaciones";

export const revalidate = 0;

const styles = {
  container: "max-w-4xl mx-auto space-y-8",
  header: "flex items-center justify-between",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
};

export interface CatalogProduct {
  id: string;
  marca: string;
  modelo: string;
  color?: string | null;
  almacenamiento: string;
  ram?: string | null;
}

export interface CostoProveedorItem {
  id: string;
  producto_id: string;
  proveedor: string;
  costo: number | string;
}

export interface ConfigEngancheItem {
  id?: string;
  cliente_historial: string;
  zona?: string | null;
  vendedor_id?: string | null;
  porcentajes: number[];
  permitir_enganche_libre?: boolean;
}

export default async function CotizacionesCreditoPage() {
  const userProfile = await getUserProfile();
  const userRole = userProfile.role;

  if (!isAllowed(userRole, ["Admin", "Closer", "Cambaceador", "Supervisor", "Developer", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="Cotizaciones de crédito" />;
  }

  const isPrivileged = isAllowed(userRole, ["Admin", "Supervisor", "Developer"]);
  const supabase = await createClient();

  // 1. Obtenemos los productos del catálogo
  const { data: productosData } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram")
    .order("marca", { ascending: true })
    .order("modelo", { ascending: true });
  interface RawProduct {
    id: string;
    marca: string;
    modelo: string;
    color: string | null;
    almacenamiento: string;
    ram: string | null;
  }

  interface RawCosto {
    id: string;
    producto_id: string;
    proveedor: string;
    costo: number | string;
  }

  interface RawConfigEnganche {
    id?: string;
    cliente_historial: string;
    zona?: string | null;
    vendedor_id?: string | null;
    porcentajes: number[] | null;
    permitir_enganche_libre?: boolean | null;
  }

  const productos: CatalogProduct[] = ((productosData as unknown as RawProduct[]) || []).map((p: RawProduct) => ({
    id: p.id,
    marca: p.marca,
    modelo: p.modelo,
    color: p.color,
    almacenamiento: p.almacenamiento,
    ram: p.ram,
  }));

  // 2. Obtenemos la tabla de costos de proveedores (plazas: Tijuana, Monterrey, Guadalajara)
  const { data: costosData } = await supabase
    .from("producto_costos_proveedores")
    .select("id, producto_id, proveedor, costo");

  const costos: CostoProveedorItem[] = ((costosData as unknown as RawCosto[]) || []).map((c: RawCosto) => ({
    id: c.id,
    producto_id: c.producto_id,
    proveedor: c.proveedor,
    costo: Number(c.costo) || 0,
  }));

  // 3. Obtenemos las configuraciones de enganche (Si / No, Generales, por Zona y por Vendedor)
  const { data: configEnganchesData } = await supabase
    .from("configuracion_enganche")
    .select("id, cliente_historial, zona, vendedor_id, porcentajes, permitir_enganche_libre");

  const configEnganches: ConfigEngancheItem[] = ((configEnganchesData as unknown as RawConfigEnganche[]) || []).map((c: RawConfigEnganche) => ({
    id: c.id,
    cliente_historial: c.cliente_historial,
    zona: c.zona || null,
    vendedor_id: c.vendedor_id || null,
    porcentajes: c.porcentajes || [],
    permitir_enganche_libre: Boolean(c.permitir_enganche_libre),
  }));

  interface RawZonaReparto {
    nombre_zona: string;
    repartidores: {
      activo: boolean;
    } | null;
  }

  // 4. Obtenemos las zonas de reparto activas y zonas predeterminadas
  const { data: zonasRaw } = await supabase
    .from("zonas_reparto")
    .select(`
      nombre_zona,
      repartidores (
        activo
      )
    `)
    .order("nombre_zona", { ascending: true });

  const zonasSet = new Set<string>(ZONAS_PREDETERMINADAS);

  ((zonasRaw as unknown as RawZonaReparto[]) || [])
    .filter((z) => z.repartidores?.activo !== false && z.nombre_zona)
    .forEach((z) => {
      if (z.nombre_zona && z.nombre_zona.trim()) {
        zonasSet.add(z.nombre_zona.trim());
      }
    });

  const zonasDisponibles = Array.from(zonasSet).sort((a, b) => a.localeCompare(b));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Cotizaciones de crédito</h2>
          <p className="text-sm text-slate-400 mt-1">Cotizador rápido de enganches por zona y modelo</p>
        </div>
        <div className="flex items-center gap-3">
          {isPrivileged && (
            <Link
              href="/empresa/webapp/cotizaciones-credito/configuracion"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-secondary border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all text-sm font-semibold cursor-pointer shadow-lg shadow-slate-950/40"
              title="Configuración de Enganches"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              <span className="hidden sm:inline">Configuración</span>
            </Link>
          )}
          <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      {/* Componente Cliente Interactivo */}
      <CotizacionesCreditoClient
        productos={productos}
        costos={costos}
        configEnganches={configEnganches}
        zonasDisponibles={zonasDisponibles}
        currentUserId={userProfile.id}
      />
    </div>
  );
}
