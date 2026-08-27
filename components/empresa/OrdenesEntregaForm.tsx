'use client';

// 1. React y Next.js
import React, { useState, useRef, useMemo, useEffect } from "react";

// 2. Componentes internos
import { FormDatosCliente } from "./ordenes-entrega/FormDatosCliente";
import { FormSeleccionEquipo } from "./ordenes-entrega/FormSeleccionEquipo";
import { FormProgramacionEntrega } from "./ordenes-entrega/FormProgramacionEntrega";

// 3. Acciones y Utilidades
import { submitOrdenEntrega } from "@/app/empresa/webapp/ordenes-entrega/actions";
import { getDriverRestDayInfo, getDriverScheduleConfig } from "@/utils/driver-schedule";
import { PORCENTAJE_EXTRA_SOBRE_COSTO, getPlazaCostoPrincipal } from "@/config/cotizaciones";

// 4. Tipos
import type {
  Producto,
  RepartoZonaInfo,
  StockItem,
  CostoItem,
  ConfigEngancheItem,
  RepartoExistente
} from "@/types/ordenes-entrega";

export type { Producto, RepartoZonaInfo, StockItem, CostoItem, ConfigEngancheItem, RepartoExistente };

interface OrdenesEntregaFormProps {
  productos: Producto[];
  zonasReparto: RepartoZonaInfo[];
  stockItems: StockItem[];
  costos: CostoItem[];
  configEnganches: ConfigEngancheItem[];
  repartosExistentes?: RepartoExistente[];
  currentUserId?: string | null;
}

const styles = {
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-8",
  button: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer flex items-center justify-center gap-2",
  buttonDisabled: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-not-allowed flex items-center justify-center gap-2 opacity-70",
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-peek bg-red-500/10 text-red-400 border border-red-500/20",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
};

/**
 * Obtiene la fecha, hora y formato de tiempo formateado para una zona horaria dada.
 */
function getZoneTimeInfo(selectedTimeZone: string, isMounted: boolean) {
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
    const getVal = (type: string) => parts.find((part) => part.type === type)?.value || "";

    const year = getVal("year");
    const month = getVal("month");
    const day = getVal("day");
    const hourStr = getVal("hour");
    const minuteStr = getVal("minute");

    return {
      dateStr: `${year}-${month}-${day}`,
      hour: parseInt(hourStr, 10),
      minute: parseInt(minuteStr, 10),
      timeStrFull: `${hourStr}:${minuteStr}`
    };
  } catch {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return {
      dateStr: now.toISOString().split("T")[0],
      hour: now.getHours(),
      minute: now.getMinutes(),
      timeStrFull: `${pad(now.getHours())}:${pad(now.getMinutes())}`
    };
  }
}

/**
 * Calcula los slots de horarios disponibles para entrega según la fecha, zona horaria y estado del repartidor.
 */
function computeAvailableHours(
  fechaEntrega: string,
  isRestDay: boolean,
  zoneTime: { dateStr: string; hour: number; minute: number },
  driverName: string
): string[] {
  if (!fechaEntrega || isRestDay || fechaEntrega < zoneTime.dateStr) return [];

  const { startHour, startMinute, endHour, endMinute } = getDriverScheduleConfig(driverName);
  const allSlots: string[] = [];

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  for (let m = startTotalMinutes; m <= endTotalMinutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    const slotStr = `${pad(h)}:${pad(min)}`;

    // Si es hoy, filtrar horarios pasados
    if (fechaEntrega === zoneTime.dateStr) {
      if (h < zoneTime.hour || (h === zoneTime.hour && min <= zoneTime.minute)) {
        continue;
      }
    }
    allSlots.push(slotStr);
  }

  return allSlots;
}

export default function OrdenesEntregaForm({ 
  productos, 
  zonasReparto, 
  stockItems, 
  costos, 
  configEnganches,
  repartosExistentes = [],
  currentUserId,
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

  const selectedProductCost = useMemo(() => {
    if (!selectedImei) return 0;
    const stockItem = stockItems.find((stock) => stock.imei === selectedImei);
    if (!stockItem) return 0;
    const costoRecord = costos.find((costo) => costo.producto_id === stockItem.producto_id);
    if (!costoRecord) return 0;
    const baseCosto = Number(costoRecord.costo) || 0;
    return baseCosto * (1 + PORCENTAJE_EXTRA_SOBRE_COSTO / 100);
  }, [selectedImei, stockItems, costos]);

  // Hook jerárquico de Porcentajes: Nivel 1 (Vendedor) -> Nivel 2 (Zona) -> Nivel 3 (General)
  const enganchePorcentajes = useMemo(() => {
    if (!clienteHistorial) return [];
    
    // Nivel 1 (Máxima Prioridad): Regla por Vendedor
    if (currentUserId) {
      const vendedorConfig = configEnganches.find(
        (config) =>
          config.vendedor_id === currentUserId &&
          config.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
      );
      if (vendedorConfig && vendedorConfig.porcentajes && vendedorConfig.porcentajes.length > 0) {
        return vendedorConfig.porcentajes;
      }
    }

    // Nivel 2: Regla por Zona
    if (selectedZona) {
      const normZona = selectedZona.toLowerCase().trim();
      const plazaPrincipal = getPlazaCostoPrincipal(selectedZona).toLowerCase().trim();

      // Regla individual de la zona
      const zoneConfig = configEnganches.find(
        (config) =>
          !config.vendedor_id &&
          config.zona &&
          config.zona.toLowerCase().trim() === normZona &&
          config.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
      );
      if (zoneConfig && zoneConfig.porcentajes && zoneConfig.porcentajes.length > 0) {
        return zoneConfig.porcentajes;
      }

      // Regla de plaza cabecera si no tiene individual
      if (plazaPrincipal !== normZona) {
        const parentZoneConfig = configEnganches.find(
          (config) =>
            !config.vendedor_id &&
            config.zona &&
            config.zona.toLowerCase().trim() === plazaPrincipal &&
            config.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
        );
        if (parentZoneConfig && parentZoneConfig.porcentajes && parentZoneConfig.porcentajes.length > 0) {
          return parentZoneConfig.porcentajes;
        }
      }
    }

    // Nivel 3 (Fallback Base): Configuración General
    const generalConfig = configEnganches.find(
      (config) =>
        !config.vendedor_id &&
        !config.zona &&
        config.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
    );
    return generalConfig ? generalConfig.porcentajes : [];
  }, [clienteHistorial, selectedZona, configEnganches, currentUserId]);

  /**
   * Determina si el enganche libre está habilitado siguiendo la jerarquía de 3 niveles:
   * 1. Nivel 1 (Máxima Prioridad): Regla asignada al Vendedor logueado.
   * 2. Nivel 2: Regla de la Zona seleccionada (o su plaza principal).
   * 3. Nivel 3 (Fallback): Configuración General del sistema.
   */
  const isEngancheLibre = useMemo(() => {
    if (!clienteHistorial) return false;

    // Nivel 1 (Máxima Prioridad): Regla por Vendedor
    if (currentUserId) {
      const vendedorConfig = configEnganches.find(
        (config) =>
          config.vendedor_id === currentUserId &&
          config.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
      );
      if (vendedorConfig !== undefined && typeof vendedorConfig.permitir_enganche_libre === "boolean") {
        return vendedorConfig.permitir_enganche_libre;
      }
    }

    // Nivel 2: Regla por Zona
    if (selectedZona) {
      const normZona = selectedZona.toLowerCase().trim();
      const plazaPrincipal = getPlazaCostoPrincipal(selectedZona).toLowerCase().trim();

      const zoneConfig = configEnganches.find(
        (config) =>
          !config.vendedor_id &&
          config.zona &&
          config.zona.toLowerCase().trim() === normZona &&
          config.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
      );
      if (zoneConfig !== undefined && typeof zoneConfig.permitir_enganche_libre === "boolean") {
        return zoneConfig.permitir_enganche_libre;
      }

      if (plazaPrincipal !== normZona) {
        const parentZoneConfig = configEnganches.find(
          (config) =>
            !config.vendedor_id &&
            config.zona &&
            config.zona.toLowerCase().trim() === plazaPrincipal &&
            config.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
        );
        if (parentZoneConfig !== undefined && typeof parentZoneConfig.permitir_enganche_libre === "boolean") {
          return parentZoneConfig.permitir_enganche_libre;
        }
      }
    }

    // Nivel 3 (Fallback Base): Configuración General
    const generalConfig = configEnganches.find(
      (config) =>
        !config.vendedor_id &&
        !config.zona &&
        config.cliente_historial.toLowerCase().trim() === clienteHistorial.toLowerCase().trim()
    );
    return Boolean(generalConfig?.permitir_enganche_libre);
  }, [clienteHistorial, selectedZona, configEnganches, currentUserId]);

  useEffect(() => {
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

  const stockFiltrado = useMemo(() => {
    if (!selectedRepartidorId) return [];
    return stockItems.filter(stockItem => stockItem.zona === selectedRepartidorId);
  }, [selectedRepartidorId, stockItems]);

  const productosConStock = useMemo(() => {
    if (!selectedRepartidorId) return [];
    
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
      .filter(producto => producto.cantidadStock > 0);
  }, [selectedRepartidorId, productos, stockFiltrado]);

  const modelosUnicos = useMemo(() => {
    const map = new Map<string, any>();
    productosConStock.forEach(producto => {
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

  const zonasUnicas = useMemo(() => {
    const set = new Set<string>();
    (zonasReparto || []).forEach(zonaInfo => {
      if (zonaInfo.nombre_zona) {
        set.add(zonaInfo.nombre_zona);
      }
    });
    return Array.from(set).sort();
  }, [zonasReparto]);

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
      const match = (zonasReparto || []).find(zonaItem => zonaItem.repartidor_id === selectedRepartidorId && zonaItem.nombre_zona === selectedZona);
      if (match) return match;
    }
    return (zonasReparto || []).find(zonaItem => {
      if (zonaItem.nombre_zona !== selectedZona || !zonaItem.repartidor_nombre) return false;
      const norm = zonaItem.repartidor_nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
    return getZoneTimeInfo(selectedTimeZone, isMounted);
  }, [isMounted, selectedTimeZone]);

  const driverRestDayInfo = useMemo(() => {
    return getDriverRestDayInfo(selectedRepartidorName, fechaEntrega);
  }, [selectedRepartidorName, fechaEntrega]);

  const horasDisponibles = useMemo(() => {
    return computeAvailableHours(
      fechaEntrega,
      driverRestDayInfo.isRestDay,
      zoneTime,
      selectedRepartidorName
    );
  }, [fechaEntrega, zoneTime, selectedRepartidorName, driverRestDayInfo.isRestDay]);

  const horariosOcupados = useMemo(() => {
    if (!selectedRepartidorId || !fechaEntrega || !repartosExistentes || !repartosExistentes.length) {
      return new Set<string>();
    }
    const occupied = new Set<string>();
    repartosExistentes.forEach((reparto) => {
      if (reparto.repartidor_id === selectedRepartidorId && reparto.fecha_reparto === fechaEntrega && reparto.horario) {
        const timePart = reparto.horario.slice(0, 5);
        occupied.add(timePart);
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

    const result = await submitOrdenEntrega(formData);

    if (result.success) {
      setStatus({ type: 'success', message: `¡Orden de Entrega ${result.folio || ''} registrada y enviada a Discord!` });
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

      {/* 1. Datos del cliente */}
      <FormDatosCliente />

      {/* 2. Selección de equipo y stock */}
      <FormSeleccionEquipo
        selectedZona={selectedZona}
        handleZonaChange={handleZonaChange}
        zonasUnicas={zonasUnicas}
        selectedRepartidorId={selectedRepartidorId}
        handleRepartidorChange={handleRepartidorChange}
        repartidoresValidos={repartidoresValidos}
        selectedRepartidorName={selectedRepartidorName}
        selectedModelKey={selectedModelKey}
        handleModelChange={handleModelChange}
        modelosUnicos={modelosUnicos}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        variantesColor={variantesColor}
        selectedImei={selectedImei}
        setSelectedImei={setSelectedImei}
        imeisDisponibles={imeisDisponibles}
        clienteHistorial={clienteHistorial}
        setClienteHistorial={setClienteHistorial}
        selectedProductCost={selectedProductCost}
        engancheValue={engancheValue}
        setEngancheValue={setEngancheValue}
        enganchePorcentajes={enganchePorcentajes}
        isEngancheLibre={isEngancheLibre}
      />

      {/* 3. Programación de entrega y verificación */}
      <FormProgramacionEntrega
        fechaEntrega={fechaEntrega}
        setFechaEntrega={setFechaEntrega}
        horaEntrega={horaEntrega}
        setHoraEntrega={setHoraEntrega}
        isIOS={isIOS}
        handleOpenPicker={handleOpenPicker}
        horasDisponibles={horasDisponibles}
        driverRestDayInfo={driverRestDayInfo}
        zoneTime={zoneTime}
        horariosOcupados={horariosOcupados}
        isMounted={isMounted}
        selectedZona={selectedZona}
        selectedRepartidorName={selectedRepartidorName}
        isRepartidorCT={isRepartidorCT}
        selectedZoneDisplayName={selectedZoneDisplayName}
        selectedFileName={selectedFileName}
        handleFileChange={handleFileChange}
      />

      <button
        type="submit"
        className={isSubmitting ? styles.buttonDisabled : styles.button}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <span className="animate-spin h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full" />
            <span>Procesando...</span>
          </div>
        ) : (
          'Registrar Orden de Entrega'
        )}
      </button>
    </form>
  );
}