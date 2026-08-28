import React from "react";
import { getUserProfile } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import ProveedoresClientPage from "@/components/empresa/ProveedoresClientPage";

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
  costo_payjoy: number;
  producto: {
    id: string;
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
    ram: string | null;
  } | null;
}

interface ProductoRaw {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
  ram?: string | null;
  precio?: number | string | null;
}

interface CostoProveedorRaw {
  id: string;
  producto_id: string;
  proveedor: string;
  costo: number | string;
  costo_payjoy?: number | string | null;
  producto: ProductoRaw | ProductoRaw[] | null;
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
      costo_payjoy,
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

  const catalogProducts: CatalogProduct[] = ((productosData as unknown as ProductoRaw[]) || []).map((productoItem) => ({
    id: productoItem.id,
    marca: productoItem.marca,
    modelo: productoItem.modelo,
    color: productoItem.color,
    almacenamiento: productoItem.almacenamiento,
    ram: productoItem.ram || null,
    precio: Number(productoItem.precio) || 0,
  }));

  const initialAssignedCosts: SupplierCostRecord[] = ((costosData as unknown as CostoProveedorRaw[]) || []).map((costoRecord) => {
    // Manejar caso donde el join devuelva un arreglo o un objeto único
    const prod = Array.isArray(costoRecord.producto) ? costoRecord.producto[0] : costoRecord.producto;
    return {
      id: costoRecord.id,
      producto_id: costoRecord.producto_id,
      proveedor: costoRecord.proveedor,
      costo: Number(costoRecord.costo) || 0,
      costo_payjoy: Number(costoRecord.costo_payjoy) || 0,
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
    <ProveedoresClientPage
      catalogProducts={catalogProducts}
      initialAssignedCosts={initialAssignedCosts}
    />
  );
}
