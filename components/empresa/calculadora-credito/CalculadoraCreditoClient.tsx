'use client';

import React, { useState, useMemo } from "react";
import type { CatalogProduct, CostoProveedorItem, ConfigEngancheItem } from "@/app/empresa/webapp/calculadora-credito/page";

interface CalculadoraCreditoClientProps {
  productos: CatalogProduct[];
  costos: CostoProveedorItem[];
  configEnganches: ConfigEngancheItem[];
}

const PLAZAS_DEFAULT = ["Tijuana", "Guadalajara", "Monterrey"];

export function CalculadoraCreditoClient({
  productos,
  costos,
  configEnganches,
}: CalculadoraCreditoClientProps) {
  const [selectedPlaza, setSelectedPlaza] = useState<string>("");
  const [selectedMarca, setSelectedMarca] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [clienteHistorial, setClienteHistorial] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Plazas/Zonas disponibles (combina las estándar con las que existan en costos)
  const plazasDisponibles = useMemo(() => {
    const set = new Set<string>(PLAZAS_DEFAULT);
    costos.forEach((c) => {
      if (c.proveedor && c.proveedor.trim()) {
        set.add(c.proveedor.trim());
      }
    });
    return Array.from(set);
  }, [costos]);

  // Cambiar de zona y resetear marca y producto
  const handlePlazaChange = (plaza: string) => {
    setSelectedPlaza(plaza);
    setSelectedMarca("");
    setSelectedProductId("");
  };

  // Filtrado de productos por sigla de zona: Monterrey -> MTY, Guadalajara -> GDL, Tijuana -> TIJ
  const productosFiltradosPorZona = useMemo(() => {
    if (!selectedPlaza) return [];
    const targetSigla = selectedPlaza === "Guadalajara" ? "GDL" : selectedPlaza === "Monterrey" ? "MTY" : "TIJ";
    return productos.filter((p) => {
      const searchContent = `${p.modelo} ${p.marca} ${p.color || ""}`.toUpperCase();
      return searchContent.includes(targetSigla);
    });
  }, [productos, selectedPlaza]);

  // Marcas disponibles en la zona seleccionada
  const marcasDisponibles = useMemo(() => {
    const set = new Set<string>();
    productosFiltradosPorZona.forEach((p) => {
      if (p.marca) {
        set.add(p.marca.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productosFiltradosPorZona]);

  // Modelos filtrados según la marca seleccionada
  const productosFiltrados = useMemo(() => {
    if (!selectedMarca) return [];
    return productosFiltradosPorZona.filter(
      (p) => p.marca.toLowerCase().trim() === selectedMarca.toLowerCase().trim()
    );
  }, [productosFiltradosPorZona, selectedMarca]);

  // Producto seleccionado
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return productosFiltrados.find((p) => p.id === selectedProductId) || null;
  }, [selectedProductId, productosFiltrados]);

  // Costo asociado a la plaza y producto seleccionado
  const matchedCosto = useMemo(() => {
    if (!selectedProductId || !selectedPlaza) return null;
    const match = costos.find(
      (c) =>
        c.producto_id === selectedProductId &&
        c.proveedor.toLowerCase().trim() === selectedPlaza.toLowerCase().trim()
    );
    return match ? Number(match.costo) : 0;
  }, [selectedProductId, selectedPlaza, costos]);

  // Porcentajes de enganche según historial
  const enganchePorcentajes = useMemo(() => {
    if (!clienteHistorial) return [];
    const config = configEnganches.find(
      (c) => c.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
    );
    return config ? config.porcentajes : [];
  }, [clienteHistorial, configEnganches]);

  // Formateador de moneda en MXN (incluye el signo $)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const runFallbackCopy = (textToCopy: string): boolean => {
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
      textArea.setAttribute("readonly", ""); // Evita apertura de teclado
      
      document.body.appendChild(textArea);
      
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, 999999);
      
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
  };

  const handleCopyText = (textToCopy: string, index: number) => {
    // Intento 1: Clipboard API moderna (requiere HTTPS o localhost)
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 1500);
        })
        .catch(() => {
          // Si falla async, intentamos fallback
          const copied = runFallbackCopy(textToCopy);
          if (copied) {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500);
          }
        });
      return;
    }

    // Intento 2: Fallback síncrono para HTTP e IP local
    const copied = runFallbackCopy(textToCopy);
    if (copied) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  };

  const hasCost = matchedCosto !== null && matchedCosto > 0;
  const isReadyToCalculate = selectedProduct && clienteHistorial;

  return (
    <div className="space-y-8">
      {/* PANEL DE CONTROL / SELECTORES */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl">
        
        {/* Fila 1: Selector de Zona */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 ml-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">location_on</span>
            Zona
          </label>
          <div className="relative">
            <select
              value={selectedPlaza}
              onChange={(e) => handlePlazaChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer pr-10"
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
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
              expand_more
            </span>
          </div>
        </div>

        {/* Fila 2: Selector de Marca */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 ml-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">sell</span>
            Marca
          </label>
          <div className="relative">
            <select
              value={selectedMarca}
              onChange={(e) => {
                setSelectedMarca(e.target.value);
                setSelectedProductId("");
              }}
              disabled={!selectedPlaza}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer pr-10 disabled:opacity-40 disabled:cursor-not-allowed"
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
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
              expand_more
            </span>
          </div>
        </div>

        {/* Fila 3: Selector de Modelo de Celular */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 ml-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">smartphone</span>
            Modelo
          </label>
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={!selectedMarca}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer pr-10 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ colorScheme: "dark" }}
              suppressHydrationWarning={true}
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">
                {!selectedMarca ? "Primero elija una marca..." : "Seleccione un modelo..."}
              </option>
              {productosFiltrados.map((p) => {
                const spec = `${p.modelo} - ${p.almacenamiento}${p.ram ? ` - ${p.ram}` : ""}${p.color ? ` (${p.color})` : ""}`;
                return (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                    {spec}
                  </option>
                );
              })}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
              expand_more
            </span>
          </div>
        </div>

        {/* Fila 4: Selector de Historial del Cliente */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 ml-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">person</span>
            ¿Cliente con historial?
          </label>
          <div className="grid grid-cols-2 gap-3 h-[48px]">
            <button
              type="button"
              onClick={() => setClienteHistorial("Si")}
              className={`rounded-xl text-sm font-bold transition-all flex items-center justify-center cursor-pointer border ${
                clienteHistorial.toLowerCase() === "si"
                  ? "bg-secondary text-slate-950 border-secondary shadow-[0_0_15px_rgba(45,212,191,0.25)]"
                  : "bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
              }`}
            >
              Sí
            </button>

            <button
              type="button"
              onClick={() => setClienteHistorial("No")}
              className={`rounded-xl text-sm font-bold transition-all flex items-center justify-center cursor-pointer border ${
                clienteHistorial.toLowerCase() === "no"
                  ? "bg-secondary text-slate-950 border-secondary shadow-[0_0_15px_rgba(45,212,191,0.25)]"
                  : "bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
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
          <div className="bg-slate-900/20 border border-slate-800/60 rounded-3xl p-10 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-3xl">request_quote</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-300">Esperando selección</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
                Seleccione zona, modelo de celular y si el cliente cuenta con historial para calcular las opciones de enganche.
              </p>
            </div>
          </div>
        ) : !hasCost ? (
          /* CASO: FALTA AGREGAR COSTO */
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-10 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl mx-auto flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-400">Falta agregar costo</h3>
              <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto leading-relaxed">
                El modelo <strong className="text-white">{selectedProduct?.marca} {selectedProduct?.modelo}</strong> ({selectedProduct?.almacenamiento}) aún no tiene un costo asignado en el sistema para la zona de <strong className="text-white">{selectedPlaza}</strong>.
              </p>
            </div>
          </div>
        ) : (
          /* CASO: CÁLCULO DISPONIBLE CON TABLA DE ENGANCHES */
          <div className="space-y-4">
            {/* Tabla de opciones de enganche */}
            <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-slate-950 p-4 border-b border-slate-800/80">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-center">
                  Opciones de Enganche
                </h4>
              </div>

              {enganchePorcentajes.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No hay porcentajes configurados para este tipo de cliente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-950 border-b border-slate-800/80 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-center">Porcentaje</th>
                        <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-center">Monto a Cobrar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enganchePorcentajes.map((porcentaje, idx) => {
                        const engancheCalculado = (matchedCosto! * (porcentaje / 100));
                        const formattedValue = formatCurrency(engancheCalculado);
                        const isCopied = copiedIndex === idx;

                        return (
                          <tr key={`${porcentaje}-${idx}`} className="border-b border-slate-800/40 last:border-b-0 hover:bg-slate-900/10 transition-colors">
                            <td className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-secondary text-sm sm:text-base text-center">
                              {porcentaje}%
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-center">
                              <div 
                                onClick={() => handleCopyText(formattedValue, idx)}
                                className="relative inline-block group cursor-pointer select-none"
                                style={{ WebkitTapHighlightColor: "transparent" }}
                              >
                                <span className="text-white font-mono font-bold text-sm sm:text-lg hover:text-secondary transition-colors">
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
          </div>
        )}
      </div>
    </div>
  );
}
