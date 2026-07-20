'use client';

import React, { useState, useRef, useMemo, useEffect } from "react";
import { submitOrdenGarantia } from "@/app/empresa/webapp/ordenes-garantia/actions";

interface ZonaOption {
  nombre_zona: string;
}

interface CatalogoProducto {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
  ram: string;
}

interface OrdenesGarantiaFormProps {
  zonasReparto: ZonaOption[];
  productos: CatalogoProducto[];
}

const styles = {
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-8",
  sectionTitle: "text-lg font-bold text-secondary border-b border-slate-800 pb-2 mb-4",
  inputGroup: "space-y-2",
  inputGroupFull: "space-y-2 md:col-span-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed",
  selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer",
  pickerInput: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed pl-10 [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden",
  textarea: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[100px] resize-none",
  button: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer flex items-center justify-center gap-2",
  buttonDisabled: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-not-allowed flex items-center justify-center gap-2 opacity-70",
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-red-500/10 text-red-400 border border-red-500/20",
  statusWarning: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-amber-500/10 text-amber-400 border border-amber-500/20",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  relativeInputContainer: "relative flex items-center",
  pickerIcon: "absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base"
};

export default function OrdenesGarantiaForm({ zonasReparto = [], productos = [] }: OrdenesGarantiaFormProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  
  // Estados para inputs de selección
  const [selectedZona, setSelectedZona] = useState("");
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedProductoDesc, setSelectedProductoDesc] = useState("");

  const [selectedFilesCount, setSelectedFilesCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const lastPickerOpen = useRef(0);

  // Estados adicionales para la fecha en móviles
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    }
  }, []);

  // Obtener zonas únicas de las zonas de reparto
  const zonasUnicas = useMemo(() => {
    const set = new Set<string>();
    (zonasReparto || []).forEach((z) => {
      if (z.nombre_zona && z.nombre_zona.trim() !== "") {
        set.add(z.nombre_zona.trim());
      }
    });
    return Array.from(set).sort();
  }, [zonasReparto]);

  // Marcas únicas del catálogo de productos
  const marcasUnicas = useMemo(() => {
    const set = new Set<string>();
    (productos || []).forEach((p) => {
      if (p.marca && p.marca.trim() !== "") {
        set.add(p.marca.trim());
      }
    });
    return Array.from(set).sort();
  }, [productos]);

  // Filtrar los productos por la marca seleccionada y ordenarlos por modelo, color y almacenamiento
  const productosFiltrados = useMemo(() => {
    if (!selectedMarca) return [];
    return (productos || [])
      .filter((p) => p.marca === selectedMarca)
      .sort((a, b) => {
        // Ordenar por modelo
        const compModelo = a.modelo.localeCompare(b.modelo, undefined, { numeric: true, sensitivity: 'base' });
        if (compModelo !== 0) return compModelo;
        
        // Si el modelo es el mismo, ordenar por color
        const compColor = a.color.localeCompare(b.color, undefined, { sensitivity: 'base' });
        if (compColor !== 0) return compColor;
        
        // Si el color también es el mismo, ordenar por almacenamiento
        return a.almacenamiento.localeCompare(b.almacenamiento, undefined, { numeric: true });
      });
  }, [selectedMarca, productos]);

  // Abre el picker de fechas de manera compatible
  const handleOpenPicker = (event: React.MouseEvent<HTMLInputElement>) => {
    const now = Date.now();
    if (now - lastPickerOpen.current < 500) return;

    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        lastPickerOpen.current = now;
        (event.currentTarget as any).showPicker();
      } catch (err) {
        lastPickerOpen.current = 0;
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setSelectedFilesCount(files ? files.length : 0);
  };

  // Envío del formulario
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);

    // Adjuntar campos de marca y modelo del selector
    formData.set("marca", selectedMarca);
    formData.set("modelo", selectedProductoDesc);

    try {
      const result = await submitOrdenGarantia(formData);

      if (result.success) {
        if (result.warning) {
          setStatus({ type: 'warning', message: `¡Garantía Folio ${result.folio} registrada! Advertencia Discord: ${result.warning}` });
        } else {
          setStatus({ type: 'success', message: `¡Orden de Garantía ${result.folio} registrada y enviada a Discord!` });
        }
        formRef.current?.reset();
        setSelectedZona("");
        setSelectedMarca("");
        setSelectedProductoDesc("");
        setFechaEntrega("");
        setSelectedFilesCount(0);
      } else {
        setStatus({ type: 'error', message: result.error || 'Error al guardar la orden.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: "Error crítico al registrar la garantía." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className={styles.formCard}>
        <div className="flex items-center justify-center py-12 text-slate-400">
          <span className="animate-spin material-symbols-outlined text-3xl">progress_activity</span>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className={styles.formCard} onSubmit={handleSubmit}>
      {status && (
        <div className={
          status.type === 'success' 
            ? styles.statusSuccess 
            : status.type === 'warning' 
              ? styles.statusWarning 
              : styles.statusError
        }>
          <span className="material-symbols-outlined">
            {status.type === 'success' ? 'check_circle' : status.type === 'warning' ? 'warning' : 'error'}
          </span>
          {status.message}
        </div>
      )}

      {/* SECCIÓN 1: INFORMACIÓN DEL CLIENTE */}
      <div>
        <h3 className={styles.sectionTitle}>Información del Cliente</h3>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre del cliente</label>
            <input 
              type="text" 
              name="nombre_cliente" 
              className={styles.input} 
              required 
              placeholder="Nombre completo" 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Número de contacto</label>
            <input 
              type="tel" 
              name="telefono" 
              className={styles.input} 
              required 
              placeholder="Ej: 5212345678900" 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Zona de recepción</label>
            <div className="relative">
              <select
                name="zona"
                value={selectedZona}
                onChange={(e) => setSelectedZona(e.target.value)}
                className={styles.selectInput}
                style={{ colorScheme: 'dark' }}
                required
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione una zona...</option>
                {zonasUnicas.map((zona) => (
                  <option key={zona} value={zona} className="bg-slate-950 text-white">
                    {zona}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Ubicación</label>
            <input 
              type="text" 
              name="ubicacion" 
              className={styles.input} 
              required 
              placeholder="Enlace de Google Maps" 
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: INFORMACIÓN DEL EQUIPO (CATÁLOGO DETALLADO) */}
      <div>
        <h3 className={styles.sectionTitle}>Información del Equipo</h3>
        <div className={styles.formGrid}>
          {/* MARCA */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Marca</label>
            <div className="relative">
              <select
                value={selectedMarca}
                onChange={(e) => {
                  setSelectedMarca(e.target.value);
                  setSelectedProductoDesc("");
                }}
                className={styles.selectInput}
                style={{ colorScheme: 'dark' }}
                required
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione una marca...</option>
                {marcasUnicas.map((marca) => (
                  <option key={marca} value={marca} className="bg-slate-950 text-white">
                    {marca}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          {/* SELECCIONAR PRODUCTO (DETALLADO CON GBS Y COLOR) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Modelo</label>
            <div className="relative">
              <select
                value={selectedProductoDesc}
                onChange={(e) => setSelectedProductoDesc(e.target.value)}
                className={styles.selectInput}
                style={{ colorScheme: 'dark' }}
                required
                disabled={!selectedMarca}
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  {!selectedMarca ? "Primero elija una marca..." : "Elegir modelo..."}
                </option>
                {productosFiltrados.map((p) => {
                  const labelCompleto = `${p.modelo} - ${p.color} (${p.almacenamiento} / ${p.ram})`;
                  return (
                    <option key={p.id} value={labelCompleto} className="bg-slate-950 text-white">
                      {labelCompleto}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          {/* IMEI (MANUAL) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>IMEI</label>
            <input 
              type="text" 
              name="imei" 
              inputMode="numeric"
              pattern="[0-9]*"
              className={styles.input} 
              required 
              placeholder="Número de IMEI (15 dígitos)" 
            />
          </div>

          {/* TAG (MANUAL) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Tag</label>
            <input 
              type="text" 
              name="tag" 
              className={styles.input} 
              placeholder="Tag de Payjoy" 
              required
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: INFORMACIÓN DE LA COMPRA */}
      <div>
        <h3 className={styles.sectionTitle}>Información de la Compra</h3>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Fecha de entrega</label>
            <div className={styles.relativeInputContainer}>
              <span className={styles.pickerIcon}>calendar_today</span>
              <input 
                type="date" 
                name="fecha_entrega" 
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className={styles.pickerInput} 
                style={{ paddingLeft: "42px", color: "#f8fafc" }}
                onClick={handleOpenPicker}
                required
              />
              {!fechaEntrega && isIOS && (
                <span
                  className="absolute text-slate-500 text-sm pointer-events-none select-none"
                  style={{ left: "42px" }}
                >
                  dd/mm/aaaa
                </span>
              )}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Costo del equipo</label>
            <div className={styles.relativeInputContainer}>
              <span className="absolute left-4 text-slate-400 pointer-events-none">$</span>
              <input 
                type="number" 
                name="costo_equipo" 
                step="0.01" 
                min="0"
                inputMode="decimal"
                className={styles.input} 
                style={{ paddingLeft: "28px" }}
                placeholder="0.00" 
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Enganche registrado en sistema</label>
            <div className={styles.relativeInputContainer}>
              <span className="absolute left-4 text-slate-400 pointer-events-none">$</span>
              <input 
                type="number" 
                name="enganche_registrado" 
                step="0.01" 
                min="0"
                inputMode="decimal"
                className={styles.input} 
                style={{ paddingLeft: "28px" }}
                placeholder="0.00" 
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Enganche recibido</label>
            <div className={styles.relativeInputContainer}>
              <span className="absolute left-4 text-slate-400 pointer-events-none">$</span>
              <input 
                type="number" 
                name="enganche_recibido" 
                step="0.01" 
                min="0"
                inputMode="decimal"
                className={styles.input} 
                style={{ paddingLeft: "28px" }}
                placeholder="0.00" 
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: INFORMACIÓN DE LA GARANTÍA */}
      <div>
        <h3 className={styles.sectionTitle}>Información de la Garantía</h3>
        <div className={styles.formGrid}>
          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Motivo de la garantía</label>
            <input 
              type="text" 
              name="motivo_garantia" 
              className={styles.input} 
              required 
              placeholder="Ej: Falla en pantalla, reinicios constantes" 
            />
          </div>

          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Descripción de la falla</label>
            <textarea 
              name="descripcion_falla" 
              className={styles.textarea} 
              required 
              placeholder="Describa el comportamiento de la falla observada por el cliente..." 
            />
          </div>

          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Accesorios entregados</label>
            <input 
              type="text" 
              name="accesorios_entregados" 
              className={styles.input} 
              placeholder="Ej: Caja, cargador original, cable USB, funda, mica" 
              required
            />
          </div>

          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Estado físico del equipo al recibir</label>
            <input 
              type="text" 
              name="estado_fisico" 
              className={styles.input} 
              placeholder="Ej: Rayado en tapa trasera, golpe leve en esquina inferior derecha, sin rayaduras" 
              required
            />
          </div>

          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Observaciones adicionales</label>
            <textarea 
              name="observaciones" 
              className={styles.textarea} 
              placeholder="Notas u observaciones internas..." 
              required
            />
          </div>

          {/* Carga de Fotos */}
          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Fotos del equipo y fallo</label>
            <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-secondary/40 rounded-xl p-4 bg-slate-950/20 transition-all group cursor-pointer min-h-[50px] z-0 select-none">
              <input
                type="file"
                name="fotos"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                required
              />
              <div className="flex items-center gap-3 text-slate-400 group-hover:text-secondary transition-all">
                <span className="material-symbols-outlined text-xl">upload_file</span>
                <span className="text-sm font-semibold">
                  {selectedFilesCount > 0 
                    ? `¡${selectedFilesCount} foto${selectedFilesCount > 1 ? "s" : ""} seleccionada${selectedFilesCount > 1 ? "s" : ""}!` 
                    : "Haz clic para subir fotos"
                  }
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-1">Puedes seleccionar múltiples archivos de imagen. Estas fotos se enviarán directamente a Discord.</p>
          </div>
        </div>
      </div>

      {/* Botón de Envío */}
      <button 
        type="submit" 
        disabled={isSubmitting} 
        className={isSubmitting ? styles.buttonDisabled : styles.button}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin material-symbols-outlined">progress_activity</span>
            Registrando orden...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">assignment_turned_in</span>
            Registrar Orden de Garantía
          </>
        )}
      </button>
    </form>
  );
}
