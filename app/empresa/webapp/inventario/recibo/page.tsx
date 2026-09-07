import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import ReciboClientView, { ReciboItem } from "@/components/empresa/ReciboClientView";
import type { Product } from "@/types/stock";

export const revalidate = 0;

const ALLOWED_ROLES = ["Developer"];

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

  // 2. Obtener lista actual de equipos en la tabla de recibo
  let itemsIniciales: ReciboItem[] = [];
  try {
    const { data: reciboData, error: reciboError } = await supabase
      .from("recibo_stock")
      .select(`
        id,
        imei,
        producto_id,
        proveedor,
        tipo_equipo,
        ubicacion_default,
        estado,
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
      />
    </div>
  );
}
