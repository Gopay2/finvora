import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import { CalculadoraCreditoClient } from "@/components/empresa/calculadora-credito/CalculadoraCreditoClient";

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
  cliente_historial: string;
  porcentajes: number[];
}

export default async function CalculadoraCreditoPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Closer", "Cambaceador", "Supervisor", "Developer", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="Calculadora de Crédito" />;
  }

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
    cliente_historial: string;
    porcentajes: number[] | null;
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

  // 3. Obtenemos las configuraciones de enganche (Si / No)
  const { data: configEnganchesData } = await supabase
    .from("configuracion_enganche")
    .select("cliente_historial, porcentajes");

  const configEnganches: ConfigEngancheItem[] = ((configEnganchesData as unknown as RawConfigEnganche[]) || []).map((c: RawConfigEnganche) => ({
    cliente_historial: c.cliente_historial,
    porcentajes: c.porcentajes || [],
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Calculadora de Crédito</h2>
          <p className="text-sm text-slate-400 mt-1">Cotizador rápido de enganches por zona y modelo</p>
        </div>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* Componente Cliente Interactivo */}
      <CalculadoraCreditoClient
        productos={productos}
        costos={costos}
        configEnganches={configEnganches}
      />
    </div>
  );
}
