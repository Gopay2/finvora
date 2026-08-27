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
  porcentajes: number[] | null;
  permitir_enganche_libre?: boolean | null;
  perfiles?: {
    id: string;
    username: string | null;
    email: string | null;
    role: string;
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

export default async function ConfiguracionEnganchesPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Configuración de cotizaciones de crédito" />;
  }

  const supabase = await createClient();

  // 1. Obtener todas las configuraciones de enganche (Generales, por Zona y por Vendedor)
  const { data: configsData, error } = await supabase
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

  if (error) {
    console.error("Error al cargar configuracion_enganche:", error);
  }

  const configs: ConfigEngancheItem[] = ((configsData as unknown as RawConfigEnganche[]) || []).map((c: RawConfigEnganche) => ({
    id: c.id,
    cliente_historial: c.cliente_historial,
    zona: c.zona || null,
    vendedor_id: c.vendedor_id || null,
    vendedor_nombre: c.perfiles?.username || c.perfiles?.email || null,
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

  return (
    <ConfiguracionEnganchesClient
      initialConfigs={configs}
      zonasDisponibles={zonasDisponibles}
      vendedoresDisponibles={vendedoresDisponibles}
    />
  );
}
