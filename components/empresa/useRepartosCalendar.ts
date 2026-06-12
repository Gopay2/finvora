'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  getRepartosMes, 
  getLogisticsFormData, 
  crearReparto, 
  eliminarReparto 
} from '@/app/empresa/webapp/repartos/repartos-actions';

export interface Reparto {
  id: string;
  fecha_reparto: string;
  horario: string;
  repartidor_id: string;
  zona_id: string;
  vendedor_id: string;
  imei: string;
  producto_id: string;
  notas?: string;
  repartidores?: {
    id: string;
    nombre: string;
    zona_horaria: string;
  };
  zonas_reparto?: {
    id: string;
    nombre_zona: string;
    descripcion?: string;
  };
  productos?: {
    id: string;
    marca: string;
    modelo: string;
    color?: string;
    almacenamiento?: string;
  };
  vendedor?: {
    id: string;
    username?: string;
    email?: string;
  };
}

export interface Repartidor {
  id: string;
  nombre: string;
  zona_horaria: string;
}

export interface Zona {
  id: string;
  nombre_zona: string;
  repartidor_id: string;
  descripcion?: string;
}

export interface Vendedor {
  id: string;
  username?: string;
  email?: string;
  role?: string;
}

export interface StockItem {
  imei: string;
  producto_id: string;
  zona?: string | null;
  productos?: {
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
  };
}

export interface FormDataOptions {
  repartidores: Repartidor[];
  zonas: Zona[];
  vendedores: Vendedor[];
  stock: StockItem[];
}

export function useRepartosCalendar(userRole?: string) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estados de datos con tipado fuerte
  const [repartos, setRepartos] = useState<Reparto[]>([]);
  const [formDataOptions, setFormDataOptions] = useState<FormDataOptions>({
    repartidores: [],
    zonas: [],
    vendedores: [],
    stock: []
  });

  // Estados de carga e interfaz
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRepartidorTab, setSelectedRepartidorTab] = useState<string | null>(null);
  const [timezoneDiffText, setTimezoneDiffText] = useState<string | null>(null);

  // Filtrar repartidores de logística (excluir "local" y "cambaceo" case-insensitive)
  const repartidoresFiltradosLogistica = useMemo(() => {
    return (formDataOptions?.repartidores || []).filter(rep => {
      const name = (rep.nombre || "").toLowerCase();
      return !name.includes("local") && !name.includes("cambaceo");
    });
  }, [formDataOptions?.repartidores]);

  // Seleccionar por defecto el primer repartidor al abrir el modal
  useEffect(() => {
    if (isModalOpen && !selectedRepartidorTab && repartidoresFiltradosLogistica.length > 0) {
      setSelectedRepartidorTab(repartidoresFiltradosLogistica[0].id);
    }
  }, [isModalOpen, repartidoresFiltradosLogistica, selectedRepartidorTab]);

  // Calcular diferencia horaria del repartidor seleccionado con la del navegador y listar sus zonas de reparto
  useEffect(() => {
    if (!selectedRepartidorTab) return;
    const rep = repartidoresFiltradosLogistica.find(repartidor => repartidor.id === selectedRepartidorTab);
    if (!rep) return;
    try {
      const now = new Date();
      const repTimeFormatted = now.toLocaleTimeString('es-MX', { timeZone: rep.zona_horaria, hour: '2-digit', minute: '2-digit', hour12: false });
      const repTimeStr = now.toLocaleTimeString('en-US', { timeZone: rep.zona_horaria, hour: 'numeric', hour12: false });
      const localTimeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false });
      const repHour = parseInt(repTimeStr, 10);
      const localHour = parseInt(localTimeStr, 10);
      const diff = localHour - repHour;
      let tzCity = 'CDMX / Mty';
      if (rep.zona_horaria === 'America/Cancun') tzCity = 'Cancún';
      else if (rep.zona_horaria === 'America/Mexico_City' || rep.zona_horaria === 'America/Monterrey') tzCity = 'Monterrey';
      else if (rep.zona_horaria === 'America/Hermosillo' || rep.zona_horaria === 'America/Mazatlan') tzCity = 'Sonora';
      else if (rep.zona_horaria === 'America/Tijuana') tzCity = 'Tijuana';
      else tzCity = rep.zona_horaria.split('/').pop()?.replace('_', ' ') || rep.zona_horaria;

      // Obtener las zonas de reparto asignadas a este repartidor
      const driverZones = (formDataOptions?.zonas || []).filter(z => z.repartidor_id === selectedRepartidorTab);
      const zonesStr = driverZones.map(z => z.nombre_zona).join(', ') || 'Sin Zonas';

      if (diff === 0) {
        setTimezoneDiffText(`Zonas: ${zonesStr} | Hora local (${tzCity}): ${repTimeFormatted}`);
      } else {
        setTimezoneDiffText(`Zona: ${zonesStr} | Hora actual: ${repTimeFormatted}`);
      }
    } catch (e) {
      setTimezoneDiffText(null);
    }
  }, [selectedRepartidorTab, repartidoresFiltradosLogistica, formDataOptions?.zonas]);

  // Estados del Formulario
  const [formRepartidor, setFormRepartidor] = useState('');
  const [formZona, setFormZona] = useState('');
  const [formVendedor, setFormVendedor] = useState('');
  const [formStockImei, setFormStockImei] = useState('');
  const [formHorario, setFormHorario] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Carga de Repartos del Mes
  const cargarRepartos = async () => {
    setLoading(true);
    const res = await getRepartosMes(year, month);
    if (res.success && res.data) {
      setRepartos(res.data as Reparto[]);
    }
    setLoading(false);
  };

  // Carga de Opciones de Formulario (Stock, Vendedores, Repartidores, Zonas)
  const cargarOpcionesForm = async () => {
    const res = await getLogisticsFormData();
    if (res.success && res.data) {
      setFormDataOptions(res.data as FormDataOptions);
    }
  };

  useEffect(() => {
    cargarRepartos();
  }, [currentDate]);

  useEffect(() => {
    cargarOpcionesForm();
  }, []);

  useEffect(() => {
    if (formRepartidor) {
      const match = formDataOptions.zonas.find(z => z.repartidor_id === formRepartidor);
      setFormZona(match ? match.id : '');
    } else {
      setFormZona('');
    }
  }, [formRepartidor, formDataOptions.zonas]);

  useEffect(() => {
    console.log("LOGISTICS CALENDAR STOCK:", formDataOptions.stock);
  }, [formDataOptions.stock]);

  const today = new Date();
  const isToday = (d: number) => {
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  };

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Filtrar zonas según el repartidor seleccionado en el formulario
  const zonasFiltradas = formDataOptions.zonas.filter(zona => zona.repartidor_id === formRepartidor);

  // Obtener repartos filtrados del día seleccionado en el Modal
  const formattedSelectedDayStr = selectedDay !== null 
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : '';

  const repartosDelDiaSeleccionado = repartos.filter(reparto => reparto.fecha_reparto === formattedSelectedDayStr);

  const handleCrearReparto = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionLoading(true);

    if (formHorario) {
      const [hoursStr, minutesStr] = formHorario.split(':');
      const deliveryHour = parseInt(hoursStr, 10);
      const deliveryMinute = parseInt(minutesStr, 10);
      
      const rep = repartidoresFiltradosLogistica.find(r => r.id === formRepartidor);
      const tz = rep?.zona_horaria || 'America/Mexico_City';
      const driverNowString = new Date().toLocaleString('en-US', { timeZone: tz });
      const driverNow = new Date(driverNowString);
      const minAllowedTime = new Date(driverNow.getTime() + 60 * 60 * 1000); // 1 hora en el futuro
      
      const deliveryDate = new Date(year, month, selectedDay || 1, deliveryHour, deliveryMinute);

      const isPrivileged = userRole === 'Admin' || userRole === 'Developer' || userRole === 'Supervisor' || userRole === 'Repartidor';
      if (!isPrivileged && deliveryDate < minAllowedTime) {
        setFormError("La fecha y hora del reparto debe ser al menos 1 hora en el futuro respecto a la hora actual del repartidor, para permitir que tenga tiempo de llegar.");
        setActionLoading(false);
        return;
      }
    }

    if (!formStockImei) {
      setFormError("Debes seleccionar un equipo de stock.");
      setActionLoading(false);
      return;
    }

    const stockItem = formDataOptions.stock.find(stock => stock.imei === formStockImei);
    if (!stockItem) {
      setFormError("Equipo de stock no válido.");
      setActionLoading(false);
      return;
    }

    const res = await crearReparto({
      fecha_reparto: formattedSelectedDayStr,
      horario: formHorario,
      repartidor_id: formRepartidor,
      zona_id: formZona,
      vendedor_id: formVendedor,
      imei: formStockImei,
      producto_id: stockItem.producto_id,
      notas: formNotas
    });

    if (res.success) {
      // Limpiar formulario y cerrar
      setFormRepartidor('');
      setFormZona('');
      setFormVendedor('');
      setFormStockImei('');
      setFormHorario('');
      setFormNotas('');
      setIsFormOpen(false);
      // Recargar base
      await cargarRepartos();
      await cargarOpcionesForm(); // Refrescar stock por si acaso
    } else {
      setFormError(res.error || "Ocurrió un error al guardar el reparto.");
    }
    setActionLoading(false);
  };

  const handleEliminarReparto = async (repartoId: string) => {
    setActionLoading(true);
    const res = await eliminarReparto(repartoId);
    if (res.success) {
      await cargarRepartos();
      await cargarOpcionesForm(); // Devolver IMEI al dropdown de stock
    } else {
      alert("Error al eliminar reparto: " + res.error);
    }
    setActionLoading(false);
  };

  return {
    // Estados
    currentDate,
    repartos,
    formDataOptions,
    repartidoresFiltradosLogistica,
    loading,
    actionLoading,
    selectedDay,
    isModalOpen,
    isFormOpen,
    selectedRepartidorTab,
    timezoneDiffText,
    formRepartidor,
    formZona,
    formVendedor,
    formStockImei,
    formHorario,
    formNotas,
    formError,
    
    // Auxiliares calculados
    year,
    month,
    daysInMonth,
    firstDay,
    blanks,
    days,
    monthNames,
    zonasFiltradas,
    repartosDelDiaSeleccionado,
    formattedSelectedDayStr,

    // Acciones y Setters
    setCurrentDate,
    setSelectedDay,
    setIsModalOpen,
    setIsFormOpen,
    setSelectedRepartidorTab,
    setFormRepartidor,
    setFormZona,
    setFormVendedor,
    setFormStockImei,
    setFormHorario,
    setFormNotas,
    setFormError,
    prevMonth,
    nextMonth,
    isToday,
    handleCrearReparto,
    handleEliminarReparto,
  };
}
