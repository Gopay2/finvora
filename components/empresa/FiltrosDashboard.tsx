'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface FiltrosDashboardProps {
  currentYear: string;          // 'actual' | 'historico' | '2024', etc.
  currentMonth: string;         // 'actual' | '1' | '2' ... '12' | '' (vacío es desmarcado)
  currentWeek: string;          // 'actual' | 'anterior' | 'S1' ... 'S6' | '' (vacío es desmarcado)
  availableYears: number[];     // Años disponibles en el sistema
  weeksInSelectedMonth: number; // 4, 5 o 6 según el mes seleccionado
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function FiltrosDashboard({
  currentYear,
  currentMonth,
  currentWeek,
  availableYears,
  weeksInSelectedMonth,
}: FiltrosDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados para controlar la apertura de los dropdowns de selección personalizada
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Referencias para cerrar los dropdowns al hacer clic fuera
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Nombres de los meses en español para mostrar en el selector
  const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  // Cerrar dropdowns si se hace clic fuera del componente
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(target)) {
        setIsMonthDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(target)) {
        setIsYearDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Función utilitaria para actualizar múltiples parámetros de la URL
  const updateURLFilters = (newFilters: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // ─── Controladores de Eventos (Handlers) ───────────────────────────────────

  // Manejar cambio de Año
  const handleYearChange = (yearOption: 'actual' | 'historico' | string) => {
    setIsYearDropdownOpen(false);
    
    if (yearOption === 'historico') {
      // Histórico limpia y deshabilita todos los demás filtros
      updateURLFilters({
        year: 'historico',
        month: null,
        week: null,
      });
    } else if (yearOption === 'actual') {
      // Si se selecciona Año Actual, se desmarca si ya estaba marcado
      if (currentYear === 'actual') {
        // Al desmarcar el año, pasamos a histórico (o se limpia el filtro)
        updateURLFilters({
          year: 'historico',
          month: null,
          week: null,
        });
      } else {
        updateURLFilters({
          year: 'actual',
          // Mantenemos mes y semana si son compatibles, o los reiniciamos a actual por defecto
          month: currentMonth || 'actual',
          week: currentWeek || 'actual',
        });
      }
    } else {
      // Selección de un año específico
      const isSameYear = currentYear === yearOption;
      if (isSameYear) {
        // Deseleccionar (vuelve a actual)
        updateURLFilters({
          year: 'actual',
          month: currentMonth || 'actual',
          week: currentWeek || 'actual',
        });
      } else {
        // Cambiar año: si la semana era 'actual' o 'anterior', la limpiamos porque
        // son relativas al presente y no aplican a años pasados.
        // Si el mes era 'actual', también lo limpiamos porque es relativo y queremos
        // mostrar el año completo.
        const nextWeek = (currentWeek === 'actual' || currentWeek === 'anterior' || !currentWeek) ? null : currentWeek;
        const nextMonth = (currentMonth === 'actual' || !currentMonth) ? null : currentMonth;
        updateURLFilters({
          year: yearOption,
          month: nextMonth,
          week: nextWeek,
        });
      }
    }
  };

  // Manejar cambio de Mes
  const handleMonthChange = (monthOption: 'actual' | string) => {
    setIsMonthDropdownOpen(false);

    if (monthOption === 'actual') {
      if (currentMonth === 'actual') {
        // Si ya era actual y hacemos clic de nuevo, lo desmarcamos (sube a nivel año)
        updateURLFilters({
          month: null,
          week: null, // Si no hay mes, no hay semanas
        });
      } else {
        updateURLFilters({
          month: 'actual',
          // Restauramos semana a actual si el año también es actual
          week: currentYear === 'actual' ? 'actual' : null,
        });
      }
    } else {
      // Selección de un mes específico (ej: '5')
      const isSameMonth = currentMonth === monthOption;
      if (isSameMonth) {
        // Deseleccionar
        updateURLFilters({
          month: null,
          week: null,
        });
      } else {
        // Cambiar de mes: limpiamos semana si era 'actual' o 'anterior'
        const nextWeek = (currentWeek === 'actual' || currentWeek === 'anterior') ? null : currentWeek;
        updateURLFilters({
          month: monthOption,
          week: nextWeek,
        });
      }
    }
  };

  // Manejar cambio de Semana
  const handleWeekChange = (weekOption: 'actual' | 'anterior' | string) => {
    const isSameWeek = currentWeek === weekOption;
    if (isSameWeek) {
      // Deseleccionar: se muestra todo el mes completo
      updateURLFilters({
        week: null,
      });
    } else {
      updateURLFilters({
        week: weekOption,
      });
    }
  };

  // ─── Helpers de Renderizado ────────────────────────────────────────────────

  // Determinar si los botones relativos de semana pueden estar habilitados
  const isRelativeWeekEnabled = currentYear === 'actual' && currentMonth === 'actual';

  // Determinar si los filtros de mes y semana deben estar deshabilitados por completo (modo histórico)
  const isTimeFilterDisabled = currentYear === 'historico';

  // Nombre del mes seleccionado actualmente para el botón "Elegir"
  const getSelectedMonthLabel = () => {
    if (currentMonth && currentMonth !== 'actual') {
      const found = meses.find(m => m.value === currentMonth);
      return found ? found.label : 'Elegir';
    }
    return 'Elegir';
  };

  // Año seleccionado actualmente para el botón "Elegir"
  const getSelectedYearLabel = () => {
    if (currentYear && currentYear !== 'actual' && currentYear !== 'historico') {
      return currentYear;
    }
    return 'Elegir';
  };

  return (
    <div className={styles.container}>
      {/* ─── COLUMNA 1: SEMANA ────────────────────────────────────────────────── */}
      <div className={styles.column}>
        <span className={styles.columnTitle}>Semana</span>
        <div className="flex flex-col gap-2.5 w-full">
          {/* Fila superior: Actual y Anterior */}
          <div className="flex gap-2 w-full">
            <button
              onClick={() => handleWeekChange('actual')}
              disabled={isTimeFilterDisabled || !isRelativeWeekEnabled}
              className={`${styles.button} ${
                currentWeek === 'actual' ? styles.buttonActive : ''
              } ${(!isRelativeWeekEnabled || isTimeFilterDisabled) ? styles.buttonDisabled : ''}`}
            >
              Actual
            </button>
            <button
              onClick={() => handleWeekChange('anterior')}
              disabled={isTimeFilterDisabled || !isRelativeWeekEnabled}
              className={`${styles.button} ${
                currentWeek === 'anterior' ? styles.buttonActive : ''
              } ${(!isRelativeWeekEnabled || isTimeFilterDisabled) ? styles.buttonDisabled : ''}`}
            >
              Anterior
            </button>
          </div>
          {/* Fila inferior: S1 a S6 */}
          <div className="grid grid-cols-6 gap-1 w-full">
            {Array.from({ length: 6 }, (_, index) => {
              const weekNum = index + 1;
              const weekValue = `S${weekNum}`;
              const isWeekValid = weekNum <= weeksInSelectedMonth;
              const isSelected = currentWeek === weekValue;

              return (
                <button
                  key={weekValue}
                  onClick={() => handleWeekChange(weekValue)}
                  disabled={isTimeFilterDisabled || !currentMonth || !isWeekValid}
                  title={!isWeekValid ? 'Esta semana no existe en el mes seleccionado' : ''}
                  className={`${styles.weekButton} ${
                    isSelected ? styles.weekButtonActive : ''
                  } ${(!isWeekValid || isTimeFilterDisabled || !currentMonth) ? styles.weekButtonDisabled : ''}`}
                >
                  {weekValue}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ─── COLUMNA 2: MES ───────────────────────────────────────────────────── */}
      <div className={styles.column}>
        <span className={styles.columnTitle}>Mes</span>
        <div className="flex gap-2 w-full relative" ref={monthDropdownRef}>
          <button
            onClick={() => handleMonthChange('actual')}
            disabled={isTimeFilterDisabled}
            className={`${styles.button} ${
              currentMonth === 'actual' ? styles.buttonActive : ''
            } ${isTimeFilterDisabled ? styles.buttonDisabled : ''}`}
          >
            Actual
          </button>

          <button
            onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            disabled={isTimeFilterDisabled}
            className={`${styles.button} ${
              currentMonth && currentMonth !== 'actual' ? styles.buttonActive : ''
            } ${isTimeFilterDisabled ? styles.buttonDisabled : ''} flex items-center justify-center`}
          >
            <span className="truncate">{getSelectedMonthLabel()}</span>
          </button>

          {/* Dropdown de Meses */}
          {isMonthDropdownOpen && (
            <div className={styles.dropdown}>
              <div className="grid grid-cols-3 gap-1 p-2 max-h-48 overflow-y-auto custom-scrollbar">
                {meses.map(m => (
                  <button
                    key={m.value}
                    onClick={() => handleMonthChange(m.value)}
                    className={`${styles.dropdownItem} ${
                      currentMonth === m.value ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'text-slate-300 border border-transparent'
                    }`}
                  >
                    {m.label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      {/* ─── COLUMNA 3: AÑO ───────────────────────────────────────────────────── */}
      <div className={styles.column}>
        <span className={styles.columnTitle}>Año</span>
        <div className="flex gap-2 w-full relative" ref={yearDropdownRef}>
          <button
            onClick={() => handleYearChange('actual')}
            className={`${styles.button} ${
              currentYear === 'actual' ? styles.buttonActive : ''
            }`}
          >
            Actual
          </button>

          <button
            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            className={`${styles.button} ${
              currentYear !== 'actual' && currentYear !== 'historico' ? styles.buttonActive : ''
            } flex items-center justify-center`}
          >
            <span>{getSelectedYearLabel()}</span>
          </button>

          <button
            onClick={() => handleYearChange('historico')}
            className={`${styles.button} ${
              currentYear === 'historico' ? styles.buttonActive : ''
            }`}
          >
            Histórico
          </button>

          {/* Dropdown de Años */}
          {isYearDropdownOpen && (
            <div className={`${styles.dropdown} w-36`}>
              <div className="flex flex-col gap-1 p-1 max-h-40 overflow-y-auto custom-scrollbar">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year.toString())}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all ${
                      currentYear === year.toString() ? 'text-secondary bg-slate-800/80 font-black' : 'text-slate-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Estilos Extraídos (Tailwind) ───────────────────────────────────────────
const styles = {
  container: "flex flex-col md:flex-row items-stretch justify-between bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-5 rounded-[2rem] gap-4 md:gap-6 shadow-2xl relative z-30",
  column: "flex-1 flex flex-col items-center gap-2 min-w-0 justify-start w-full",
  columnTitle: "text-xs sm:text-sm uppercase tracking-widest text-slate-400 font-bold mb-1.5 text-center w-full",
  divider: "hidden md:block w-px bg-slate-800/80 my-1 self-stretch",
  
  // Botones Generales (Actual, Anterior, Elegir, Histórico)
  button: "flex-1 py-2 px-3 bg-slate-950/40 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold uppercase transition-all duration-200 text-center hover:text-slate-200 hover:border-slate-700 active:scale-[0.98] select-none cursor-pointer",
  buttonActive: "!bg-secondary !text-slate-950 !border-secondary shadow-[0_0_12px_rgba(162,231,255,0.35)] font-black hover:!text-slate-950",
  buttonDisabled: "opacity-35 cursor-not-allowed hover:text-slate-400 hover:border-slate-800 active:scale-100",

  // Botones de Semanas S1 - S6
  weekButton: "py-2 bg-slate-950/40 border border-slate-800 text-xs font-bold text-slate-400 rounded-lg transition-all duration-200 text-center hover:text-slate-200 hover:border-slate-700 active:scale-95 select-none cursor-pointer",
  weekButtonActive: "!bg-secondary !text-slate-950 !border-secondary shadow-[0_0_12px_rgba(162,231,255,0.35)] font-black hover:!text-slate-950",
  weekButtonDisabled: "opacity-25 cursor-not-allowed hover:text-slate-400 hover:border-slate-800 active:scale-100",

  // Dropdowns de Selección
  dropdown: "absolute left-0 right-0 top-full mt-2 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200",
  dropdownItem: "py-1.5 text-xs font-bold uppercase rounded-lg text-center transition-all hover:bg-slate-800 hover:text-white cursor-pointer",
};
