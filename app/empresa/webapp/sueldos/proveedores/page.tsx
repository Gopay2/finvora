import React from "react";
import { getUserProfile } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import CalculadoraProveedoresClientPage from "../../../../../components/empresa/CalculadoraProveedoresClientPage";

export const revalidate = 0;

export interface CatalogProduct {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
  ram: string | null;
  precio: number;
}

export interface SupplierCostRecord {
  id: string;
  producto_id: string;
  proveedor: string;
  costo: number;
  producto: {
    id: string;
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
    ram: string | null;
  } | null;
}

export default async function ProveedoresPage() {
  const { id: currentUserId, role: userRole } = await getUserProfile();

  // Control de acceso: Solo Admin, Supervisor y Developer
  const isHighPrivilege = userRole === "Admin" || userRole === "Developer" || userRole === "Supervisor";
  if (!currentUserId || !isHighPrivilege) {
    return <AccessDenied role={userRole} sectionName="Costos de Proveedores" />;
  }

  const supabase = await createClient();

  // 1. Obtener todos los productos del catálogo general
  const { data: productosData, error: productosError } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram, precio")
    .order("marca", { ascending: true })
    .order("modelo", { ascending: true });

  if (productosError) {
    console.error("Error al obtener productos para proveedores:", productosError);
  }

  // 2. Obtener la lista de costos configurados para todos los proveedores
  const { data: costosData, error: costosError } = await supabase
    .from("producto_costos_proveedores")
    .select(`
      id,
      producto_id,
      proveedor,
      costo,
      producto:productos (
        id,
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      )
    `);

  if (costosError) {
    console.error("Error al obtener costos de proveedores:", costosError);
  }

  const catalogProducts: CatalogProduct[] = (productosData || []).map((p: any) => ({
    id: p.id,
    marca: p.marca,
    modelo: p.modelo,
    color: p.color,
    almacenamiento: p.almacenamiento,
    ram: p.ram || null,
    precio: Number(p.precio) || 0,
  }));

  const initialAssignedCosts: SupplierCostRecord[] = (costosData || []).map((c: any) => {
    // Manejar caso donde el join devuelva un arreglo o un objeto único
    const prod = Array.isArray(c.producto) ? c.producto[0] : c.producto;
    return {
      id: c.id,
      producto_id: c.producto_id,
      proveedor: c.proveedor,
      costo: Number(c.costo) || 0,
      producto: prod ? {
        id: prod.id,
        marca: prod.marca,
        modelo: prod.modelo,
        color: prod.color,
        almacenamiento: prod.almacenamiento,
        ram: prod.ram || null,
      } : null,
    };
  });

  return (
    <CalculadoraProveedoresClientPage
      catalogProducts={catalogProducts}
      initialAssignedCosts={initialAssignedCosts}
    />
  );
}
