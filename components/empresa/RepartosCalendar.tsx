'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  getRepartosMes, 
  getLogisticsFormData, 
  crearReparto, 
  eliminarReparto 
} from '@/app/empresa/webapp/repartos/repartos-actions';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function RepartosCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Estados de datos
  const [repartos, setRepartos] = useState<any[]>([]);
  const [formDataOptions, setFormDataOptions] = useState<{
    repartidores: any[];
    zonas: any[];
    vendedores: any[];
    stock: any[];
  }>({ repartidores: [], zonas: [], vendedores: [], stock: [] });

  // Estados de carga e interfaz
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRepartidorTab, setSelectedRepartidorTab] = useState<string | null>(null);
  const [timezoneDiffText, setTimezoneDiffText] = useState<string | null>(null);

  // Seleccionar por defecto el primer repartidor al abrir el modal
  useEffect(() => {
    if (isModalOpen && !selectedRepartidorTab && formDataOptions.repartidores.length > 0) {
      setSelectedRepartidorTab(formDataOptions.repartidores[0].id);
    }
  }, [isModalOpen, formDataOptions.repartidores, selectedRepartidorTab]);

  // Calcular diferencia horaria del repartidor seleccionado con la del navegador
  useEffect(() => {
    if (!selectedRepartidorTab) return;
    const rep = formDataOptions.repartidores.find(r => r.id === selectedRepartidorTab);
    if (!rep) return;
    try {
      const now = new Date();
      const repTimeFormatted = now.toLocaleTimeString('es-MX', { timeZone: rep.zona_horaria, hour: '2-digit', minute: '2-digit', hour12: false });
      const repTimeStr = now.toLocaleTimeString('en-US', { timeZone: rep.zona_horaria, hour: 'numeric', hour12: false });
      const localTimeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false });
      const repHour = parseInt(repTimeStr, 10);
      const localHour = parseInt(localTimeStr, 10);
      const diff = localHour - repHour;
      let cityName = 'CDMX / Mty';
      if (rep.zona_horaria === 'America/Cancun') cityName = 'Cancún';
      else if (rep.zona_horaria === 'America/Mexico_City' || rep.zona_horaria === 'America/Monterrey') cityName = 'Monterrey';
      else if (rep.zona_horaria === 'America/Hermosillo' || rep.zona_horaria === 'America/Mazatlan') cityName = 'Sonora';
      else if (rep.zona_horaria === 'America/Tijuana') cityName = 'Tijuana';
      else cityName = rep.zona_horaria.split('/').pop()?.replace('_', ' ') || rep.zona_horaria;

      if (diff === 0) {
        setTimezoneDiffText(`Misma zona horaria que tú (${cityName}) | Hora actual: ${repTimeFormatted}`);
      } else {
        setTimezoneDiffText(`Zona: ${cityName} (Hora actual: ${repTimeFormatted})`);
      }
    } catch (e) {
      setTimezoneDiffText(null);
    }
  }, [selectedRepartidorTab, formDataOptions.repartidores]);

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
      setRepartos(res.data);
    }
    setLoading(false);
  };

  // Carga de Opciones de Formulario (Stock, Vendedores, Repartidores, Zonas)
  const cargarOpcionesForm = async () => {
    const res = await getLogisticsFormData();
    if (res.success && res.data) {
      setFormDataOptions(res.data);
    }
  };

  useEffect(() => {
    cargarRepartos();
  }, [currentDate]);

  useEffect(() => {
    cargarOpcionesForm();
  }, []);

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
  const zonasFiltradas = formDataOptions.zonas.filter(z => z.repartidor_id === formRepartidor);

  // Obtener repartos filtrados del día seleccionado en el Modal
  const formattedSelectedDayStr = selectedDay !== null 
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : '';

  const repartosDelDiaSeleccionado = repartos.filter(r => r.fecha_reparto === formattedSelectedDayStr);

  const handleCrearReparto = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionLoading(true);

    if (formHorario) {
      const [hoursStr, minutesStr] = formHorario.split(':');
      const deliveryHour = parseInt(hoursStr, 10);
      const deliveryMinute = parseInt(minutesStr, 10);
      const deliveryDate = new Date(year, month, selectedDay || 1, deliveryHour, deliveryMinute);
      const now = new Date();
      const minAllowedTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora en el futuro

      if (deliveryDate < minAllowedTime) {
        setFormError("La fecha y hora del reparto debe ser al menos 1 hora en el futuro respecto a tu hora actual, para permitir que el repartidor tenga tiempo de llegar.");
        setActionLoading(false);
        return;
      }
    }

    if (!formStockImei) {
      setFormError("Debes seleccionar un equipo de stock.");
      setActionLoading(false);
      return;
    }

    const stockItem = formDataOptions.stock.find(s => s.imei === formStockImei);
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

  return (
    <div className="flex flex-col w-full relative">
      {/* Indicador de carga general */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[90] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
        </div>
      )}

      {/* Header (Controles) */}
      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
        <h3 className="text-lg md:text-xl font-bold text-white capitalize tracking-wide">
          {monthNames[month]} <span className="text-secondary font-light ml-1">{year}</span>
        </h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 h-8 flex items-center justify-center rounded-lg bg-secondary text-slate-950 hover:bg-secondary/90 transition-all border border-transparent text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
          >
            Hoy
          </button>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button 
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grilla del Calendario */}
      <div className="w-full flex flex-col">
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/40">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Cuerpo del calendario */}
        <div className="grid grid-cols-7 select-none">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="border-r border-b border-slate-800/20 bg-slate-950/10 min-h-16 md:min-h-24">
            </div>
          ))}
          {days.map((d) => {
            const todayFlag = isToday(d);
            const formattedDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const repartosDelDia = repartos.filter(r => r.fecha_reparto === formattedDayStr);

            return (
              <div 
                key={`day-${d}`} 
                onClick={() => {
                  setSelectedDay(d);
                  setIsModalOpen(true);
                  setIsFormOpen(false); // Abrir por defecto en listado
                }}
                className={`
                  border-r border-b border-slate-800/50 p-2 flex flex-col transition-all group relative cursor-pointer min-h-16 md:min-h-24
                  ${todayFlag ? 'bg-secondary/5 z-10' : 'bg-transparent hover:bg-slate-800/20'}
                `}
              >
                {/* Borde flúor y resplandor para el cuadrado completo */}
                {todayFlag && (
                  <div className="absolute inset-0 border-2 border-secondary shadow-[0_0_20px_rgba(16,185,129,0.4),inset_0_0_20px_rgba(16,185,129,0.15)] pointer-events-none" />
                )}

                <div className="flex items-start justify-between relative z-10 shrink-0">
                  <span className={`
                    w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-all
                    ${todayFlag 
                      ? 'text-secondary font-black text-sm' 
                      : 'text-slate-400 group-hover:text-white'}
                  `}>
                    {d}
                  </span>
                  
                  {/* Badge de cantidad de envíos si los hay */}
                  {repartosDelDia.length > 0 && (
                    <span className="text-[9px] font-bold text-slate-950 bg-secondary px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in duration-300">
                      {repartosDelDia.length}
                    </span>
                  )}
                </div>

                {/* Área de contenido para renderizar repartos compactos */}
                <div className="flex-1 mt-1 overflow-y-auto space-y-0.5 relative z-10 custom-scrollbar pr-0.5 min-h-0">
                  {repartosDelDia.slice(0, 2).map((rep) => {
                    // Extraer primer nombre del repartidor para que quede compacto
                    const primerNombreRep = rep.repartidores?.nombre?.replace("Repartidor ", "").split(' ')[0] || "S/R";
                    return (
                      <div 
                        key={rep.id} 
                        className="text-[9px] font-semibold bg-slate-950/60 text-slate-300 border border-slate-800/60 rounded-md px-1.5 py-0.5 flex items-center justify-between gap-1 shadow-sm hover:border-slate-700 hover:text-white transition-all truncate"
                        title={`${rep.productos?.marca} ${rep.productos?.modelo} - ${rep.repartidores?.nombre} (${rep.zonas_reparto?.nombre_zona})`}
                      >
                        <span className="truncate max-w-[95%]">
                          📦 {rep.productos?.marca} {rep.productos?.modelo} ({primerNombreRep})
                        </span>
                      </div>
                    );
                  })}
                  {repartosDelDia.length > 2 && (
                    <div className="text-[9px] font-bold text-center text-secondary bg-secondary/10 border border-secondary/20 rounded-md py-0.5 mt-0.5">
                      + {repartosDelDia.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DETALLES / AGENDAR REPARTO */}
      {isMounted && isModalOpen && selectedDay !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] my-auto">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {isFormOpen ? "Agendar Nuevo Reparto" : `Repartos — ${selectedDay} de ${monthNames[month]} de ${year}`}
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  {isFormOpen 
                    ? "Completa los datos del envío" 
                    : `${repartosDelDiaSeleccionado.length} entregas agendadas`}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                  setSelectedRepartidorTab(null);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* CUERPO DEL MODAL (LISTADO) */}
            {!isFormOpen && (
              <>
                {/* Selector de Pestañas de Repartidores */}
                {formDataOptions.repartidores.length > 0 ? (
                  <div className="flex flex-col gap-2 border-b border-slate-800/80 pb-4 pt-3 shrink-0">
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                      {formDataOptions.repartidores.map((rep) => {
                        const isActive = selectedRepartidorTab === rep.id;
                        const countRepartos = repartosDelDiaSeleccionado.filter(r => r.repartidores?.id === rep.id).length;
                        
                        let tzShort = 'GMT-6';
                        try {
                          const formatter = new Intl.DateTimeFormat('en-US', {
                            timeZone: rep.zona_horaria,
                            timeZoneName: 'shortOffset'
                          });
                          tzShort = formatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'GMT-6';
                        } catch (e) {}

                        return (
                          <button
                            key={rep.id}
                            type="button"
                            onClick={() => setSelectedRepartidorTab(rep.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
                              isActive 
                                ? 'bg-secondary/10 border-secondary text-secondary shadow-[0_0_15px_rgba(16,185,129,0.08)] font-extrabold' 
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-750'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">person</span>
                            <span>{rep.nombre}</span>
                            <span className="text-[10px] opacity-60 font-semibold">({tzShort})</span>
                            {countRepartos > 0 && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                isActive ? 'bg-secondary text-slate-950' : 'bg-slate-800/80 text-slate-300'
                              }`}>
                                {countRepartos}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {timezoneDiffText && (
                      <div className="text-xs text-blue-400 font-bold flex items-center gap-2 ml-1 mt-1.5 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl w-fit shadow-[0_0_15px_rgba(59,130,246,0.05)]">
                        <span className="material-symbols-outlined text-sm text-blue-400 animate-pulse">schedule</span>
                        <span>{timezoneDiffText}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/30 border border-slate-800 text-slate-500 text-xs rounded-2xl text-center my-3 shrink-0">
                    ⚠️ No hay repartidores activos registrados para ver agendas. Ve a Configuración de Repartidores primero.
                  </div>
                )}

                <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-1 custom-scrollbar min-h-0 my-2">
                  {selectedRepartidorTab ? (() => {
                    const driverReps = repartosDelDiaSeleccionado.filter(rep => rep.repartidores?.id === selectedRepartidorTab);
                    const extraHours = new Set<number>();
                    driverReps.forEach(rep => {
                      if (!rep.horario) return;
                      const match = rep.horario.match(/^(\d+)/);
                      if (match) {
                        const h = parseInt(match[1], 10);
                        if (h < 8 || h > 20) {
                          extraHours.add(h);
                        }
                      }
                    });
                    const standardHours = Array.from({ length: 13 }, (_, i) => i + 8);
                    const allHours = Array.from(new Set([...standardHours, ...Array.from(extraHours)])).sort((a, b) => a - b);

                    return allHours.map((h) => {
                      const formattedHour = `${String(h).padStart(2, '0')}:00`;
                      
                      // Calcular si esta hora en el día seleccionado ya pasó o tiene menos de 1 hora de anticipación
                      const slotDate = new Date(year, month, selectedDay || 1, h, 0);
                      const now = new Date();
                      const minAllowed = new Date(now.getTime() + 60 * 60 * 1000);
                      const isPastOrUnavailable = slotDate < minAllowed;
                      
                      // Buscar repartos para esta hora asignados a este repartidor específico
                      const repsInHour = driverReps.filter(rep => {
                        if (!rep.horario) return false;
                        if (rep.horario === formattedHour || rep.horario === `${h}:00`) return true;
                        const match = rep.horario.match(/^(\d+)/);
                        if (match) {
                          return parseInt(match[1], 10) === h;
                        }
                        return false;
                      });

                      return (
                        <div key={h} className="flex gap-4 items-stretch group/row min-h-12">
                          {/* Indicador de Hora (Local del Repartidor) */}
                          <div className="w-20 flex flex-col items-center justify-center shrink-0 border-r border-slate-800 pr-3 relative">
                            <span className="text-xs font-black text-slate-300 font-mono tracking-tight">
                              {formattedHour}
                            </span>
                            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">
                              {h >= 12 ? 'pm' : 'am'}
                            </span>
                            {/* Línea vertical conectora */}
                            <div className="absolute right-[-1px] top-1/2 bottom-0 w-[2px] bg-slate-800 group-last/row:hidden" />
                            <div className="absolute right-[-1px] top-0 bottom-1/2 w-[2px] bg-slate-800 group-first/row:hidden" />
                            {/* Nodo central */}
                            <div className={`absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 rounded-full border ${
                              repsInHour.length > 0 ? 'bg-secondary border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.6)] w-2.5 h-2.5 right-[-5px]' : 'bg-slate-900 border-slate-800 h-2 w-2'
                            }`} />
                          </div>

                          {/* Contenido (Tarjeta o Vacío) */}
                          <div className="flex-1 pb-2">
                            {repsInHour.length > 0 ? (
                              <div className="space-y-2">
                                {repsInHour.map((rep) => (
                                  <div 
                                    key={rep.id} 
                                    className="relative bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-inner group overflow-hidden"
                                  >
                                    {/* Línea decorativa izquierda flúor */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />

                                    <div className="space-y-2 flex-1 min-w-0 pl-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-secondary border border-emerald-500/20">
                                          📍 {rep.zonas_reparto?.nombre_zona || 'Sin Zona'} ({rep.zonas_reparto?.descripcion || 'Sin descripción'})
                                        </span>
                                      </div>
                                      
                                      <h4 className="text-white font-bold text-base truncate">
                                        {rep.productos?.marca} {rep.productos?.modelo} 
                                        <span className="text-xs font-normal text-slate-500 ml-2">({rep.productos?.color} - {rep.productos?.almacenamiento})</span>
                                      </h4>
                                      
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                          <span className="material-symbols-outlined text-sm text-slate-500">local_shipping</span>
                                          Repartidor: <strong className="text-slate-200">{rep.repartidores?.nombre || 'No asignado'}</strong>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <span className="material-symbols-outlined text-sm text-slate-500">person</span>
                                          Vendedor: <strong className="text-slate-200">
                                            {(() => {
                                              const rawName = rep.vendedor?.username || rep.vendedor?.email || 'N/A';
                                              return rawName !== 'N/A' ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'N/A';
                                            })()}
                                          </strong>
                                        </span>
                                        {rep.imei && (
                                          <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                            <span className="material-symbols-outlined text-sm text-slate-500">tag</span>
                                            IMEI: <strong className="text-slate-200">{rep.imei}</strong>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <button
                                      onClick={() => handleEliminarReparto(rep.id)}
                                      disabled={actionLoading}
                                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer md:self-center self-end disabled:opacity-50"
                                      title="Eliminar Reparto"
                                    >
                                      <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Slot Vacío */
                              <button
                                onClick={() => {
                                  if (isPastOrUnavailable) return;
                                  setFormHorario(formattedHour);
                                  setFormRepartidor(selectedRepartidorTab || '');
                                  setIsFormOpen(true);
                                  setFormError(null);
                                }}
                                disabled={isPastOrUnavailable}
                                className={`
                                  w-full text-left py-2.5 px-4 rounded-xl border border-dashed transition-all flex items-center justify-between group/btn
                                  ${isPastOrUnavailable 
                                    ? 'border-slate-800/40 bg-slate-950/5 text-slate-700 cursor-not-allowed opacity-40' 
                                    : 'border-slate-800 hover:border-secondary/30 bg-transparent hover:bg-secondary/5 text-slate-600 hover:text-secondary cursor-pointer'
                                  }
                                `}
                              >
                                <span className="text-xs italic select-none">
                                  {isPastOrUnavailable ? 'Horario no disponible (Pasado / Límite)' : 'Sin repartos programados'}
                                </span>
                                {!isPastOrUnavailable && (
                                  <span className="material-symbols-outlined text-sm opacity-0 group-hover/btn:opacity-100 transition-all text-secondary">
                                    add_circle
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()
                  : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 italic text-sm">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">touch_app</span>
                      Selecciona un repartidor en la barra superior para ver su agenda
                    </div>
                  )}
                </div>

                {/* Footer del Modal (Listado) */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 shrink-0">
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedRepartidorTab(null);
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all cursor-pointer border border-slate-700"
                  >
                    Cerrar
                  </button>
                  <button 
                    onClick={() => {
                      setFormRepartidor(selectedRepartidorTab || '');
                      setIsFormOpen(true);
                      setFormError(null);
                    }}
                    disabled={!selectedRepartidorTab}
                    className="px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Agendar Reparto
                  </button>
                </div>
              </>
            )}

            {/* CUERPO DEL MODAL (FORMULARIO CREACIÓN) */}
            {isFormOpen && (
              <form onSubmit={handleCrearReparto} className="flex-1 flex flex-col justify-between overflow-y-auto mt-4 min-h-0">
                <div className="space-y-4 pr-1 overflow-y-auto pb-4 custom-scrollbar">
                  
                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-pulse">
                      <span className="material-symbols-outlined text-base">error</span>
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vendedor */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Vendedor</label>
                      <select
                        value={formVendedor}
                        onChange={(e) => setFormVendedor(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Seleccionar Vendedor</option>
                        {formDataOptions.vendedores.map(v => {
                          const rawName = v.username ? v.username : (v.email || '');
                          const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : '';
                          const roleLabel = v.role ? `[${v.role}] ` : '';
                          return (
                            <option key={v.id} value={v.id}>
                              {roleLabel}{displayName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Stock disponible (IMEI) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Equipo (IMEI)</label>
                      <select
                        value={formStockImei}
                        onChange={(e) => setFormStockImei(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Seleccionar de Stock</option>
                        {formDataOptions.stock.map(s => (
                          <option key={s.imei} value={s.imei}>
                            {s.productos?.marca} {s.productos?.modelo} ({s.productos?.color}, {s.productos?.almacenamiento}) - IMEI: {s.imei}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Repartidor */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Repartidor</label>
                      <select
                        value={formRepartidor}
                        onChange={(e) => {
                          setFormRepartidor(e.target.value);
                          setFormZona(''); // Resetear zona cuando cambia repartidor
                        }}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Seleccionar Repartidor</option>
                        {formDataOptions.repartidores.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Zonas dinámicas según repartidor */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Zona asignada</label>
                      <select
                        value={formZona}
                        onChange={(e) => setFormZona(e.target.value)}
                        required
                        disabled={!formRepartidor}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">
                          {!formRepartidor ? 'Elige un repartidor primero' : 'Seleccionar Zona'}
                        </option>
                        {zonasFiltradas.map(z => (
                          <option key={z.id} value={z.id}>
                            {z.nombre_zona} ({z.descripcion || 'Sin descripción'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Horario de entrega */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Horario de entrega</label>
                    <select
                      value={formHorario}
                      onChange={(e) => setFormHorario(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="">Seleccionar Hora</option>
                      {Array.from({ length: 13 }, (_, i) => {
                        const h = i + 8;
                        const formattedHour = `${String(h).padStart(2, '0')}:00`;
                        const slotDate = new Date(year, month, selectedDay || 1, h, 0);
                        const now = new Date();
                        const minAllowed = new Date(now.getTime() + 60 * 60 * 1000);
                        const isPastOrUnavailable = slotDate < minAllowed;
                        return (
                          <option 
                            key={formattedHour} 
                            value={formattedHour} 
                            disabled={isPastOrUnavailable}
                            className={isPastOrUnavailable ? "text-slate-600 bg-slate-950" : "text-white bg-slate-950"}
                          >
                            {formattedHour} hs {isPastOrUnavailable ? "(No disponible)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Footer del Formulario */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 shrink-0">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setFormError(null);
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all cursor-pointer border border-slate-700"
                    disabled={actionLoading}
                  >
                    Volver al Listado
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center gap-2"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Confirmar Reparto"
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
