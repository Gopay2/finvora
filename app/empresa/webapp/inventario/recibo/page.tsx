import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import ReciboClientView from "@/components/empresa/ReciboClientView";
import type { ReciboItem } from "@/types/recibo";
import type { Product } from "@/types/stock";

export const revalidate = 0;

const ALLOWED_ROLES = ["Admin", "Supervisor", "Developer", "Bodega", "JCI"];

const styles = {
  container: "max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500",
  header: "flex items-center justify-between",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  subtitle: "text-slate-500 text-sm",
  btnBack: "text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors",
};

export default async function ReciboPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ALLOWED_ROLES)) {
    return <AccessDenied role={userRole} sectionName="Recibo" />;
  }

  const supabase = await createClient();

  // 1. Obtener catálogo de productos disponibles
  const { data: productosRaw } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram")
    .order("marca", { ascending: true });

  const productos: Product[] = productosRaw || [];

  // 2. Obtener repartidores activos para asignar ubicación al transferir a stock
  const { data: repartidoresRaw } = await supabase
    .from("repartidores")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  const repartidores = repartidoresRaw || [];

  // 3. Obtener zonas de reparto con su repartidor asignado y sigla de plaza
  const { data: zonasRepartoRaw } = await supabase
    .from("zonas_reparto")
    .select("id, nombre_zona, sigla, repartidor_id")
    .order("nombre_zona", { ascending: true });

  const zonasReparto = zonasRepartoRaw || [];

  // 4. Obtener lista actual de equipos en la tabla de recibo
  let itemsIniciales: ReciboItem[] = [];
  try {
    const { data: reciboData, error: reciboError } = await supabase
      .from("recibo_stock")
      .select(`
        id,
        imei,
        producto_id,
        area_proveedor,
        proveedor,
        tipo_equipo,
        fecha_ingreso,
        creado_por_username,
        productos (
          marca,
          modelo,
          color,
          almacenamiento,
          ram
        )
      `)
      .order("fecha_ingreso", { ascending: false });

    if (!reciboError && reciboData) {
      itemsIniciales = reciboData as unknown as ReciboItem[];
    } else if (reciboError && (reciboError.message.includes("area_proveedor") || reciboError.code === "PGRST204" || reciboError.code === "42703")) {
      // Fallback de compatibilidad si la columna area_proveedor aún no se ha ejecutado en Supabase
      const { data: fallbackData } = await supabase
        .from("recibo_stock")
        .select(`
          id,
          imei,
          producto_id,
          proveedor,
          tipo_equipo,
          fecha_ingreso,
          creado_por_username,
          productos (
            marca,
            modelo,
            color,
            almacenamiento,
            ram
          )
        `)
        .order("fecha_ingreso", { ascending: false });

      if (fallbackData) {
        itemsIniciales = fallbackData as unknown as ReciboItem[];
      }
    }
  } catch (fetchErr) {
    console.error("Error al obtener equipos de recibo_stock:", fetchErr);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Recibo</h1>
          <p className={styles.subtitle}>
            Ingreso de unidades por proveedor
          </p>
        </div>
        <Link href="/empresa/webapp/inventario" className={styles.btnBack} title="Volver a Inventario">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </header>

      {/* Vista interactiva del formulario y la tabla de escaneados */}
      <ReciboClientView
        productos={productos}
        itemsIniciales={itemsIniciales}
        userRole={userRole}
        repartidores={repartidores}
        zonasReparto={zonasReparto}
      />
    </div>
  );
}
