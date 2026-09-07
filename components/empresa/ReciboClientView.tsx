'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { registrarEquipoRecibo, eliminarEquipoRecibo } from '@/app/empresa/webapp/inventario/recibo/recibo-actions';
import BarcodeScannerModal from '@/components/empresa/BarcodeScannerModal';
import SubmitButton from '@/components/empresa/SubmitButton';
import type { Product } from '@/types/stock';

export interface ReciboItem {
  id: string;
  imei: string;
  producto_id: string;
  proveedor: string;
  tipo_equipo: string;
  ubicacion_default: string;
  estado: string;
  fecha_ingreso: string;
  creado_por_username?: string;
  productos?: {
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
    ram: string;
  } | null;
}

interface ReciboClientViewProps {
  productos: Product[];
  itemsIniciales: ReciboItem[];
}

const PROVEEDORES = [
  { label: 'Tijuana', sigla: 'TIJ' },
  { label: 'Guadalajara', sigla: 'GDL' },
  { label: 'Monterrey', sigla: 'MTY' },
];

function getColorHex(colorName: string): string {
  const norm = (colorName || '').toLowerCase().trim();
  if (norm.includes('negro') || norm.includes('black') || norm.includes('midnight') || norm.includes('oscuro')) return '#1e293b';
  if (norm.includes('blanco') || norm.includes('white') || norm.includes('starlight') || norm.includes('claro')) return '#f8fafc';
  if (norm.includes('azul') || norm.includes('blue')) return '#3b82f6';
  if (norm.includes('verde') || norm.includes('green')) return '#84cc16';
  if (norm.includes('plata') || norm.includes('silver') || norm.includes('gris') || norm.includes('gray')) return '#cbd5e1';
  if (norm.includes('oro') || norm.includes('gold') || norm.includes('dorado')) return '#eab308';
  if (norm.includes('rojo') || norm.includes('red')) return '#ef4444';
  if (norm.includes('rosa') || norm.includes('pink')) return '#ec4899';
  if (norm.includes('morado') || norm.includes('violeta') || norm.includes('purple')) return '#a855f7';
  return '#64748b';
}

function formatFecha(isoString: string): { fecha: string; hora: string } {
  try {
    const d = new Date(isoString);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const seg = String(d.getSeconds()).padStart(2, '0');
    return {
      fecha: `${dia}/${mes}/${anio}`,
      hora: `${hora}:${min}:${seg}`,
    };
  } catch {
    return { fecha: isoString, hora: '' };
  }
}

export default function ReciboClientView({
  productos,
  itemsIniciales,
}: ReciboClientViewProps) {
  // Estados principales del formulario
  const [selectedProveedor, setSelectedProveedor] = useState<string>('Tijuana');
  const [selectedTipoEquipo, setSelectedTipoEquipo] = useState<'credito' | 'concesion'>('credito');
  const [selectedMarca, setSelectedMarca] = useState<string>('');
  const [selectedProductoId, setSelectedProductoId] = useState<string>('');
  const [imeiInput, setImeiInput] = useState<string>('');

  // Estados de escáner y notificaciones
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lista local de items para respuesta reactiva inmediata
  const [items, setItems] = useState<ReciboItem[]>(itemsIniciales);
  const [isPending, startTransition] = useTransition();

  // Sigla activa según el proveedor seleccionado
  const activeSigla = useMemo(() => {
    const p = PROVEEDORES.find((item) => item.label === selectedProveedor);
    return p?.sigla || 'TIJ';
  }, [selectedProveedor]);

  // Productos filtrados por la sigla del proveedor
  const productosPorProveedor = useMemo(() => {
    return productos.filter((p) => {
      const searchContent = `${p.modelo} ${p.marca} ${p.color}`.toUpperCase();
      return searchContent.includes(activeSigla);
    });
  }, [productos, activeSigla]);

  // Marcas únicas disponibles para este proveedor
  const marcasDisponibles = useMemo(() => {
    const set = new Set<string>();
    productosPorProveedor.forEach((prod) => {
      if (prod.marca && prod.marca.trim()) {
        set.add(prod.marca.trim().toUpperCase());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productosPorProveedor]);

  // Modelos filtrados por la marca elegida
  const modelosFiltrados = useMemo(() => {
    if (!selectedMarca) return [];
    return productosPorProveedor
      .filter((p) => p.marca?.toUpperCase() === selectedMarca.toUpperCase())
      .sort((a, b) => a.modelo.localeCompare(b.modelo, undefined, { numeric: true }));
  }, [productosPorProveedor, selectedMarca]);

  // Cambiar proveedor
  const handleProveedorChange = (proveedorLabel: string) => {
    setSelectedProveedor(proveedorLabel);
    setSelectedMarca('');
    setSelectedProductoId('');
  };

  // Cambiar marca
  const handleMarcaChange = (marca: string) => {
    setSelectedMarca(marca);
    setSelectedProductoId('');
  };

  // Callback al detectar escaneo exitoso
  const handleScanSuccess = (scannedImei: string) => {
    setImeiInput(scannedImei);
    setStatus({
      type: 'success',
      message: `Código escaneado con éxito: ${scannedImei}`,
    });
  };

  // Acción de registro
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    const formData = new FormData();
    formData.append('imei', imeiInput);
    formData.append('producto_id', selectedProductoId);
    formData.append('proveedor', selectedProveedor);
    formData.append('tipo_equipo', selectedTipoEquipo);

    startTransition(async () => {
      const result = await registrarEquipoRecibo(formData);
      if (result.error) {
        setStatus({ type: 'error', message: result.error });
      } else if (result.success && result.item) {
        // Encontrar datos del producto para la vista inmediata
        const prodData = productos.find((p) => p.id === selectedProductoId);
        const newItem: ReciboItem = {
          ...result.item,
          productos: prodData
            ? {
                marca: prodData.marca,
                modelo: prodData.modelo,
                color: prodData.color,
                almacenamiento: prodData.almacenamiento,
                ram: prodData.ram,
              }
            : null,
        };
        setItems((prev) => [newItem, ...prev]);
        setImeiInput('');
        setStatus({
          type: 'success',
          message: `Equipo con IMEI ${result.item.imei} registrado con éxito en recibo.`,
        });
      }
    });
  };

  // Eliminar un item del listado de recibo
  const handleDeleteItem = async (id: string, imei: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el IMEI ${imei} de esta lista de recibo?`)) {
      return;
    }

    startTransition(async () => {
      const res = await eliminarEquipoRecibo(id);
      if (res.error) {
        alert(res.error);
      } else {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    });
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    if (items.length === 0) {
      alert('No hay equipos escaneados para exportar.');
      return;
    }

    const dataParaExcel = items.map((item, idx) => {
      const { fecha, hora } = formatFecha(item.fecha_ingreso);
      return {
        '#': idx + 1,
        IMEI: item.imei,
        Proveedor: item.proveedor,
        Marca: item.productos?.marca || 'N/A',
        Modelo: item.productos?.modelo || 'N/A',
        Color: item.productos?.color || 'N/A',
        Almacenamiento: item.productos?.almacenamiento || 'N/A',
        RAM: item.productos?.ram || 'N/A',
        'Tipo de Equipo': item.tipo_equipo === 'concesion' ? 'Concesión' : 'Crédito',
        'Fecha Ingreso': `${fecha} ${hora}`,
        Estado: item.estado,
        'Registrado Por': item.creado_por_username || 'N/A',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipos Recibo');

    const hoy = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Finvora_Recibo_Equipos_${selectedProveedor}_${hoy}.xlsx`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Modal de escáner con cámara */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <form onSubmit={handleSubmit} className="space-y-8" suppressHydrationWarning autoComplete="off">
        {/* Notificaciones de error o éxito */}
        {status && (
          <div
            className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 animate-in fade-in duration-300 ${
              status.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            <span className="material-symbols-outlined">
              {status.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{status.message}</span>
          </div>
        )}

        {/* SECCIÓN 1: Selecciona el área del proveedor */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300 ml-1">
            Selecciona el área del proveedor
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {PROVEEDORES.map((prov) => {
              const isActive = selectedProveedor === prov.label;
              return (
                <button
                  key={prov.label}
                  type="button"
                  onClick={() => handleProveedorChange(prov.label)}
                  className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-secondary text-slate-950 font-bold shadow-lg shadow-secondary/25 ring-2 ring-secondary/40'
                      : 'bg-[#0a1120] text-slate-300 border border-[#16233a] hover:border-slate-700 hover:text-white hover:bg-[#0f192d]'
                  }`}
                >
                  {prov.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 2: Tipo de equipos */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300 ml-1">
            Tipo de equipos
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tarjeta 1: Equipos a crédito */}
            <div
              onClick={() => setSelectedTipoEquipo('credito')}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                selectedTipoEquipo === 'credito'
                  ? 'bg-secondary/15 border-secondary/70 shadow-lg shadow-secondary/10'
                  : 'bg-[#060b18] border-[#16233a] hover:border-slate-700 hover:bg-[#0a1120]'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedTipoEquipo === 'credito'
                    ? 'bg-secondary text-slate-950 shadow-md'
                    : 'bg-[#0c1424] text-slate-400 border border-[#1c2a44]'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">smartphone</span>
              </div>
              <div className="space-y-1">
                <h4
                  className={`text-base font-bold ${
                    selectedTipoEquipo === 'credito' ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  Equipos a crédito
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Equipos destinados a ventas a crédito.
                </p>
              </div>
            </div>

            {/* Tarjeta 2: Equipos concesión */}
            <div
              onClick={() => setSelectedTipoEquipo('concesion')}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                selectedTipoEquipo === 'concesion'
                  ? 'bg-secondary/15 border-secondary/70 shadow-lg shadow-secondary/10'
                  : 'bg-[#060b18] border-[#16233a] hover:border-slate-700 hover:bg-[#0a1120]'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedTipoEquipo === 'concesion'
                    ? 'bg-secondary text-slate-950 shadow-md'
                    : 'bg-[#0c1424] text-slate-400 border border-[#1c2a44]'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">smartphone</span>
              </div>
              <div className="space-y-1">
                <h4
                  className={`text-base font-bold ${
                    selectedTipoEquipo === 'concesion' ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  Equipos concesión
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Equipos para ventas de concesión.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Selección de Producto (Marca y Modelo en cascada) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#060b18] border border-[#16233a] p-6 rounded-3xl">
          {/* Marca */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Marca
            </label>
            <div className="relative">
              <select
                value={selectedMarca}
                onChange={(e) => handleMarcaChange(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                {marcasDisponibles.length === 0 ? (
                  <option value="" className="bg-slate-950 text-slate-500 italic">
                    Sin productos con sigla ({activeSigla})
                  </option>
                ) : (
                  <>
                    <option value="" className="bg-slate-950 text-slate-500 italic">
                      Elegir marca...
                    </option>
                    {marcasDisponibles.map((marca) => (
                      <option key={marca} value={marca} className="bg-slate-950 text-white">
                        {marca}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Seleccionar Producto */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Seleccionar Producto
            </label>
            <div className="relative">
              <select
                name="producto_id"
                required
                value={selectedProductoId}
                onChange={(e) => setSelectedProductoId(e.target.value)}
                disabled={!selectedMarca}
                suppressHydrationWarning
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ colorScheme: 'dark' }}
              >
                {!selectedMarca ? (
                  <option value="" className="bg-slate-950 text-slate-500 italic">
                    Selecciona una marca primero...
                  </option>
                ) : (
                  <>
                    <option value="" className="bg-slate-950 text-white">
                      Elegir modelo del catálogo...
                    </option>
                    {modelosFiltrados.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                        {p.modelo} - {p.color} ({p.almacenamiento} / {p.ram})
                      </option>
                    ))}
                  </>
                )}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-base">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Escáner código de barras e IMEI */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Escáner código de barras
            </label>
            <p className="text-xs text-slate-400 ml-1">
              Escanea el código de barras o IMEI del equipo con la cámara o ingrésalo manualmente.
            </p>
          </div>

          {/* Visor interactivo para abrir escáner */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full bg-[#060b18] hover:bg-[#0b1324] border-2 border-dashed border-[#1e2d4a] hover:border-secondary/60 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-3 transition-all duration-200 group cursor-pointer shadow-xl shadow-black/20"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0c1424] border border-[#1e2a44] flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">barcode_scanner</span>
            </div>
            <div className="space-y-1">
              <h5 className="text-base font-bold text-white group-hover:text-secondary transition-colors">
                Listo para escanear
              </h5>
              <p className="text-xs text-slate-400">
                Apunta la cámara al código de barras del equipo.
              </p>
            </div>
          </button>

          {/* Campo IMEI manual o autocompletado */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                name="imei"
                value={imeiInput}
                onChange={(e) => setImeiInput(e.target.value.trim())}
                placeholder="Ingresar o escanear IMEI (15 dígitos)"
                required
                autoComplete="off"
                data-lpignore="true"
                suppressHydrationWarning
                className="w-full bg-[#060b18] border border-[#16233a] rounded-2xl px-5 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-secondary transition-all font-mono tracking-wider"
              />
            </div>

            <SubmitButton
              label="Registrar"
              loadingLabel="Guardando..."
            />
          </div>
        </div>
      </form>

      {/* SECCIÓN 5: Equipos escaneados (Tabla) */}
      <div className="space-y-4 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white tracking-wide">
              Equipos escaneados
            </h3>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#0c1424] text-secondary border border-[#1c2a44]">
              {items.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md hover:text-white"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Descargar Excel
          </button>
        </div>

        {/* Tabla contenedora */}
        <div className="bg-[#060b18] border border-[#16233a] rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#16233a] bg-[#091122] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-4 w-12 text-center">#</th>
                  <th className="py-4 px-4">IMEI</th>
                  <th className="py-4 px-4">Modelo</th>
                  <th className="py-4 px-4">Color</th>
                  <th className="py-4 px-4">Tipo</th>
                  <th className="py-4 px-4">Fecha Ingreso</th>
                  <th className="py-4 px-4 text-center w-16">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#121c2e]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No hay equipos registrados en esta lista de recibo aún.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const { fecha, hora } = formatFecha(item.fecha_ingreso);
                    const colorHex = getColorHex(item.productos?.color || '');
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#0b1426] transition-colors group"
                      >
                        <td className="py-4 px-4 text-center text-slate-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="py-4 px-4 font-mono font-medium text-slate-200">
                          {item.imei}
                        </td>
                        <td className="py-4 px-4 text-white font-medium">
                          {item.productos
                            ? `${item.productos.marca} ${item.productos.modelo}`
                            : 'Cargando modelo...'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                              style={{ backgroundColor: colorHex }}
                            />
                            <span className="text-slate-300">
                              {item.productos?.color || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.tipo_equipo === 'concesion'
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                : 'bg-secondary/10 text-secondary border border-secondary/20'
                            }`}
                          >
                            {item.tipo_equipo === 'concesion' ? 'Concesión' : 'Crédito'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-mono text-[11px]" suppressHydrationWarning>
                          <div>{fecha}</div>
                          <div className="text-slate-500 text-[10px]">{hora}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.imei)}
                            title="Eliminar de recibo"
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
