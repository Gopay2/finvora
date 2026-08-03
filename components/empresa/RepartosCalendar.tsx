'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRepartosCalendar } from './useRepartosCalendar';
import { RepartosCalendarHeader } from './repartos/RepartosCalendarHeader';
import { RepartosCalendarGrid } from './repartos/RepartosCalendarGrid';
import { RepartosModalList } from './repartos/RepartosModalList';
import { RepartosModalForm } from './repartos/RepartosModalForm';

interface RepartosCalendarProps {
  userRole?: string;
}

export default function RepartosCalendar({ userRole }: RepartosCalendarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    // Estados
    loading,
    actionLoading,
    selectedDay,
    isModalOpen,
    isFormOpen,
    selectedRepartidorTab,
    timezoneDiffText,
    formRepartidor,
    formVendedor,
    formStockImei,
    formHorario,
    formError,
    
    // Auxiliares calculados
    year,
    month,
    blanks,
    days,
    monthNames,
    repartosDelDiaSeleccionado,
    formDataOptions,
    repartidoresFiltradosLogistica,
    repartos,

    // Acciones y Setters
    setCurrentDate,
    setSelectedDay,
    setIsModalOpen,
    setIsFormOpen,
    setSelectedRepartidorTab,
    setFormRepartidor,
    setFormVendedor,
    setFormStockImei,
    setFormHorario,
    setFormError,
    prevMonth,
    nextMonth,
    isToday,
    handleCrearReparto,
    handleEliminarReparto,
  } = useRepartosCalendar(userRole);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const canCreateOrDelete = ['Admin', 'Developer', 'Supervisor', 'Repartidor'].includes(userRole || '');

  return (
    <div className="flex flex-col w-full relative">
      {/* Indicador de carga general */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[90] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
        </div>
      )}

      {/* Header del Calendario */}
      <RepartosCalendarHeader
        monthName={monthNames[month]}
        year={year}
        onToday={() => setCurrentDate(new Date())}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      {/* Grilla del Calendario */}
      <RepartosCalendarGrid
        year={year}
        month={month}
        blanks={blanks}
        days={days}
        repartos={repartos}
        isToday={isToday}
        onSelectDay={(day) => {
          setSelectedDay(day);
          setIsModalOpen(true);
          setIsFormOpen(false);
        }}
      />

      {/* MODAL DETALLES / AGENDAR REPARTO */}
      {isMounted && isModalOpen && selectedDay !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[80dvh] md:max-h-[90vh] my-auto">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 md:pb-4 shrink-0">
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

            {/* Listado del Modal */}
            {!isFormOpen && (
              <RepartosModalList
                year={year}
                month={month}
                selectedDay={selectedDay}
                repartidoresFiltradosLogistica={repartidoresFiltradosLogistica}
                selectedRepartidorTab={selectedRepartidorTab}
                setSelectedRepartidorTab={setSelectedRepartidorTab}
                repartosDelDiaSeleccionado={repartosDelDiaSeleccionado}
                timezoneDiffText={timezoneDiffText}
                canCreateOrDelete={canCreateOrDelete}
                actionLoading={actionLoading}
                userRole={userRole}
                handleEliminarReparto={handleEliminarReparto}
                setFormHorario={setFormHorario}
                setFormRepartidor={setFormRepartidor}
                setIsFormOpen={setIsFormOpen}
                setFormError={setFormError}
                setIsModalOpen={setIsModalOpen}
              />
            )}

            {/* Formulario del Modal */}
            {isFormOpen && (
              <RepartosModalForm
                year={year}
                month={month}
                selectedDay={selectedDay}
                repartidoresFiltradosLogistica={repartidoresFiltradosLogistica}
                formDataOptions={formDataOptions}
                formRepartidor={formRepartidor}
                setFormRepartidor={setFormRepartidor}
                formVendedor={formVendedor}
                setFormVendedor={setFormVendedor}
                formStockImei={formStockImei}
                setFormStockImei={setFormStockImei}
                formHorario={formHorario}
                setFormHorario={setFormHorario}
                formError={formError}
                setFormError={setFormError}
                actionLoading={actionLoading}
                userRole={userRole}
                setIsFormOpen={setIsFormOpen}
                handleCrearReparto={handleCrearReparto}
              />
            )}

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
