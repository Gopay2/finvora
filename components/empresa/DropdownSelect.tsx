import React, { useState, useEffect, useRef } from "react";
import { styles } from "@/components/empresa/comprobantes-types";

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
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[16px] sm:text-sm text-left text-slate-100 focus:outline-none focus:border-secondary transition-all flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed md:h-[50px]"
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
