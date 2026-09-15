// 1. React y Next.js
import React from "react";

// 2. Componentes internos
import AccessDenied from "@/components/empresa/AccessDenied";
import { ConfiguracionEnganchesClient } from "@/components/empresa/cotizaciones-credito/ConfiguracionEnganchesClient";

// 3. Utilidades y Supabase
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { createClient } from "@/utils/supabase/server";
import { ZONAS_PREDETERMINADAS } from "@/config/cotizaciones";

// 4. Tipos
import type { ConfigEngancheItem, VendedorDisponible } from "@/types/ordenes-entrega";

export const revalidate = 0;

interface RawConfigEnganche {
  id?: string;
  cliente_historial: string;
  zona?: string | null;
  vendedor_id?: string | null;
  producto_id?: string | null;
  proveedor?: string | null;
  montos_fijos?: number[] | null;
  porcentajes: number[] | null;
  permitir_enganche_libre?: boolean | null;
  perfiles?: {
    id: string;
    username: string | null;
    email: string | null;
    role: string;
  } | null;
  productos?: {
    id: string;
    marca: string;
    modelo: string;
    almacenamiento?: string | null;
    ram?: string | null;
    color?: string | null;
  } | null;
}

interface RawZonaReparto {
  nombre_zona: string;
  repartidores: {
    activo: boolean;
  } | null;
}

interface RawPerfil {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
}

interface RawCatalogProduct {
  id: string;
  marca: string;
  modelo: string;
  almacenamiento?: string | null;
  ram?: string | null;
  color?: string | null;
}

interface RawCostoProveedor {
  producto_id: string;
  proveedor: string;
}

export default async function ConfiguracionEnganchesPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Configuración de cotizaciones de crédito" />;
  }

  const supabase = await createClient();

  // 1. Obtener todas las configuraciones de enganche (Generales, por Zona, por Equipo y por Vendedor)
  let rawConfigs: RawConfigEnganche[] = [];
  const { data: configsData, error } = await supabase
    .from("configuracion_enganche")
    .select(`
      id,
      cliente_historial,
      zona,
      vendedor_id,
      producto_id,
      proveedor,
      montos_fijos,
      porcentajes,
      permitir_enganche_libre,
      perfiles:vendedor_id (
        id,
        username,
        email,
        role
      ),
      productos:producto_id (
        id,
        marca,
        modelo,
        almacenamiento,
        ram,
        color
      )
    `)
    .order("vendedor_id", { ascending: true, nullsFirst: true })
    .order("zona", { ascending: true, nullsFirst: true })
    .order("cliente_historial", { ascending: false });

  if (error && error.code === "42703") {
    // Fallback si la migración 43 aún no se ha ejecutado en Supabase
    const { data: fallbackData } = await supabase
      .from("configuracion_enganche")
      .select(`
        id,
        cliente_historial,
        zona,
        vendedor_id,
        porcentajes,
        permitir_enganche_libre,
        perfiles:vendedor_id (
          id,
          username,
          email,
          role
        )
      `)
      .order("vendedor_id", { ascending: true, nullsFirst: true })
      .order("zona", { ascending: true, nullsFirst: true })
      .order("cliente_historial", { ascending: false });
    rawConfigs = (fallbackData as unknown as RawConfigEnganche[]) || [];
  } else if (error) {
    console.error("Error al cargar configuracion_enganche:", error);
  } else {
    rawConfigs = (configsData as unknown as RawConfigEnganche[]) || [];
  }

  const configs: ConfigEngancheItem[] = rawConfigs.map((c: RawConfigEnganche) => ({
    id: c.id,
    cliente_historial: c.cliente_historial,
    zona: c.zona || null,
    vendedor_id: c.vendedor_id || null,
    vendedor_nombre: c.perfiles?.username || c.perfiles?.email || null,
    producto_id: c.producto_id || null,
    proveedor: c.proveedor || null,
    montos_fijos: c.montos_fijos || [],
    producto_info: c.productos ? {
      marca: c.productos.marca,
      modelo: c.productos.modelo,
      almacenamiento: c.productos.almacenamiento,
      ram: c.productos.ram,
      color: c.productos.color,
    } : null,
    porcentajes: c.porcentajes || [],
    permitir_enganche_libre: Boolean(c.permitir_enganche_libre),
  }));

  // 2. Obtener lista de zonas únicas activas desde zonas_reparto y zonas predeterminadas
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

  // 3. Obtener lista de vendedores / usuarios activos desde perfiles
  const { data: perfilesRaw } = await supabase
    .from("perfiles")
    .select("id, username, email, role")
    .neq("role", "Sin rol")
    .order("username", { ascending: true });

  const vendedoresDisponibles: VendedorDisponible[] = ((perfilesRaw as unknown as RawPerfil[]) || []).map((p) => ({
    id: p.id,
    nombre: p.username || p.email || p.id,
    role: p.role,
  }));

  // 4. Obtener catálogo de productos y costos de proveedores para la selección de equipos
  const [productosRes, costosRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, marca, modelo, almacenamiento, ram, color")
      .order("marca", { ascending: true })
      .order("modelo", { ascending: true }),
    supabase
      .from("producto_costos_proveedores")
      .select("producto_id, proveedor"),
  ]);

  const productosCatalogo = (productosRes.data as unknown as RawCatalogProduct[]) || [];
  const costosProveedores = (costosRes.data as unknown as RawCostoProveedor[]) || [];

  return (
    <ConfiguracionEnganchesClient
      initialConfigs={configs}
      zonasDisponibles={zonasDisponibles}
      vendedoresDisponibles={vendedoresDisponibles}
      productosCatalogo={productosCatalogo}
      costosProveedores={costosProveedores}
    />
  );
}
