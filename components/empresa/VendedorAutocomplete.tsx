import React, { useState, useEffect, useRef, useMemo } from "react";
import type { OptionItem } from "@/components/empresa/comprobantes-types";
import { styles } from "@/components/empresa/comprobantes-types";

interface VendedorAutocompleteProps {
  vendedores: OptionItem[];
  vendedorSearch: string;
  setVendedorSearch: (val: string) => void;
  selectedVendedor: OptionItem | null;
  setSelectedVendedor: (val: OptionItem | null) => void;
}

export function VendedorAutocomplete({
  vendedores,
  vendedorSearch,
  setVendedorSearch,
  selectedVendedor,
  setSelectedVendedor
}: VendedorAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const selectedVendedorRef = useRef<OptionItem | null>(null);
  selectedVendedorRef.current = selectedVendedor;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredVendedores = useMemo(() => {
    if (!vendedorSearch) return vendedores;
    return vendedores.filter((vendedor) =>
      vendedor.display.toLowerCase().includes(vendedorSearch.toLowerCase())
    );
  }, [vendedores, vendedorSearch]);

  return (
    <div className="relative w-full" ref={suggestionsRef}>
      <input
        type="text"
        placeholder="Escribe para buscar vendedor..."
        value={vendedorSearch}
        onChange={(event) => {
          setVendedorSearch(event.target.value);
          setSelectedVendedor(null);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => {
            if (!selectedVendedorRef.current) {
              setVendedorSearch("");
            } else {
              setVendedorSearch(selectedVendedorRef.current.display);
            }
            setShowSuggestions(false);
          }, 200);
        }}
        className={styles.autocompleteInput}
        required
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        suppressHydrationWarning
      />
      <input
        type="hidden"
        name="vendedor_id"
        value={selectedVendedor?.id || ""}
      />
      {vendedorSearch && (
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            setVendedorSearch("");
            setSelectedVendedor(null);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-0 cursor-pointer flex items-center"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      )}

      {showSuggestions && filteredVendedores.length > 0 && (
        <div className={styles.suggestionsContainer}>
          {filteredVendedores.map((vendedor) => (
            <div
              key={vendedor.id}
              onMouseDown={(event) => {
                event.preventDefault();
                setSelectedVendedor(vendedor);
                setVendedorSearch(vendedor.display);
                setShowSuggestions(false);
              }}
              className="px-4 py-3 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-sm text-slate-200 border-b border-slate-900/50 last:border-b-0 flex items-center"
            >
              <span className="font-medium">{vendedor.display}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
