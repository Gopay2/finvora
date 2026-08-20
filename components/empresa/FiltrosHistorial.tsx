import React, { useState, useEffect, useRef } from "react";
import type { OptionItem } from "./comprobantes-types";
import { DateRangeFilter } from "./filtros/DateRangeFilter";

interface FiltrosHistorialProps {
  vendedores: OptionItem[];
  repartidores: OptionItem[];
  isDownloading: boolean;
  downloadProgress: string;
  onFilterChange: (filters: {
    searchQuery: string;
    dateFrom: string;
    dateTo: string;
    filterVendedores: string[];
    filterRepartidores: string[];
  }) => void;
}

const SELECT_TRIGGER_BUTTON_CLASSES =
  "w-full h-[44px] sm:h-[34px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 text-[16px] sm:text-[13px] text-slate-200 focus:outline-none focus:border-secondary transition-all cursor-pointer text-left truncate flex items-center justify-between";

export default function FiltrosHistorial({
  vendedores,
  repartidores,
  isDownloading,
  downloadProgress,
  onFilterChange
}: FiltrosHistorialProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterVendedores, setFilterVendedores] = useState<string[]>([]);
  const [filterRepartidores, setFilterRepartidores] = useState<string[]>([]);

  const [showFilterVendedorDropdown, setShowFilterVendedorDropdown] = useState(false);
  const [showFilterRepartidorDropdown, setShowFilterRepartidorDropdown] = useState(false);
  const filterVendedorRef = useRef<HTMLDivElement>(null);
  const filterRepartidorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onFilterChange({
      searchQuery,
      dateFrom,
      dateTo,
      filterVendedores,
      filterRepartidores
    });
  }, [searchQuery, dateFrom, dateTo, filterVendedores, filterRepartidores, onFilterChange]);

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

  const handleClearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setFilterVendedores([]);
    setFilterRepartidores([]);
    setShowFilterVendedorDropdown(false);
    setShowFilterRepartidorDropdown(false);
  };

  return (
    <div className="bg-slate-900/50 p-6 border-b border-slate-800/60 flex flex-col gap-4 text-sm relative z-20">
      {/* Fila 0: Buscador Global (Cliente, IMEI, TAG) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-base">search</span>
          <span className="text-slate-300 font-semibold text-sm">Buscar:</span>
        </div>
        <div className="relative w-full sm:w-[320px] md:w-[380px] flex items-center">
          <input
            type="text"
            placeholder="Cliente, IMEI o Vendedor"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full h-10 px-4 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-base md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-secondary transition-all"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            suppressHydrationWarning
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-slate-500 hover:text-slate-300 bg-transparent border-0 cursor-pointer flex items-center"
              title="Borrar búsqueda"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Fila 1: Fechas con DateRangeFilter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangeFilter
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          label="Fechas:"
        />
      </div>

      {/* Fila 2: Vendedor y Repartidor/Ubicación */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Vendedor */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto relative" ref={filterVendedorRef}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-base">person</span>
            <span className="text-slate-300 font-semibold text-sm">Vendedor:</span>
          </div>
          <div className="relative w-full sm:w-[180px]">
            <button
              type="button"
              onClick={() => {
                setShowFilterVendedorDropdown(!showFilterVendedorDropdown);
                setShowFilterRepartidorDropdown(false);
              }}
              className={SELECT_TRIGGER_BUTTON_CLASSES}
            >
              <span>
                {filterVendedores.length === 0
                  ? "Todos los vendedores"
                  : filterVendedores.length === 1
                  ? vendedores.find(vendedor => vendedor.id === filterVendedores[0])?.display
                  : `Vendedores (${filterVendedores.length})`}
              </span>
              <span className="material-symbols-outlined text-slate-500 text-xs shrink-0 select-none">
                {showFilterVendedorDropdown ? "expand_less" : "expand_more"}
              </span>
            </button>
            {showFilterVendedorDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-slate-950/95 border border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar glass-effect animate-in fade-in duration-200 left-0">
                <div
                  onClick={() => {
                    setFilterVendedores([]);
                  }}
                  className={`px-4 py-2 hover:bg-secondary/15 cursor-pointer transition-all text-left border-b border-slate-900/50 text-xs sm:text-[13px] border-l-2 ${
                    filterVendedores.length === 0
                      ? "bg-secondary/10 text-secondary font-bold border-l-secondary"
                      : "text-slate-300 border-l-transparent"
                  }`}
                >
                  <span>Todos los vendedores</span>
                </div>
                {vendedores.map((vendedor) => {
                  const isSelected = filterVendedores.includes(vendedor.id);
                  return (
                    <div
                      key={vendedor.id}
                      onClick={() => {
                        setFilterVendedores(prevVendedores =>
                          isSelected
                            ? prevVendedores.filter(id => id !== vendedor.id)
                            : [...prevVendedores, vendedor.id]
                        );
                      }}
                      className={`px-4 py-2 hover:bg-secondary/15 cursor-pointer transition-all text-left border-b border-slate-900/50 last:border-b-0 text-xs sm:text-[13px] border-l-2 ${
                        isSelected
                          ? "bg-secondary/10 text-secondary font-bold border-l-secondary"
                          : "text-slate-300 border-l-transparent"
                      }`}
                    >
                      <span>{vendedor.display}</span>
                    </div>
                  );
                })}
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
          <div className="relative w-full sm:w-[180px]">
            <button
              type="button"
              onClick={() => {
                setShowFilterRepartidorDropdown(!showFilterRepartidorDropdown);
                setShowFilterVendedorDropdown(false);
              }}
              className={SELECT_TRIGGER_BUTTON_CLASSES}
            >
              <span>
                {filterRepartidores.length === 0
                  ? "Todos los repartidores"
                  : filterRepartidores.length === 1
                  ? repartidores.find(repartidor => repartidor.id === filterRepartidores[0])?.display
                  : `Repartidores (${filterRepartidores.length})`}
              </span>
              <span className="material-symbols-outlined text-slate-500 text-xs shrink-0 select-none">
                {showFilterRepartidorDropdown ? "expand_less" : "expand_more"}
              </span>
            </button>
            {showFilterRepartidorDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-slate-950/95 border border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar glass-effect animate-in fade-in duration-200 left-0">
                <div
                  onClick={() => {
                    setFilterRepartidores([]);
                  }}
                  className={`px-4 py-2 hover:bg-secondary/15 cursor-pointer transition-all text-left border-b border-slate-900/50 text-xs sm:text-[13px] border-l-2 ${
                    filterRepartidores.length === 0
                      ? "bg-secondary/10 text-secondary font-bold border-l-secondary"
                      : "text-slate-300 border-l-transparent"
                  }`}
                >
                  <span>Todos los repartidores</span>
                </div>
                {repartidores.map((repartidor) => {
                  const isSelected = filterRepartidores.includes(repartidor.id);
                  return (
                    <div
                      key={repartidor.id}
                      onClick={() => {
                        setFilterRepartidores(prevRepartidores =>
                          isSelected
                            ? prevRepartidores.filter(id => id !== repartidor.id)
                            : [...prevRepartidores, repartidor.id]
                        );
                      }}
                      className={`px-4 py-2 hover:bg-secondary/15 cursor-pointer transition-all text-left border-b border-slate-900/50 last:border-b-0 text-xs sm:text-[13px] border-l-2 ${
                        isSelected
                          ? "bg-secondary/10 text-secondary font-bold border-l-secondary"
                          : "text-slate-300 border-l-transparent"
                      }`}
                    >
                      <span>{repartidor.display}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Botón de limpiar y progreso */}
        {(searchQuery || dateFrom || dateTo || filterVendedores.length > 0 || filterRepartidores.length > 0 || isDownloading) && (
          <div className="flex items-center gap-4 w-full sm:w-auto sm:ml-auto justify-end max-sm:justify-start">
            {(searchQuery || dateFrom || dateTo || filterVendedores.length > 0 || filterRepartidores.length > 0) && (
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
