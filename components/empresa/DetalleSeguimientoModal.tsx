'use client';

import React, { useState } from 'react';
import { 
  SeguimientoPagoRecord, 
  EstadoCuota, 
  updateEstadoSemana 
} from '@/app/empresa/webapp/seguimiento-pagos/seguimiento-actions';
import { 
  addWeeksToDate, 
  formatFechaLegible, 
  formatFechaDDMMYYYY,
  calculateSemanasTranscurridas 
} from '@/utils/date-tijuana';

interface DetalleSeguimientoModalProps {
  registro: SeguimientoPagoRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: (semanaKey: string, nuevoEstado: EstadoCuota) => void;
}

import { ESTADOS_DISPONIBLES } from '@/constants/seguimiento-estados';

export function DetalleSeguimientoModal({
  registro,
  isOpen,
  onClose,
  onRefresh
}: DetalleSeguimientoModalProps) {
  const [updatingSemana, setUpdatingSemana] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !registro) return null;

  const totalSemanas = registro.plazos || 0;
  const deudaInicial = Math.max(0, registro.precio_total - registro.pago_inicial);
  const semanaActualIndice = calculateSemanasTranscurridas(registro.fecha_proximo_pago, totalSemanas);

  const handleEstadoChange = async (semanaNum: number, nuevoEstado: EstadoCuota) => {
    const semanaKey = `semana_${semanaNum}`;
    setUpdatingSemana(semanaKey);

    const result = await updateEstadoSemana(registro.id, semanaKey, nuevoEstado);
    setUpdatingSemana(null);

    if (result.success) {
      onRefresh(semanaKey, nuevoEstado);
    } else {
      alert(result.error || 'Error al actualizar el estado de la semana');
    }
  };

  // Generar filas de cuotas proyectadas
  const filasCuotas = [];
  if (registro.fecha_proximo_pago && totalSemanas > 0) {
    for (let i = 1; i <= totalSemanas; i++) {
      const semanaKey = `semana_${i}`;
      const fechaCuota = addWeeksToDate(registro.fecha_proximo_pago, i - 1);
      const saldoRestanteProyectado = Math.max(0, deudaInicial - (i * registro.pago_semanal));
      const estadoActual: EstadoCuota = (registro.estados_semanales?.[semanaKey] as EstadoCuota) || 'En revisión';
      const esSemanaActual = i === semanaActualIndice;

      filasCuotas.push({
        numeroSemana: i,
        semanaKey,
        fechaCuota,
        saldoRestanteProyectado,
        estadoActual,
        esSemanaActual
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto sm:overflow-hidden animate-in fade-in duration-200 font-[family-name:var(--font-outfit)]">
      <div 
        className="relative my-auto w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 h-auto sm:max-h-[78vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative px-6 pt-5 pb-1 bg-slate-900/50">
          <div className="pr-12">
            <div className="inline-block">
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                {registro.nombre_cliente}
              </h2>
              <div className="border-b border-slate-800/60 mt-2" />
            </div>
            <div className="text-xs mt-2.5 space-y-1">
              <p className="font-semibold text-slate-100">
                {registro.celular || 'No registrado'} {registro.color_celular ? `(${registro.color_celular})` : ''}
              </p>
              <p className="text-slate-300">
                IMEI: {registro.imei || 'Sin registrar'}
              </p>
              <p className="text-slate-300">
                Teléfono: {registro.numero_telefono ? (
                  <a
                    href={`https://wa.me/${registro.numero_telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    {registro.numero_telefono}
                  </a>
                ) : 'Sin registrar'}
              </p>
              <p className="text-slate-300">
                Tag: {registro.tag || 'Sin tag'}
              </p>
              <p className="text-slate-300">
                Vendedor: {registro.vendedor?.username || 'Sin asignar'}
              </p>
              <p className="text-slate-300">
                Repartidor: {registro.repartidor?.nombre || 'Sin asignar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div 
          className="px-6 pt-3 pb-6 space-y-6 overflow-y-visible sm:overflow-y-auto sm:flex-1 custom-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Tarjetas Informativas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block mb-1">Precio Total</span>
              <span className="text-base font-bold text-emerald-400">${registro.precio_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block mb-1">Pago Inicial</span>
              <span className="text-base font-bold text-sky-400">${registro.pago_inicial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block mb-1">Deuda Inicial</span>
              <span className="text-base font-bold text-amber-400">${deudaInicial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block mb-1">Pago Semanal</span>
              <span className="text-base font-bold text-indigo-400">${registro.pago_semanal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block mb-1">Plazos</span>
              <span className="text-base font-bold text-purple-400">{registro.plazos ? `${registro.plazos} semanas` : 'Sin plazo'}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block mb-1">Próximo Pago</span>
              <span className="text-base font-bold text-slate-200 block truncate">{registro.fecha_proximo_pago ? formatFechaDDMMYYYY(registro.fecha_proximo_pago) : 'Sin fecha'}</span>
            </div>
          </div>

          {/* Advertencia si faltan datos */}
          {(!registro.fecha_proximo_pago || !totalSemanas) && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center space-x-3 text-amber-300">
              <span className="text-xl">⚠️</span>
              <div className="text-sm">
                <p className="font-semibold">Datos incompletos de cuotas</p>
                <p className="text-xs text-amber-300/80">Este registro no cuenta con la fecha de próximo pago o plazos asignados. Puedes completarlos usando el botón de edición.</p>
              </div>
            </div>
          )}

          {/* Tabla de Evolución de Cuotas Semanales */}
          {filasCuotas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  Evolución Semanal de Pagos
                </h3>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/80 text-[10px] md:text-xs text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold whitespace-nowrap">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-[15%] sm:w-[20%] text-center">Semana</th>
                        <th className="px-4 py-3 font-semibold w-[25%] sm:w-[26%] text-center">Próximo Pago</th>
                        <th className="px-4 py-3 font-semibold w-[30%] sm:w-[27%] text-center">Saldo Restante</th>
                        <th className="px-4 py-3 font-semibold w-[30%] sm:w-[27%] text-center">Estado Semana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filasCuotas.map((row) => {
                        const estadoConfig = ESTADOS_DISPONIBLES.find(e => e.value === row.estadoActual) || ESTADOS_DISPONIBLES[0];
                        const isUpdating = updatingSemana === row.semanaKey;

                        return (
                          <tr 
                            key={row.semanaKey}
                            className={`transition-colors ${
                              row.esSemanaActual 
                                ? 'bg-indigo-950/80 text-indigo-100 font-bold border-l-4 border-l-indigo-400 ring-1 ring-inset ring-indigo-500/40 hover:bg-indigo-900/70' 
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-200 text-center">
                              {row.numeroSemana}
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-center text-xs sm:text-sm">
                              {formatFechaDDMMYYYY(row.fechaCuota)}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-400 text-center text-xs sm:text-sm">
                              ${row.saldoRestanteProyectado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="relative inline-flex flex-col items-center">
                                <div className="relative flex items-center justify-center">
                                  <select
                                    value={row.estadoActual}
                                    disabled={isUpdating}
                                    onChange={(e) => handleEstadoChange(row.numeroSemana, e.target.value as EstadoCuota)}
                                    className={`appearance-none cursor-pointer rounded-lg text-[10px] font-semibold uppercase border transition-all outline-none m-0 p-0 h-6 min-w-[110px] text-center ${estadoConfig.bg} ${estadoConfig.text} ${estadoConfig.border} hover:brightness-110 disabled:opacity-50`}
                                    style={{ 
                                      colorScheme: 'dark',
                                      textAlignLast: 'center',
                                      paddingLeft: '0',
                                      paddingRight: '0'
                                    }}
                                  >
                                    {ESTADOS_DISPONIBLES.map(st => (
                                      <option key={st.value} value={st.value} className="bg-slate-950 text-white uppercase font-bold">
                                        {st.label}
                                      </option>
                                    ))}
                                  </select>
                                  {isUpdating && (
                                    <span className="absolute -left-6 animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full" />
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
