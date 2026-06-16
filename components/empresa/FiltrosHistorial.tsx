import React, { useState, useEffect, useRef, useMemo } from "react";
import type { OptionItem } from "./comprobantes-types";
import { styles } from "./comprobantes-types";

interface FiltrosHistorialProps {
  vendedores: OptionItem[];
  repartidores: OptionItem[];
  isDownloading: boolean;
  downloadProgress: string;
  onFilterChange: (filters: {
    dateFrom: string;
    dateTo: string;
    filterVendedor: string;
    filterRepartidor: string;
  }) => void;
}

export default function FiltrosHistorial({
  vendedores,
  repartidores,
  isDownloading,
  downloadProgress,
  onFilterChange
}: FiltrosHistorialProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterVendedor, setFilterVendedor] = useState("");
  const [filterRepartidor, setFilterRepartidor] = useState("");

  const [showFilterVendedorDropdown, setShowFilterVendedorDropdown] = useState(false);
  const [showFilterRepartidorDropdown, setShowFilterRepartidorDropdown] = useState(false);
  const filterVendedorRef = useRef<HTMLDivElement>(null);
  const filterRepartidorRef = useRef<HTMLDivElement>(null);
  const [filterVendedorSearch, setFilterVendedorSearch] = useState("");
  const filterVendedorRefState = useRef<string>("");

  useEffect(() => {
    filterVendedorRefState.current = filterVendedor;
  }, [filterVendedor]);

  // Propagar filtros al padre cuando cambian
  useEffect(() => {
    onFilterChange({
      dateFrom,
      dateTo,
      filterVendedor,
      filterRepartidor
    });
  }, [dateFrom, dateTo, filterVendedor, filterRepartidor, onFilterChange]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterVendedorRef.current && !filterVendedorRef.current.contains(event.target as Node)) {
        setShowFilterVendedorDropdown(false);
      }
      if (filterRepartidorRef.current && !filterRepartidorRef.current.contains(event.target as Node)) {
        setShowFilterRepartidorDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filterFilteredVendedores = useMemo(() => {
    if (!filterVendedorSearch) return vendedores;
    return vendedores.filter(vendedor =>
      vendedor.display.toLowerCase().includes(filterVendedorSearch.toLowerCase())
    );
  }, [vendedores, filterVendedorSearch]);

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterVendedor("");
    setFilterVendedorSearch("");
    setFilterRepartidor("");
    setShowFilterVendedorDropdown(false);
    setShowFilterRepartidorDropdown(false);
  };

  return (
    <div className="bg-slate-900/50 p-6 border-b border-slate-800/60 flex flex-col gap-4 text-sm">
      {/* Fila 1: Fechas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-base">calendar_month</span>
            <span className="text-slate-300 font-semibold text-sm">Fechas:</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-slate-400 min-w-[45px] sm:min-w-0">Desde:</label>
            <div className="relative flex items-center flex-1 sm:flex-initial">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                onKeyDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  try {
                    event.currentTarget.showPicker();
                  } catch (error) { }
                }}
                className={`${styles.dateInput} ${dateFrom ? "text-slate-200" : "text-transparent"}`}
                style={{ colorScheme: 'dark' }}
                suppressHydrationWarning
              />
              {!dateFrom && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
                  dd/mm/aaaa
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-slate-400 min-w-[45px] sm:min-w-0">Hasta:</label>
            <div className="relative flex items-center flex-1 sm:flex-initial">
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                onKeyDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  try {
                    event.currentTarget.showPicker();
                  } catch (error) { }
                }}
                className={`${styles.dateInput} ${dateTo ? "text-slate-200" : "text-transparent"}`}
                style={{ colorScheme: 'dark' }}
                suppressHydrationWarning
              />
              {!dateTo && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
                  dd/mm/aaaa
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fila 2: Vendedor y Repartidor/Ubicación */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Vendedor */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto relative" ref={filterVendedorRef}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-base">person</span>
            <span className="text-slate-300 font-semibold text-sm">Vendedor:</span>
          </div>
          <div className="relative w-full sm:w-[220px]">
            <input
              type="text"
              placeholder="Todos los vendedores"
              value={filterVendedorSearch}
              onChange={(event) => {
                setFilterVendedorSearch(event.target.value);
                setFilterVendedor("");
                setShowFilterVendedorDropdown(true);
              }}
              onFocus={() => setShowFilterVendedorDropdown(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (!filterVendedorRefState.current) {
                    setFilterVendedorSearch("");
                  } else {
                    const found = vendedores.find(vendedor => vendedor.id === filterVendedorRefState.current);
                    setFilterVendedorSearch(found ? found.display : "");
                  }
                  setShowFilterVendedorDropdown(false);
                }, 200);
              }}
              className="w-full h-[44px] sm:h-[34px] bg-slate-950 border border-slate-800 rounded-lg pl-2.5 pr-8 text-[16px] sm:text-[13px] text-slate-200 focus:outline-none focus:border-secondary transition-all cursor-pointer text-left truncate"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              suppressHydrationWarning
            />
            {filterVendedorSearch && (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setFilterVendedorSearch("");
                  setFilterVendedor("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-0 cursor-pointer flex items-center z-10"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
            {showFilterVendedorDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-slate-950/95 border border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar glass-effect animate-in fade-in duration-200 left-0">
                <div
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setFilterVendedor("");
                    setFilterVendedorSearch("");
                    setShowFilterVendedorDropdown(false);
                  }}
                  className="px-4 py-2.5 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-[16px] sm:text-[13px] text-slate-300 text-left border-b border-slate-900/50"
                >
                  Todos los vendedores
                </div>
                {filterFilteredVendedores.map((vendedor) => (
                  <div
                    key={vendedor.id}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setFilterVendedor(vendedor.id);
                      setFilterVendedorSearch(vendedor.display);
                      setShowFilterVendedorDropdown(false);
                    }}
                    className={`px-4 py-2.5 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-[16px] sm:text-[13px] text-left border-b border-slate-900/50 last:border-b-0 ${
                      filterVendedor === vendedor.id ? "text-secondary font-semibold" : "text-slate-200"
                    }`}
                  >
                    {vendedor.display}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Repartidor / Ubicación */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto relative" ref={filterRepartidorRef}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-base">local_shipping</span>
            <span className="text-slate-300 font-semibold text-sm">Repartidor:</span>
          </div>
          <div className="relative w-full sm:w-[220px]">
            <button
              type="button"
              onClick={() => {
                setShowFilterRepartidorDropdown(!showFilterRepartidorDropdown);
                setShowFilterVendedorDropdown(false);
              }}
              className="w-full h-[44px] sm:h-[34px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 text-[16px] sm:text-[13px] text-slate-200 focus:outline-none focus:border-secondary transition-all cursor-pointer text-left truncate flex items-center"
            >
              {repartidores.find(repartidor => repartidor.id === filterRepartidor)?.display || "Todos los repartidores"}
            </button>
            {showFilterRepartidorDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-slate-950/95 border border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar glass-effect animate-in fade-in duration-200 left-0">
                <div
                  onClick={() => {
                    setFilterRepartidor("");
                    setShowFilterRepartidorDropdown(false);
                  }}
                  className="px-4 py-2.5 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-[16px] sm:text-[13px] text-slate-300 text-left border-b border-slate-900/50"
                >
                  Todos los repartidores
                </div>
                {repartidores.map((repartidor) => (
                  <div
                    key={repartidor.id}
                    onClick={() => {
                      setFilterRepartidor(repartidor.id);
                      setShowFilterRepartidorDropdown(false);
                    }}
                    className={`px-4 py-2.5 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-[16px] sm:text-[13px] text-left border-b border-slate-900/50 last:border-b-0 ${
                      filterRepartidor === repartidor.id ? "text-secondary font-semibold" : "text-slate-200"
                    }`}
                  >
                    {repartidor.display}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botón de limpiar y progreso */}
        {(dateFrom || dateTo || filterVendedor || filterRepartidor || isDownloading) && (
          <div className="flex items-center gap-4 w-full sm:w-auto sm:ml-auto justify-end max-sm:justify-start">
            {(dateFrom || dateTo || filterVendedor || filterRepartidor) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
            {isDownloading && (
              <div className="text-xs text-secondary font-semibold animate-pulse flex items-center gap-2">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-secondary border-t-transparent rounded-full" />
                {downloadProgress}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
