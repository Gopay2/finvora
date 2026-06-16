import React, { useState, useEffect, useRef, useMemo } from "react";
import type { OptionItem } from "./comprobantes-types";
import { styles } from "./comprobantes-types";

// ─── Autocomplete de Vendedor ────────────────────────────────────────────────
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

// ─── Selector Dropdown Genérico ──────────────────────────────────────────────
interface DropdownSelectProps<T> {
  placeholder: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
  valueDisplay: string;
  items: T[];
  onSelect: (item: T) => void;
  getItemKey: (item: T) => string;
  getItemDisplay: (item: T) => string;
  renderItem?: (item: T, onClick: () => void) => React.ReactNode;
}

export function DropdownSelect<T>({
  placeholder,
  disabled = false,
  disabledPlaceholder,
  valueDisplay,
  items,
  onSelect,
  getItemKey,
  getItemDisplay,
  renderItem
}: DropdownSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[16px] sm:text-sm text-left text-slate-100 focus:outline-none focus:border-secondary transition-all flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate">
          {disabled && disabledPlaceholder ? disabledPlaceholder : (valueDisplay || placeholder)}
        </span>
      </button>

      {isOpen && !disabled && items.length > 0 && (
        <div className={styles.suggestionsContainer}>
          {items.map((item) => {
            const key = getItemKey(item);
            const display = getItemDisplay(item);
            const handleItemClick = () => {
              onSelect(item);
              setIsOpen(false);
            };

            if (renderItem) {
              return renderItem(item, handleItemClick);
            }

            return (
              <div
                key={key}
                onClick={handleItemClick}
                className="px-4 py-3 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-sm text-slate-200 border-b border-slate-900/50 last:border-b-0 flex items-center"
              >
                <span className="font-medium">{display}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
