'use client';

// 1. React & Next.js Core
import React, { useState, useRef, useMemo, useEffect } from "react";

// 2. Server Actions & Services
import { submitOrdenEntrega } from "@/app/empresa/webapp/ordenes-entrega/actions";

interface Producto {
  id: string;
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  color: string;
}

interface ProductoConStock extends Producto {
  cantidadStock: number;
}

interface RepartoZonaInfo {
  id: string;
  nombre_zona: string;
  repartidor_id: string;
  repartidor_nombre: string;
  repartidor_activo: boolean;
  repartidor_zona_horaria?: string;
}

interface StockItem {
  producto_id: string;
  estado: string;
  zona: string | null;
  imei?: string;
}

interface CostoItem {
  producto_id: string;
  costo: number | string;
}

interface ConfigEngancheItem {
  cliente_historial: string;
  porcentajes: number[];
}

interface RepartoExistente {
  id?: string;
  repartidor_id?: string | null;
  fecha_reparto?: string | null;
  horario?: string | null;
}

interface OrdenesEntregaFormProps {
  productos: Producto[];
  zonasReparto: RepartoZonaInfo[];
  stockItems: StockItem[];
  costos: CostoItem[];
  configEnganches: ConfigEngancheItem[];
  repartosExistentes?: RepartoExistente[];
}

const styles = {
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-6",
  inputGroup: "space-y-2",
  inputGroupFull: "space-y-2 md:col-span-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed",
  selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer",
  engancheInput: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
  pickerInput: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed pl-10 [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden",
  textarea: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[100px] resize-none",
  button: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer flex items-center justify-center gap-2",
  buttonDisabled: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-not-allowed flex items-center justify-center gap-2 opacity-70",
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-red-500/10 text-red-400 border border-red-500/20",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  relativeInputContainer: "relative flex items-center",
  enganchePrefix: "absolute left-4 text-slate-400 pointer-events-none",
  pickerIcon: "absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base",
  warningBanner: "md:col-span-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 p-4 rounded-xl text-sm font-medium flex flex-col lg:flex-row items-center justify-between gap-3 text-center"
};

export default function OrdenesEntregaForm({ 
  productos, 
  zonasReparto, 
  stockItems, 
  costos, 
  configEnganches,
  repartosExistentes = []
}: OrdenesEntregaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedZona, setSelectedZona] = useState<string>("");
  const [selectedRepartidorId, setSelectedRepartidorId] = useState<string>("");
  const [selectedImei, setSelectedImei] = useState<string>("");
  
  const [isIOS, setIsIOS] = useState(false);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [horaEntrega, setHoraEntrega] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [clienteHistorial, setClienteHistorial] = useState("");
  const [engancheValue, setEngancheValue] = useState("");

  // 1.1. Obtener el costo del IMEI seleccionado
  const selectedProductCost = useMemo(() => {
    if (!selectedImei) return 0;
    const stockItem = stockItems.find((s) => s.imei === selectedImei);
    if (!stockItem) return 0;
    const costoRecord = costos.find((c) => c.producto_id === stockItem.producto_id);
    return costoRecord ? Number(costoRecord.costo) : 0;
  }, [selectedImei, stockItems, costos]);

  // 1.2. Obtener los porcentajes de enganche habilitados según el historial
  const enganchePorcentajes = useMemo(() => {
    if (!clienteHistorial) return [];
    const config = configEnganches.find(
      (c) => c.cliente_historial.toLowerCase() === clienteHistorial.toLowerCase()
    );
    return config ? config.porcentajes : [];
  }, [clienteHistorial, configEnganches]);

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      const isIOSDevice = /iPhone|iPad|iPod/.test(ua);
      setIsIOS(isIOSDevice);
    }
  }, []);

  const formRef = useRef<HTMLFormElement>(null);
  const lastPickerOpen = useRef(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName("");
    }
  };

  /** 1. Filtra los items de stock físico asignados al repartidor seleccionado */
  const stockFiltrado = useMemo(() => {
    if (!selectedRepartidorId) return [];
    return stockItems.filter(stockItem => stockItem.zona === selectedRepartidorId);
  }, [selectedRepartidorId, stockItems]);

  /** 2. Mapea los productos del catálogo calculando existencias 'Disponible' y 'A consultar' */
  const productosConStock = useMemo(() => {
    if (!selectedRepartidorId) return [];
    
    // Obtenemos los IDs de productos del catálogo que tienen stock físico con el repartidor
    const idsConStock = new Set(stockFiltrado.map(stockItem => stockItem.producto_id));

    return productos
      .filter(producto => idsConStock.has(producto.id))
      .map(producto => {
        const unidadesValidas = stockFiltrado.filter(stockItem => stockItem.producto_id === producto.id);
        const cantidadDisponible = unidadesValidas.filter(stockItem => stockItem.estado === 'Disponible').length;
        const cantidadAConsultar = unidadesValidas.filter(stockItem => stockItem.estado === 'A consultar').length;
        
        return {
          ...producto,
          cantidadDisponible,
          cantidadAConsultar,
          cantidadStock: cantidadDisponible + cantidadAConsultar
        };
      })
      .filter(producto => producto.cantidadStock > 0); // Nos aseguramos de que solo pasen productos con stock positivo
  }, [selectedRepartidorId, productos, stockFiltrado]);

  /** 3. Agrupa modelos y variantes únicas a partir de los productos con existencia física */
  const modelosUnicos = useMemo(() => {
    const map = new Map();
    productosConStock.forEach(producto => {
      // Formato: MARCA MODELO - 256GB - 8GB
      const display = `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}`;
      const existing = map.get(display);
      
      if (!existing) {
        map.set(display, {
          display: display,
          marca: producto.marca,
          modelo: producto.modelo,
          totalDisponible: producto.cantidadDisponible,
          totalAConsultar: producto.cantidadAConsultar,
          totalStock: producto.cantidadStock
        });
      } else {
        existing.totalDisponible += producto.cantidadDisponible;
        existing.totalAConsultar += producto.cantidadAConsultar;
        existing.totalStock += producto.cantidadStock;
      }
    });
    return Array.from(map.entries());
  }, [productosConStock]);

  // 4. Colores disponibles para el modelo seleccionado de los productos con stock
  const variantesColor = useMemo(() => {
    if (!selectedModelKey) return [];
    return productosConStock
      .filter(producto => `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}` === selectedModelKey)
      .map(producto => ({
        color: producto.color,
        cantidadDisponible: producto.cantidadDisponible,
        cantidadAConsultar: producto.cantidadAConsultar,
        hasStock: producto.cantidadDisponible > 0
      }));
  }, [selectedModelKey, productosConStock]);

  /** 4.5. Filtra los IMEIs disponibles en stock físico para el modelo y color seleccionados */
  const imeisDisponibles = useMemo(() => {
    if (!selectedModelKey || !selectedColor) return [];
    const matchingProducts = productosConStock.filter(
      producto => `${producto.marca} ${producto.modelo} - ${producto.almacenamiento} - ${producto.ram}` === selectedModelKey && producto.color === selectedColor
    );
    const matchingProductIds = new Set(matchingProducts.map(producto => producto.id));
    return stockFiltrado.filter(
      stockItem => matchingProductIds.has(stockItem.producto_id) && stockItem.estado === 'Disponible' && stockItem.imei
    );
  }, [selectedModelKey, selectedColor, productosConStock, stockFiltrado]);

  // 5. Zonas únicas configuradas
  const zonasUnicas = useMemo(() => {
    const set = new Set<string>();
    (zonasReparto || []).forEach(zonaInfo => {
      if (zonaInfo.nombre_zona) {
        set.add(zonaInfo.nombre_zona);
      }
    });
    return Array.from(set).sort();
  }, [zonasReparto]);

  // 6. Repartidores válidos según la zona seleccionada (excluyendo cambaceadores y almacenamiento)
  const repartidoresValidos = useMemo(() => {
    if (!selectedZona) return [];
    const map = new Map<string, string>();
    (zonasReparto || [])
      .filter(zonaInfo => {
        if (zonaInfo.nombre_zona !== selectedZona || !zonaInfo.repartidor_nombre) return false;
        const norm = zonaInfo.repartidor_nombre
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return !norm.includes("cambaceo") && !norm.includes("almacen");
      })
      .forEach(zonaInfo => {
        map.set(zonaInfo.repartidor_id, zonaInfo.repartidor_nombre);
      });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [selectedZona, zonasReparto]);

  const activeZoneInfo = useMemo(() => {
    if (!selectedZona) return null;
    if (selectedRepartidorId) {
      const match = (zonasReparto || []).find(z => z.repartidor_id === selectedRepartidorId && z.nombre_zona === selectedZona);
      if (match) return match;
    }
    return (zonasReparto || []).find(z => {
      if (z.nombre_zona !== selectedZona || !z.repartidor_nombre) return false;
      const norm = z.repartidor_nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return !norm.includes("cambaceo") && !norm.includes("almacen");
    }) || null;
  }, [selectedZona, selectedRepartidorId, zonasReparto]);

  const selectedRepartidorName = useMemo(() => {
    if (!selectedRepartidorId) return "";
    return activeZoneInfo?.repartidor_nombre || repartidoresValidos.find(repartidor => repartidor.id === selectedRepartidorId)?.nombre || "";
  }, [selectedRepartidorId, repartidoresValidos, activeZoneInfo]);

  const isRepartidorCT = useMemo(() => {
    return selectedRepartidorName.toLowerCase() === "repartidor ct";
  }, [selectedRepartidorName]);

  const selectedTimeZone = useMemo(() => {
    if (activeZoneInfo?.repartidor_zona_horaria) {
      return activeZoneInfo.repartidor_zona_horaria;
    }
    if (selectedZona.toLowerCase().includes("tijuana")) return "America/Tijuana";
    return "America/Mexico_City";
  }, [activeZoneInfo, selectedZona]);

  const selectedZoneDisplayName = useMemo(() => {
    if (isRepartidorCT) return "Tijuana";
    return selectedZona || "Tijuana";
  }, [isRepartidorCT, selectedZona]);

  const zoneTime = useMemo(() => {
    if (!isMounted) return { dateStr: "", hour: 0, minute: 0, timeStrFull: "" };
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: selectedTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });

      const parts = formatter.formatToParts(new Date());
      const getVal = (type: string) => parts.find((p) => p.type === type)?.value || "";

      const year = getVal("year");
      const month = getVal("month");
      const day = getVal("day");
      const hourStr = getVal("hour");
      const minuteStr = getVal("minute");

      const dateStr = `${year}-${month}-${day}`;
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const timeStrFull = `${hourStr}:${minuteStr}`;

      return { dateStr, hour, minute, timeStrFull };
    } catch (e) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      return {
        dateStr: now.toISOString().split("T")[0],
        hour: now.getHours(),
        minute: now.getMinutes(),
        timeStrFull: `${pad(now.getHours())}:${pad(now.getMinutes())}`
      };
    }
  }, [isMounted, selectedTimeZone]);

  const horasDisponibles = useMemo(() => {
    const hoursRange = isRepartidorCT
      ? [10, 11, 12, 13, 14, 15, 16, 17]
      : [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    if (!fechaEntrega) return [];
    if (fechaEntrega < zoneTime.dateStr) {
      return [];
    }
    if (fechaEntrega === zoneTime.dateStr) {
      const minHour = zoneTime.minute > 0 ? zoneTime.hour + 3 : zoneTime.hour + 2;
      return hoursRange.filter((h) => h >= minHour);
    }
    return hoursRange;
  }, [fechaEntrega, zoneTime, isRepartidorCT]);

  const horariosOcupados = useMemo(() => {
    if (!selectedRepartidorId || !fechaEntrega || !repartosExistentes || !repartosExistentes.length) {
      return new Set<number>();
    }
    const occupied = new Set<number>();
    repartosExistentes.forEach((reparto) => {
      if (reparto.repartidor_id === selectedRepartidorId && reparto.fecha_reparto === fechaEntrega && reparto.horario) {
        const match = reparto.horario.match(/^(\d+)/);
        if (match) {
          occupied.add(parseInt(match[1], 10));
        }
      }
    });
    return occupied;
  }, [selectedRepartidorId, fechaEntrega, repartosExistentes]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModelKey(event.target.value);
    setSelectedColor("");
    setSelectedImei("");
  };

  const handleZonaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedZona(event.target.value);
    setSelectedRepartidorId("");
    setSelectedModelKey("");
    setSelectedColor("");
    setSelectedImei("");
    setHoraEntrega("");
  };

  const handleRepartidorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRepartidorId(event.target.value);
    setSelectedModelKey("");
    setSelectedColor("");
    setSelectedImei("");
    setHoraEntrega("");
  };

  const handleOpenPicker = (event: React.MouseEvent<HTMLInputElement>) => {
    const now = Date.now();
    if (now - lastPickerOpen.current < 500) return;

    const inputElement = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
    if (typeof inputElement.showPicker === 'function') {
      try {
        lastPickerOpen.current = now;
        inputElement.showPicker();
      } catch {
        lastPickerOpen.current = 0;
      }
    }
  };

  /**
   * Procesa el envío del formulario de Orden de Entrega.
   * Compila los datos seleccionados, invoca la Server Action submitOrdenEntrega
   * y gestiona el reseteo de estados e indicadores de notificación.
   * 
   * @param event Evento de submit del formulario HTML
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const baseInfo = modelosUnicos.find(([key]) => key === selectedModelKey)?.[1];
    
    if (baseInfo) {
      formData.set("celular", `${baseInfo.marca} ${baseInfo.modelo}`);
    }
    formData.set("color_celular", selectedColor);

    // Enviar formulario a la Server Action
    const result = await submitOrdenEntrega(formData);

    if (result.success) {
      setStatus({ type: 'success', message: `¡Orden de Entrega ${result.folio || ''} registrada y enviada a Discord!` });
      // Resetear campos del formulario y estados de selección
      formRef.current?.reset();
      setSelectedFileName("");
      setSelectedModelKey("");
      setSelectedColor("");
      setSelectedZona("");
      setSelectedRepartidorId("");
      setSelectedImei("");
      setFechaEntrega("");
      setHoraEntrega("");
      setClienteHistorial("");
      setEngancheValue("");
    } else {
      setStatus({ type: 'error', message: result.error || 'Error al procesar la orden.' });
    }
    setIsSubmitting(false);
  };

  return (
    <form ref={formRef} className={styles.formCard} onSubmit={handleSubmit} suppressHydrationWarning>
      {status && (
        <div className={status.type === 'success' ? styles.statusSuccess : styles.statusError}>
          <span className="material-symbols-outlined">
            {status.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {status.message}
        </div>
      )}

      <div className={styles.formGrid}>
        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Nombre de cliente</label>
          <input type="text" name="nombre_cliente" className={styles.input} required placeholder="Nombre completo" suppressHydrationWarning />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>¿Cuenta con Identificación?</label>
          <select
            name="identificacion_fisica"
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            suppressHydrationWarning
          >
            <option value="Si" className="bg-slate-950 text-white">Sí cuenta con INE/Residencia</option>
            <option value="No" className="bg-slate-950 text-white">No cuenta con INE/Residencia</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>CURP</label>
          <input
            type="text"
            name="curp"
            className={styles.input}
            required
            placeholder="Ingrese los 18 caracteres de la CURP"
            suppressHydrationWarning
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Número de teléfono</label>
          <input type="tel" name="telefono" className={styles.input} required placeholder="Ej: 5212345678900" suppressHydrationWarning />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Dirección</label>
          <input type="text" name="direccion" className={styles.input} required placeholder="Enlace Google Maps" suppressHydrationWarning />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>¿Cuenta activa?</label>
          <select
            name="cuenta_activa"
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            defaultValue="si"
            suppressHydrationWarning
          >
            <option value="si" className="bg-slate-950 text-white">Sí</option>
            <option value="no" className="bg-slate-950 text-white">No</option>
          </select>
        </div>

        {/* SELECTOR DE ZONA */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Zona de reparto</label>
          <select
            name="zona"
            value={selectedZona}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            onChange={handleZonaChange}
            suppressHydrationWarning
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione una zona...</option>
            {zonasUnicas.map((zona) => (
              <option key={zona} value={zona} className="bg-slate-950 text-white">
                {zona}
              </option>
            ))}
          </select>
        </div>

        {/* SELECTOR DE REPARTIDOR */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Repartidor</label>
          <select
            name="repartidor_id"
            value={selectedRepartidorId}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedZona}
            onChange={handleRepartidorChange}
            suppressHydrationWarning
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedZona ? "Primero elija una zona" : "Seleccione un repartidor..."}
            </option>
            {repartidoresValidos.map((rep) => (
              <option key={rep.id} value={rep.id} className="bg-slate-950 text-white">
                {rep.nombre}
              </option>
            ))}
          </select>
          <input 
            type="hidden" 
            name="repartidor" 
            value={repartidoresValidos.find(repartidor => repartidor.id === selectedRepartidorId)?.nombre || ""} 
            suppressHydrationWarning
          />
        </div>

        {/* ESPECIFICAR LOCAL (Solo si se selecciona "Local CT") */}
        {selectedRepartidorName === "Local CT" && (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Especificar local</label>
            <select
              name="especificar_local"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              suppressHydrationWarning
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione un local...</option>
              <option value="Península" className="bg-slate-950 text-white">Península</option>
              <option value="Landmark" className="bg-slate-950 text-white">Landmark</option>
              <option value="Río" className="bg-slate-950 text-white">Río</option>
              <option value="Tecnología" className="bg-slate-950 text-white">Tecnología</option>
              <option value="Brisas" className="bg-slate-950 text-white">Brisas</option>
              <option value="Carpas carrusel" className="bg-slate-950 text-white">Carpas carrusel</option>
              <option value="Plaza carrusel" className="bg-slate-950 text-white">Plaza carrusel</option>
            </select>
          </div>
        )}

        {/* SELECTOR DE MODELO CON NUEVO FORMATO */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Modelo de Celular</label>
          <select
            value={selectedModelKey}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedRepartidorId}
            onChange={handleModelChange}
            suppressHydrationWarning
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedRepartidorId ? "Primero elija un repartidor..." : "Seleccione un modelo..."}
            </option>
            {modelosUnicos.map(([key, info]) => {
              const isAConsultar = info.totalDisponible === 0 && info.totalAConsultar > 0;
              return (
                <option 
                  key={key} 
                  value={key} 
                  className={isAConsultar ? "text-slate-500 bg-slate-950 italic" : "text-white bg-slate-950"}
                  disabled={isAConsultar}
                >
                  {isAConsultar 
                    ? `${info.display} (A consultar)` 
                    : `${info.display} (${info.totalDisponible} disponible${info.totalDisponible > 1 ? "s" : ""})`
                  }
                </option>
              );
            })}
          </select>
        </div>

        {/* SELECTOR DE COLOR */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Color disponible</label>
          <select
            name="color_celular_select"
            value={selectedColor}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedModelKey}
            onChange={(e) => {
              setSelectedColor(e.target.value);
              setSelectedImei("");
            }}
            suppressHydrationWarning
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedModelKey ? "Primero elija un modelo" : "Seleccione un color..."}
            </option>
            {variantesColor.map((v) => {
              const isAConsultar = v.cantidadDisponible === 0 && v.cantidadAConsultar > 0;
              return (
                <option 
                  key={v.color} 
                  value={v.color} 
                  className={isAConsultar ? "text-slate-500 bg-slate-950 italic" : "text-white bg-slate-950"}
                  disabled={isAConsultar}
                >
                  {isAConsultar ? `${v.color} (A consultar)` : v.color}
                </option>
              );
            })}
          </select>
          <input type="hidden" name="celular" value={selectedModelKey} suppressHydrationWarning />
          <input type="hidden" name="color_celular" value={selectedColor} suppressHydrationWarning />
        </div>

        {/* SELECTOR DE IMEI */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>IMEI</label>
          <select
            name="imei"
            value={selectedImei}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedColor}
            onChange={(e) => {
              setSelectedImei(e.target.value);
              setEngancheValue(""); // Reset down payment on IMEI change
            }}
            suppressHydrationWarning
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedColor ? "Primero elija un color" : "Seleccione un IMEI..."}
            </option>
            {imeisDisponibles.map((item) => (
              <option key={item.imei} value={item.imei} className="bg-slate-950 text-white">
                {item.imei}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>¿Cliente con historial?</label>
          <select
            name="cliente_historial"
            value={clienteHistorial}
            className={styles.selectInput}
            style={{ colorScheme: 'dark' }}
            required
            disabled={!selectedImei}
            onChange={(e) => {
              setClienteHistorial(e.target.value);
              setEngancheValue(""); // Reset enganche if history changes
            }}
            suppressHydrationWarning
          >
            <option value="" className="bg-slate-950 text-slate-500 italic">
              {!selectedImei ? "Primero elija un IMEI..." : "Seleccione..."}
            </option>
            <option value="Si" className="bg-slate-950 text-white">Sí</option>
            <option value="No" className="bg-slate-950 text-white">No</option>
          </select>
        </div>

        {selectedProductCost > 0 ? (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Enganche</label>
            <select
              name="enganche"
              value={engancheValue}
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              disabled={!clienteHistorial}
              onChange={(e) => setEngancheValue(e.target.value)}
              suppressHydrationWarning
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">
                {!clienteHistorial ? "Primero elija historial" : "Seleccione..."}
              </option>
              {enganchePorcentajes.map((p) => {
                const valorCalculado = (selectedProductCost * (p / 100)).toFixed(2);
                return (
                  <option key={p} value={valorCalculado} className="bg-slate-950 text-white">
                    ${valorCalculado} ({p}%)
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Enganche</label>
            <div className={styles.relativeInputContainer}>
              <span className={styles.enganchePrefix}>$</span>
              <input
                type="number"
                name="enganche"
                value={engancheValue}
                onChange={(e) => setEngancheValue(e.target.value)}
                className={styles.engancheInput}
                required
                min="0"
                placeholder={!clienteHistorial ? "Primero elija historial" : "0.00"}
                disabled={!clienteHistorial}
                suppressHydrationWarning
              />
            </div>
          </div>
        )}

        <div className={styles.inputGroup}>
          <label className={styles.label}>Fecha de entrega</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.pickerIcon}>calendar_today</span>
            <input
              type="date"
              name="fecha_entrega"
              value={fechaEntrega}
              onChange={(e) => {
                setFechaEntrega(e.target.value);
                setHoraEntrega("");
              }}
              className={styles.pickerInput}
              style={{ paddingLeft: "40px" }}
              required
              onClick={handleOpenPicker}
              suppressHydrationWarning
            />
            {!fechaEntrega && isIOS && (
              <span
                className="absolute text-slate-500 text-base pointer-events-none select-none"
                style={{ left: "40px" }}
              >
                dd/mm/aaaa
              </span>
            )}
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Hora de entrega</label>
          <div className={styles.relativeInputContainer}>
            <span className={styles.pickerIcon}>schedule</span>
            <select
              name="hora_entrega"
              value={horaEntrega}
              onChange={(e) => setHoraEntrega(e.target.value)}
              className={styles.selectInput}
              style={{ paddingLeft: "40px", colorScheme: 'dark' }}
              required
              disabled={!fechaEntrega}
              suppressHydrationWarning
            >
              {!fechaEntrega ? (
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  Seleccione una fecha primero
                </option>
              ) : horasDisponibles.length === 0 ? (
                <option value="" className="bg-slate-950 text-red-400 italic">
                  {fechaEntrega < zoneTime.dateStr
                    ? "La fecha no puede ser en el pasado"
                    : "No hay horarios disponibles para hoy"}
                </option>
              ) : (
                <>
                  <option value="" className="bg-slate-950 text-slate-500 italic">
                    Seleccione una hora...
                  </option>
                  {horasDisponibles.map((h) => {
                    const formattedHour = `${h.toString().padStart(2, "0")}:00`;
                    const isOccupied = horariosOcupados.has(h);
                    return (
                      <option 
                        key={h} 
                        value={formattedHour} 
                        disabled={isOccupied}
                        className={isOccupied ? "text-slate-500 bg-slate-950 italic" : "text-white bg-slate-950"}
                      >
                        {h}hs {isOccupied ? "(Ocupado)" : ""}
                      </option>
                    );
                  })}
                </>
              )}
            </select>
          </div>
        </div>

        {isMounted && selectedZona && (
          <div className={styles.warningBanner}>
            <span className="material-symbols-outlined text-amber-400 select-none">warning</span>
            <div className="flex-1">
              {isRepartidorCT ? (
                <div>Los horarios de entrega son aproximados con repartos de CT y son solicitados con 2hs de anticipación.</div>
              ) : (
                <div>Los horarios de entrega son solicitados con 2hs de anticipación.</div>
              )}
              <div className="font-semibold text-amber-300 mt-1">
                Hora actual {selectedZoneDisplayName}: {zoneTime.timeStrFull || "--:--"} hs
              </div>
            </div>
            <span className="hidden lg:block">
              <span className="material-symbols-outlined text-amber-400 select-none">warning</span>
            </span>
          </div>
        )}

        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Verificación crediticia</label>
          <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-secondary/40 rounded-xl p-3 bg-slate-950/20 transition-all group cursor-pointer h-[46px] select-none">
            <input
              type="file"
              name="verificacion_crediticia"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              required
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              suppressHydrationWarning
            />
            <div className="flex items-center gap-2 text-center max-w-full px-2">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-secondary text-xl transition-colors shrink-0">
                cloud_upload
              </span>
              <p
                className="text-xs text-slate-300 font-medium truncate max-w-[150px] sm:max-w-[220px] md:max-w-[160px] lg:max-w-[240px]"
                title={selectedFileName || "Subir Imagen o PDF"}
              >
                {selectedFileName ? selectedFileName : "Subir Imagen o PDF"}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Comentarios (Opcional)</label>
          <textarea
            name="comentarios"
            className={styles.textarea}
            placeholder="Notas adicionales sobre la orden o entrega..."
            suppressHydrationWarning
          />
        </div>
      </div>

      <button
        type="submit"
        className={isSubmitting ? styles.buttonDisabled : styles.button}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full" />
            Procesando...
          </>
        ) : (
          'Registrar Orden de Entrega'
        )}
      </button>
    </form>
  );
}