'use client';

import React, { useState, useMemo } from "react";
import { cargarStock } from "@/app/empresa/webapp/stock/stock-actions";
import SubmitButton from "./SubmitButton";

import type { Product, Repartidor, ZonaRepartoItem } from "@/types/stock";

interface StockCargarFormProps {
  productos: Product[];
  repartidores: Repartidor[];
  zonasReparto?: ZonaRepartoItem[];
}

const styles = {
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  inputGroup: "space-y-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all",
  selectInput: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-red-500/10 text-red-400 border border-red-500/20",
};

export default function StockCargarForm({ productos, repartidores, zonasReparto = [] }: StockCargarFormProps) {
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedZona, setSelectedZona] = useState<string>("");
  const [selectedRepartidorId, setSelectedRepartidorId] = useState<string>("");
  const [selectedMarca, setSelectedMarca] = useState<string>("");
  const [selectedProductoId, setSelectedProductoId] = useState<string>("");

  // Obtener zonas únicas configuradas
  const zonasUnicas = useMemo(() => {
    const set = new Set<string>();
    (zonasReparto || []).forEach(zonaItem => {
      if (zonaItem.nombre_zona) set.add(zonaItem.nombre_zona);
    });
    return Array.from(set).sort();
  }, [zonasReparto]);

  // Filtrar repartidores válidos según la zona seleccionada
  const repartidoresValidos = useMemo(() => {
    if (!selectedZona) return [];
    const map = new Map<string, string>();
    (zonasReparto || [])
      .filter(zonaItem => zonaItem.nombre_zona === selectedZona && zonaItem.repartidor_nombre)
      .forEach(zonaItem => {
        map.set(zonaItem.repartidor_id, zonaItem.repartidor_nombre);
      });
    return Array.from(map.entries())
      .map(([repartidorId, repartidorNombre]) => ({ id: repartidorId, nombre: repartidorNombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [selectedZona, zonasReparto]);

  // Determinar la sigla a filtrar según la zona seleccionada: Monterrey -> MTY, Guadalajara -> GDL, Resto -> TIJ
  const targetSigla = useMemo(() => {
    if (!selectedZona) return "";
    
    const zonaMatch = (zonasReparto || []).find(zonaItem => zonaItem.nombre_zona === selectedZona);
    const siglaDirecta = (zonaMatch?.sigla || "").toUpperCase().trim();

    const normNombre = selectedZona.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (normNombre.includes("monterrey") || siglaDirecta === "MTY") {
      return "MTY";
    }
    if (normNombre.includes("guadalajara") || siglaDirecta === "GDL") {
      return "GDL";
    }
    return "TIJ";
  }, [selectedZona, zonasReparto]);

  // Productos filtrados según la sigla de la zona seleccionada
  const productosPorZona = useMemo(() => {
    if (!selectedZona || !targetSigla) return productos;
    return productos.filter(productoItem => {
      const searchContent = `${productoItem.modelo} ${productoItem.marca} ${productoItem.color}`.toUpperCase();
      return searchContent.includes(targetSigla);
    });
  }, [productos, selectedZona, targetSigla]);

  // Obtener marcas únicas ordenadas alfabéticamente a partir de los productos filtrados por la zona
  const marcas = useMemo(() => {
    const set = new Set<string>();
    productosPorZona.forEach((producto) => {
      if (producto.marca && producto.marca.trim()) {
        set.add(producto.marca.trim().toUpperCase());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [productosPorZona]);

  // Filtrar los productos por la marca seleccionada y ordenarlos por modelo, color y almacenamiento
  const filteredProductos = useMemo(() => {
    if (!selectedMarca) return [];
    return productosPorZona
      .filter(productoItem => productoItem.marca?.toUpperCase() === selectedMarca.toUpperCase())
      .sort((a, b) => {
        const compModelo = a.modelo.localeCompare(b.modelo, undefined, { numeric: true, sensitivity: 'base' });
        if (compModelo !== 0) return compModelo;
        
        const compColor = a.color.localeCompare(b.color, undefined, { sensitivity: 'base' });
        if (compColor !== 0) return compColor;
        
        return a.almacenamiento.localeCompare(b.almacenamiento, undefined, { numeric: true });
      });
  }, [productosPorZona, selectedMarca]);

  const handleZonaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedZona(event.target.value);
    setSelectedRepartidorId(""); // Limpiar selección de repartidor al cambiar de zona
    setSelectedMarca(""); // Limpiar selección de marca al cambiar de zona
    setSelectedProductoId(""); // Limpiar selección de producto al cambiar de zona
  };

  const handleMarcaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMarca(event.target.value);
    setSelectedProductoId(""); // Limpiar selección de producto al cambiar de marca
  };

  const handleProductoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProductoId(event.target.value);
  };
  
  const clientAction = async (formData: FormData) => {
    setStatus(null);
    try {
      const actionResult = await cargarStock(formData);
      if (actionResult && actionResult.error) {
        if (actionResult.error.toLowerCase().includes("duplicate key") || actionResult.error.toLowerCase().includes("already exists")) {
          setStatus({
            type: "error",
            message: "El IMEI ingresado ya está registrado en el stock de la empresa."
          });
        } else {
          setStatus({
            type: "error",
            message: actionResult.error
          });
        }
      }
    } catch (submitError: any) {
      if (submitError.message === "NEXT_REDIRECT" || submitError.digest?.startsWith("NEXT_REDIRECT")) {
        throw submitError;
      }
      console.error(submitError);
      setStatus({
        type: "error",
        message: "Ocurrió un error inesperado al cargar el stock."
      });
    }
  };

  return (
    <form action={clientAction} className="space-y-6">
      {status && (
        <div className={status.type === 'success' ? styles.statusSuccess : styles.statusError}>
          <span className="material-symbols-outlined">
            {status.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {status.message}
        </div>
      )}

      {/* FILA 1: 1. Zona | 2. Ubicación/Repartidor */}
      <div className={styles.grid}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Zona</label>
          <div className="relative">
            <select 
              value={selectedZona}
              onChange={handleZonaChange}
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">
                {zonasUnicas.length === 0 ? "Sin zonas configuradas" : "Elegir zona..."}
              </option>
              {zonasUnicas.map(zonaNombre => (
                <option key={zonaNombre} value={zonaNombre} className="bg-slate-950 text-white">
                  {zonaNombre}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
              expand_more
            </span>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Ubicación/Repartidor</label>
          <div className="relative">
            <select 
              name="zona" 
              required 
              value={selectedRepartidorId}
              onChange={(event) => setSelectedRepartidorId(event.target.value)}
              disabled={zonasUnicas.length > 0 && !selectedZona}
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
            >
              {zonasUnicas.length > 0 && !selectedZona ? (
                <option value="" className="bg-slate-950 text-slate-500 italic">Selecciona una zona primero...</option>
              ) : (
                <>
                  <option value="" className="bg-slate-950 text-white">Seleccionar repartidor/sucursal...</option>
                  {(zonasUnicas.length > 0 ? repartidoresValidos : repartidores).map(repartidorItem => (
                    <option key={repartidorItem.id} value={repartidorItem.id} className="bg-slate-950 text-white">
                      {repartidorItem.nombre}
                    </option>
                  ))}
                </>
              )}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* FILA 2: 3. Marca | 4. Seleccionar Producto */}
      <div className={styles.grid}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Marca</label>
          <div className="relative">
            <select 
              value={selectedMarca}
              onChange={handleMarcaChange}
              disabled={zonasUnicas.length > 0 && !selectedZona}
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
            >
              {zonasUnicas.length > 0 && !selectedZona ? (
                <option value="" className="bg-slate-950 text-slate-500 italic">Selecciona una zona primero...</option>
              ) : marcas.length === 0 ? (
                <option value="" className="bg-slate-950 text-slate-500 italic">No hay productos disponibles para la sigla ({targetSigla})...</option>
              ) : (
                <>
                  <option value="" className="bg-slate-950 text-slate-500 italic">Elegir marca...</option>
                  {marcas.map(marcaNombre => (
                    <option key={marcaNombre} value={marcaNombre} className="bg-slate-950 text-white">
                      {marcaNombre}
                    </option>
                  ))}
                </>
              )}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
              expand_more
            </span>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Seleccionar Producto</label>
          <div className="relative">
            <select 
              name="producto_id" 
              required 
              value={selectedProductoId}
              onChange={handleProductoChange}
              disabled={!selectedMarca}
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
            >
              {!selectedMarca ? (
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  {!selectedZona ? "Selecciona una zona primero..." : "Selecciona una marca primero..."}
                </option>
              ) : (
                <>
                  <option value="" className="bg-slate-950 text-white">Elegir modelo del catálogo...</option>
                  {filteredProductos.map(productoItem => (
                    <option key={productoItem.id} value={productoItem.id} className="bg-slate-950 text-white">
                      {productoItem.modelo} - {productoItem.color} ({productoItem.almacenamiento} / {productoItem.ram})
                    </option>
                  ))}
                </>
              )}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* FILA 3: 5. IMEI */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>IMEI</label>
        <input 
          name="imei" 
          type="text" 
          placeholder="Ingresar 15 dígitos" 
          required 
          className={styles.input} 
          autoComplete="one-time-code"
        />
      </div>

      <div className="pt-4">
        <SubmitButton label="Registrar Entrada de Stock" loadingLabel="Guardando..." />
      </div>
    </form>
  );
}

