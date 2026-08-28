'use client';

import React, { useState, useMemo } from "react";
import type { CatalogProduct, CostoProveedorItem, ConfigEngancheItem } from "@/app/empresa/webapp/cotizaciones-credito/page";
import {
  ZONAS_PREDETERMINADAS,
  getSiglaZonaPorNombre,
  getPlazaCostoPrincipal,
  TERMINOS_PAGO_CONFIG,
} from "@/config/cotizaciones";

interface CotizacionesCreditoClientProps {
  productos: CatalogProduct[];
  costos: CostoProveedorItem[];
  configEnganches: ConfigEngancheItem[];
  zonasDisponibles?: string[];
  currentUserId?: string | null;
}

// ─── Estilos centralizados de Tailwind ───────────────────────────────────────────
const styles = {
  container: "space-y-8",
  controlPanel: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl",
  fieldGroup: "space-y-2",
  fieldLabel: "text-sm font-semibold text-slate-300 ml-1 flex items-center gap-2",
  selectWrapper: "relative",
  select: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer pr-10 disabled:opacity-40 disabled:cursor-not-allowed custom-scrollbar",
  selectChevron: "absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base",
  toggleContainer: "grid grid-cols-2 gap-3 h-[48px]",
  toggleButton: "rounded-xl text-sm font-bold transition-all flex items-center justify-center cursor-pointer border",
  toggleButtonActive: "bg-secondary text-slate-950 border-secondary shadow-[0_0_15px_rgba(45,212,191,0.25)]",
  toggleButtonInactive: "bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white",
  emptyCard: "bg-slate-900/20 border border-slate-800/60 rounded-3xl p-10 text-center space-y-4 shadow-xl",
  emptyIconBox: "w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 mx-auto flex items-center justify-center text-slate-500",
  warningCard: "bg-amber-500/10 border border-amber-500/30 rounded-3xl p-10 text-center space-y-4 shadow-xl",
  warningIconBox: "w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl mx-auto flex items-center justify-center text-amber-400",
  tableWrapper: "bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl",
  tableHeaderBox: "bg-slate-950 p-4 border-b border-slate-800/80",
  tableTitle: "text-sm font-bold text-slate-200 uppercase tracking-wider text-center",
  table: "w-full text-sm border-collapse",
  tableHead: "bg-slate-950 border-b border-slate-800/80 text-slate-400 font-semibold uppercase text-xs tracking-wider",
  tableTh: "px-4 sm:px-6 py-3.5 sm:py-4 text-center",
  tableTr: "border-b border-slate-800/40 last:border-b-0 hover:bg-slate-900/10 transition-colors",
  tableTdPercent: "px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-secondary text-sm sm:text-base text-center",
  tableTdAmount: "px-4 sm:px-6 py-3.5 sm:py-4 text-center",
  copyAmountText: "text-white font-mono font-bold text-sm sm:text-lg hover:text-secondary transition-colors",
};

/**
 * Formatea un valor numérico a moneda mexicana (MXN).
 */
function formatCurrency(val: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Copia texto al portapapeles en contextos no seguros (HTTP o IPs locales)
 * utilizando elementos DOM transitorios fuera de la vista.
 */
function runFallbackCopy(textToCopy: string): boolean {
  if (typeof document === "undefined") return false;

  // Método 1: Textarea con selección nativa de input
  try {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    
    // Estilos para mantenerlo en el viewport sin alterar layout ni scroll
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0.01";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (success) return true;
  } catch (err) {
    console.warn("Fallback textarea failed:", err);
  }

  // Método 2: Span con Range (en caso de que el navegador móvil bloquee textarea readonly)
  try {
    const span = document.createElement("span");
    span.textContent = textToCopy;
    span.style.position = "fixed";
    span.style.top = "0";
    span.style.left = "0";
    span.style.opacity = "0.01";
    span.style.whiteSpace = "pre";
    span.style.pointerEvents = "none";
    
    document.body.appendChild(span);
    
    const range = document.createRange();
    range.selectNodeContents(span);
    
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    const success = document.execCommand("copy");
    
    if (selection) {
      selection.removeAllRanges();
    }
    
    document.body.removeChild(span);
    
    if (success) return true;
  } catch (err) {
    console.warn("Fallback span failed:", err);
  }

  return false;
}

export function CotizacionesCreditoClient({
  productos,
  costos,
  configEnganches,
  zonasDisponibles = [],
  currentUserId,
}: CotizacionesCreditoClientProps) {
  const [selectedPlaza, setSelectedPlaza] = useState<string>("");
  const [selectedMarca, setSelectedMarca] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [clienteHistorial, setClienteHistorial] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Plazas/Zonas disponibles (combina las zonas_reparto activas con costos y excepciones de enganche)
  const plazasDisponibles = useMemo(() => {
    const plazasSet = new Set<string>(ZONAS_PREDETERMINADAS);

    // 1. Zonas activas de reparto (mismas que en la sección de configuración)
    if (zonasDisponibles && zonasDisponibles.length > 0) {
      zonasDisponibles.forEach((z) => {
        if (z && z.trim()) plazasSet.add(z.trim());
      });
    }

    // 2. Zonas con reglas de enganche configuradas
    configEnganches.forEach((cfg) => {
      if (cfg.zona && cfg.zona.trim()) {
        plazasSet.add(cfg.zona.trim());
      }
    });

    // 3. Proveedores/Plazas con costos cargados
    costos.forEach((costoItem) => {
      if (costoItem.proveedor && costoItem.proveedor.trim()) {
        plazasSet.add(costoItem.proveedor.trim());
      }
    });

    return Array.from(plazasSet).sort((a, b) => a.localeCompare(b));
  }, [zonasDisponibles, configEnganches, costos]);

  // Cambiar de zona y resetear marca y producto
  const handlePlazaChange = (plaza: string) => {
    setSelectedPlaza(plaza);
    setSelectedMarca("");
    setSelectedProductId("");
  };

  // Filtrado de productos por sigla regional:
  // - Córdoba, Ensenada, Mexicali, Rosarito, Tijuana -> ÚNICAMENTE modelos con "TIJ"
  // - Monterrey -> ÚNICAMENTE modelos con "MTY"
  // - Guadalajara -> ÚNICAMENTE modelos con "GDL"
  const productosFiltradosPorZona = useMemo(() => {
    if (!selectedPlaza) return [];
    
    const siglaZona = getSiglaZonaPorNombre(selectedPlaza);

    if (!siglaZona) {
      return productos;
    }

    return productos.filter((producto) => {
      const modelo = (producto.modelo || "").toLowerCase();
      return modelo.includes(siglaZona);
    });
  }, [productos, selectedPlaza]);

  // Marcas disponibles en la zona seleccionada
  const marcasDisponibles = useMemo(() => {
    const marcasSet = new Set<string>();
    productosFiltradosPorZona.forEach((producto) => {
      if (producto.marca) {
        marcasSet.add(producto.marca.trim());
      }
    });
    return Array.from(marcasSet).sort((marcaA, marcaB) => marcaA.localeCompare(marcaB));
  }, [productosFiltradosPorZona]);

  // Modelos filtrados según la marca seleccionada
  const productosFiltrados = useMemo(() => {
    if (!selectedMarca) return [];
    return productosFiltradosPorZona.filter(
      (producto) => producto.marca.toLowerCase().trim() === selectedMarca.toLowerCase().trim()
    );
  }, [productosFiltradosPorZona, selectedMarca]);

  // Producto seleccionado
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return productosFiltrados.find((producto) => producto.id === selectedProductId) || null;
  }, [selectedProductId, productosFiltrados]);

  // Costo PayJoy asociado a la plaza y producto seleccionado (base directa para cotizaciones)
  const matchedCosto = useMemo(() => {
    if (!selectedProductId || !selectedPlaza) return null;
    const normPlaza = selectedPlaza.toLowerCase().trim();
    const plazaPrincipal = getPlazaCostoPrincipal(selectedPlaza).toLowerCase().trim();

    // 1. Coincidencia exacta de proveedor con el nombre de la zona
    let match = costos.find(
      (costoItem) =>
        costoItem.producto_id === selectedProductId &&
        costoItem.proveedor &&
        costoItem.proveedor.toLowerCase().trim() === normPlaza
    );

    // 2. Coincidencia con plaza principal (ej: Tijuana para Mexicali, Ensenada, Rosarito, Córdoba)
    if (!match && plazaPrincipal !== normPlaza) {
      match = costos.find(
        (costoItem) =>
          costoItem.producto_id === selectedProductId &&
          costoItem.proveedor &&
          costoItem.proveedor.toLowerCase().trim() === plazaPrincipal
      );
    }

    // 3. Coincidencia parcial por variantes
    if (!match) {
      match = costos.find(
        (costoItem) =>
          costoItem.producto_id === selectedProductId &&
          costoItem.proveedor &&
          (normPlaza.includes(costoItem.proveedor.toLowerCase().trim()) ||
           costoItem.proveedor.toLowerCase().trim().includes(normPlaza) ||
           plazaPrincipal.includes(costoItem.proveedor.toLowerCase().trim()) ||
           costoItem.proveedor.toLowerCase().trim().includes(plazaPrincipal))
      );
    }

    // 4. Fallback: si hay un costo único para el producto en cualquier plaza
    if (!match) {
      const productCosts = costos.filter(
        (c) => c.producto_id === selectedProductId && (Number(c.costo_payjoy) > 0 || Number(c.costo) > 0)
      );
      if (productCosts.length === 1) {
        match = productCosts[0];
      }
    }

    if (!match) return 0;
    const baseCostoPayjoy = Number(match.costo_payjoy) || 0;
    return baseCostoPayjoy;
  }, [selectedProductId, selectedPlaza, costos]);

  /**
   * Resolución de porcentajes de enganche mediante jerarquía de 3 niveles:
   * 1. Regla específica del vendedor conectado (Prioridad máxima).
   * 2. Regla específica de la zona/plaza seleccionada (o de su plaza principal si no tiene regla propia).
   * 3. Configuración general por defecto (Fallback base).
   */
  const enganchePorcentajes = useMemo(() => {
    if (!clienteHistorial) return [];

    // Nivel 1 (Máxima Prioridad): Regla por Vendedor
    if (currentUserId) {
      const vendedorConfig = configEnganches.find(
        (configItem) =>
          configItem.vendedor_id === currentUserId &&
          configItem.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
      );
      if (vendedorConfig && vendedorConfig.porcentajes && vendedorConfig.porcentajes.length > 0) {
        return vendedorConfig.porcentajes;
      }
    }

    // Nivel 2: Regla por Plaza/Zona seleccionada
    if (selectedPlaza) {
      const normPlaza = selectedPlaza.toLowerCase().trim();
      const plazaPrincipal = getPlazaCostoPrincipal(selectedPlaza).toLowerCase().trim();

      // 2.1 Regla exacta de la zona (ej: "Mexicali", "Ensenada", "Rosarito", "Córdoba", "Tijuana")
      const zoneConfig = configEnganches.find(
        (configItem) =>
          !configItem.vendedor_id &&
          configItem.zona &&
          configItem.zona.toLowerCase().trim() === normPlaza &&
          configItem.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
      );
      if (zoneConfig && zoneConfig.porcentajes && zoneConfig.porcentajes.length > 0) {
        return zoneConfig.porcentajes;
      }

      // 2.2 Si no tiene regla individual, hereda de la plaza principal si tiene regla (ej: "Tijuana")
      if (plazaPrincipal !== normPlaza) {
        const parentZoneConfig = configEnganches.find(
          (configItem) =>
            !configItem.vendedor_id &&
            configItem.zona &&
            configItem.zona.toLowerCase().trim() === plazaPrincipal &&
            configItem.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
        );
        if (parentZoneConfig && parentZoneConfig.porcentajes && parentZoneConfig.porcentajes.length > 0) {
          return parentZoneConfig.porcentajes;
        }
      }
    }

    // Nivel 3 (Fallback Base): Configuración General
    const generalConfig = configEnganches.find(
      (configItem) =>
        !configItem.vendedor_id &&
        !configItem.zona &&
        configItem.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
    );
    return generalConfig ? generalConfig.porcentajes : [];
  }, [clienteHistorial, selectedPlaza, configEnganches, currentUserId]);

  /**
   * Cálculo reactivo de los Términos de Pago (Meses, Semanas, Monto Semanal y Total a Pagar)
   * basado en el costo calculado del equipo y los porcentajes de recargo de financiamiento por plazo.
   */
  const terminosCalculados = useMemo(() => {
    if (!matchedCosto || matchedCosto <= 0) return [];
    return TERMINOS_PAGO_CONFIG.map((term) => {
      const totalAPagar = matchedCosto * (1 + term.recargoPorcentaje / 100);
      const montoSemanal = totalAPagar / term.semanas;
      return {
        meses: term.meses,
        semanas: term.semanas,
        recargoPorcentaje: term.recargoPorcentaje,
        totalAPagar,
        montoSemanal,
        formattedTotal: formatCurrency(totalAPagar),
        formattedSemanal: formatCurrency(montoSemanal),
      };
    });
  }, [matchedCosto]);

  const handleCopyText = (textToCopy: string, keyId: string) => {
    // Intento 1: Clipboard API moderna (requiere HTTPS o localhost)
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopiedKey(keyId);
          setTimeout(() => setCopiedKey(null), 1500);
        })
        .catch(() => {
          // Si falla async, intentamos fallback
          const copied = runFallbackCopy(textToCopy);
          if (copied) {
            setCopiedKey(keyId);
            setTimeout(() => setCopiedKey(null), 1500);
          }
        });
      return;
    }

    // Intento 2: Fallback síncrono para HTTP e IP local
    const copied = runFallbackCopy(textToCopy);
    if (copied) {
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  const hasCost = matchedCosto !== null && matchedCosto > 0;
  const isReadyToCalculate = selectedProduct && clienteHistorial;

  return (
    <div className={styles.container}>
      {/* PANEL DE CONTROL / SELECTORES */}
      <div className={styles.controlPanel}>
        
        {/* Fila 1: Selector de Zona */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className="material-symbols-outlined text-secondary text-lg">location_on</span>
            Zona
          </label>
          <div className={styles.selectWrapper}>
            <select
              value={selectedPlaza}
              onChange={(event) => handlePlazaChange(event.target.value)}
              className={styles.select}
              style={{ colorScheme: "dark" }}
              suppressHydrationWarning={true}
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">
                Seleccione una zona...
              </option>
              {plazasDisponibles.map((plaza) => (
                <option key={plaza} value={plaza} className="bg-slate-950 text-white">
                  {plaza}
                </option>
              ))}
            </select>
            <span className={styles.selectChevron}>
              expand_more
            </span>
          </div>
        </div>

        {/* Fila 2: Selector de Marca */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className="material-symbols-outlined text-secondary text-lg">sell</span>
            Marca
          </label>
          <div className={styles.selectWrapper}>
            <select
              value={selectedMarca}
              onChange={(event) => {
                setSelectedMarca(event.target.value);
                setSelectedProductId("");
              }}
              disabled={!selectedPlaza}
              className={styles.select}
              style={{ colorScheme: "dark" }}
              suppressHydrationWarning={true}
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">
                {!selectedPlaza ? "Primero elija una zona..." : "Seleccione una marca..."}
              </option>
              {marcasDisponibles.map((marca) => (
                <option key={marca} value={marca} className="bg-slate-950 text-white">
                  {marca}
                </option>
              ))}
            </select>
            <span className={styles.selectChevron}>
              expand_more
            </span>
          </div>
        </div>

        {/* Fila 3: Selector de Modelo de Celular */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className="material-symbols-outlined text-secondary text-lg">smartphone</span>
            Modelo
          </label>
          <div className={styles.selectWrapper}>
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              disabled={!selectedMarca}
              className={styles.select}
              style={{ colorScheme: "dark" }}
              suppressHydrationWarning={true}
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">
                {!selectedMarca ? "Primero elija una marca..." : "Seleccione un modelo..."}
              </option>
              {productosFiltrados.map((producto) => {
                const especificaciones = `${producto.modelo} - ${producto.almacenamiento}${producto.ram ? ` - ${producto.ram}` : ""}${producto.color ? ` (${producto.color})` : ""}`;
                return (
                  <option key={producto.id} value={producto.id} className="bg-slate-950 text-white">
                    {especificaciones}
                  </option>
                );
              })}
            </select>
            <span className={styles.selectChevron}>
              expand_more
            </span>
          </div>
        </div>

        {/* Fila 4: Selector de Historial del Cliente */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            <span className="material-symbols-outlined text-secondary text-lg">person</span>
            ¿Cliente con historial?
          </label>
          <div className={styles.toggleContainer}>
            <button
              type="button"
              onClick={() => setClienteHistorial("Si")}
              className={`${styles.toggleButton} ${
                clienteHistorial.toLowerCase() === "si"
                  ? styles.toggleButtonActive
                  : styles.toggleButtonInactive
              }`}
            >
              Sí
            </button>

            <button
              type="button"
              onClick={() => setClienteHistorial("No")}
              className={`${styles.toggleButton} ${
                clienteHistorial.toLowerCase() === "no"
                  ? styles.toggleButtonActive
                  : styles.toggleButtonInactive
              }`}
            >
              No
            </button>
          </div>
        </div>
      </div>

      {/* RESULTADOS / ESTADO DE CÁLCULO */}
      <div>
        {!isReadyToCalculate ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconBox}>
              <span className="material-symbols-outlined text-3xl">request_quote</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-300">Esperando selección</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
                Seleccione zona, modelo de celular y si el cliente cuenta con historial para calcular las opciones de enganche y terminos de pago.
              </p>
            </div>
          </div>
        ) : !hasCost ? (
          /* CASO: FALTA AGREGAR COSTO PAYJOY */
          <div className={styles.warningCard}>
            <div className={styles.warningIconBox}>
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-400">Falta agregar Costo PayJoy</h3>
              <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto leading-relaxed">
                El modelo <strong className="text-white">{selectedProduct?.marca} {selectedProduct?.modelo}</strong> ({selectedProduct?.almacenamiento}) aún no tiene un costo PayJoy asignado en el sistema para la zona de <strong className="text-white">{selectedPlaza}</strong>.
              </p>
            </div>
          </div>
        ) : (
          /* CASO: CÁLCULO DISPONIBLE CON TABLAS DE ENGANCHES Y TÉRMINOS DE PAGO */
          <div className="space-y-6">
            {/* 1. Tabla de Opciones de Enganche */}
            <div className={styles.tableWrapper}>
              <div className={styles.tableHeaderBox}>
                <h4 className={styles.tableTitle}>
                  Opciones de Enganche
                </h4>
              </div>

              {enganchePorcentajes.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No hay porcentajes configurados para este tipo de cliente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead className="bg-slate-950 border-b border-slate-800/80">
                      <tr>
                        <th className="px-1.5 sm:px-4 py-3 sm:py-4 text-center font-semibold text-slate-400 uppercase text-[11px] sm:text-xs tracking-tight sm:tracking-wider">
                          Porcentaje
                        </th>
                        <th className="px-1.5 sm:px-4 py-3 sm:py-4 text-center font-semibold text-slate-400 uppercase text-[11px] sm:text-xs tracking-tight sm:tracking-wider">
                          Monto a Cobrar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enganchePorcentajes.map((porcentaje, idx) => {
                        const engancheCalculado = (matchedCosto! * (porcentaje / 100));
                        const formattedValue = formatCurrency(engancheCalculado);
                        const isCopied = copiedKey === `enganche-${idx}`;

                        return (
                          <tr key={`${porcentaje}-${idx}`} className={styles.tableTr}>
                            <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 font-bold text-secondary text-xs sm:text-base text-center whitespace-nowrap">
                              {porcentaje}%
                            </td>
                            <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-center">
                              <div 
                                onClick={() => handleCopyText(formattedValue, `enganche-${idx}`)}
                                className="relative inline-block group cursor-pointer select-none"
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                title="Copiar enganche"
                              >
                                <span className="text-white font-mono font-bold text-xs sm:text-base hover:text-secondary transition-colors whitespace-nowrap">
                                  {formattedValue}
                                </span>
                                {/* Tooltip personalizado */}
                                <div className={`absolute left-1/2 -translate-x-1/2 -top-10 transition-all duration-150 bg-slate-950/95 border border-slate-800 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-2xl pointer-events-none z-10 text-slate-300 backdrop-blur-md ${
                                  isCopied 
                                    ? "scale-100 opacity-100" 
                                    : "scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100"
                                }`}>
                                  {isCopied ? (
                                    <span className="text-emerald-400 font-bold">¡Copiado!</span>
                                  ) : (
                                    <span>Haz clic para copiar</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Tabla de Términos de Pago */}
            <div className={styles.tableWrapper}>
              <div className={styles.tableHeaderBox}>
                <h4 className={styles.tableTitle}>
                  Términos de Pago
                </h4>
              </div>

              {terminosCalculados.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No hay términos de pago calculados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead className="bg-slate-950 border-b border-slate-800/80">
                      <tr>
                        <th className="px-1.5 sm:px-4 py-3 sm:py-4 text-center font-semibold text-slate-400 uppercase text-[11px] sm:text-xs tracking-tight sm:tracking-wider">
                          Meses
                        </th>
                        <th className="px-1.5 sm:px-4 py-3 sm:py-4 text-center font-semibold text-slate-400 uppercase text-[11px] sm:text-xs tracking-tight sm:tracking-wider">
                          Semanas
                        </th>
                        <th className="px-1.5 sm:px-4 py-3 sm:py-4 text-center font-semibold text-slate-400 uppercase text-[11px] sm:text-xs tracking-tight sm:tracking-wider">
                          <span className="hidden sm:inline">Monto semanal</span>
                          <span className="sm:hidden">Semanal</span>
                        </th>
                        <th className="px-1.5 sm:px-4 py-3 sm:py-4 text-center font-semibold text-slate-400 uppercase text-[11px] sm:text-xs tracking-tight sm:tracking-wider">
                          <span className="hidden sm:inline">Total a Pagar</span>
                          <span className="sm:hidden">Total</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {terminosCalculados.map((termino) => {
                        const isCopiedSemanal = copiedKey === `termino-semanal-${termino.meses}`;
                        const isCopiedTotal = copiedKey === `termino-total-${termino.meses}`;

                        return (
                          <tr key={`termino-${termino.meses}`} className={styles.tableTr}>
                            <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-center font-bold text-slate-200 text-xs sm:text-base whitespace-nowrap">
                              {termino.meses} meses
                            </td>
                            <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-center text-slate-400 text-xs sm:text-base font-medium whitespace-nowrap">
                              {termino.semanas} semanas
                            </td>
                            <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-center">
                              <div
                                onClick={() => handleCopyText(termino.formattedSemanal, `termino-semanal-${termino.meses}`)}
                                className="relative inline-block group cursor-pointer select-none"
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                title="Copiar monto semanal"
                              >
                                <span className="text-secondary font-mono font-bold text-xs sm:text-base hover:text-emerald-300 transition-colors whitespace-nowrap">
                                  {termino.formattedSemanal}
                                </span>
                                {/* Tooltip */}
                                <div
                                  className={`absolute left-1/2 -translate-x-1/2 -top-10 transition-all duration-150 bg-slate-950/95 border border-slate-800 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-2xl pointer-events-none z-10 text-slate-300 backdrop-blur-md ${
                                    isCopiedSemanal
                                      ? "scale-100 opacity-100"
                                      : "scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  {isCopiedSemanal ? (
                                    <span className="text-emerald-400 font-bold">¡Copiado!</span>
                                  ) : (
                                    <span>Haz clic para copiar</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-center">
                              <div
                                onClick={() => handleCopyText(termino.formattedTotal, `termino-total-${termino.meses}`)}
                                className="relative inline-block group cursor-pointer select-none"
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                title="Copiar total a pagar"
                              >
                                <span className="text-white font-mono font-bold text-xs sm:text-base hover:text-secondary transition-colors whitespace-nowrap">
                                  {termino.formattedTotal}
                                </span>
                                {/* Tooltip */}
                                <div
                                  className={`absolute left-1/2 -translate-x-1/2 -top-10 transition-all duration-150 bg-slate-950/95 border border-slate-800 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-2xl pointer-events-none z-10 text-slate-300 backdrop-blur-md ${
                                    isCopiedTotal
                                      ? "scale-100 opacity-100"
                                      : "scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  {isCopiedTotal ? (
                                    <span className="text-emerald-400 font-bold">¡Copiado!</span>
                                  ) : (
                                    <span>Haz clic para copiar</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
