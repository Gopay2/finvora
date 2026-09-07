'use client';

import React, { useState, useMemo, useTransition, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { registrarEquipoRecibo, eliminarEquipoRecibo, actualizarEquipoRecibo } from '@/app/empresa/webapp/inventario/recibo/recibo-actions';
import BarcodeScannerModal from '@/components/empresa/BarcodeScannerModal';
import ManualImeiModal from '@/components/empresa/ManualImeiModal';
import EditReciboModal from '@/components/empresa/EditReciboModal';
import ConfirmModal from '@/components/empresa/ConfirmModal';
import AlertModal from '@/components/empresa/AlertModal';
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

  // Estados de escáner, modal manual, edición y notificaciones
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ReciboItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<ReciboItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
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

  // Acción de registro de IMEI (usado por modal manual y por escáner con cámara)
  const handleRegisterImei = async (imeiToRegister: string): Promise<{ success: boolean; error?: string }> => {
    const cleanImei = imeiToRegister.trim();
    if (!cleanImei) {
      return { success: false, error: 'Debes ingresar un número de IMEI.' };
    }
    if (!selectedProveedor) {
      return { success: false, error: 'Debes seleccionar el área del proveedor.' };
    }
    if (!selectedTipoEquipo) {
      return { success: false, error: 'Debes seleccionar el tipo de equipo.' };
    }
    if (!selectedProductoId) {
      return { success: false, error: 'Debes seleccionar Marca y Modelo en el formulario antes de registrar.' };
    }

    const formData = new FormData();
    formData.append('imei', cleanImei);
    formData.append('producto_id', selectedProductoId);
    formData.append('proveedor', selectedProveedor);
    formData.append('tipo_equipo', selectedTipoEquipo);

    const result = await registrarEquipoRecibo(formData);
    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.success && result.item) {
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
      setStatus({
        type: 'success',
        message: `Equipo con IMEI ${result.item.imei} registrado con éxito en recibo.`,
      });
      return { success: true };
    }

    return { success: false, error: 'No se pudo completar el registro del equipo.' };
  };

  // Callback al detectar escaneo exitoso con la cámara
  const handleScanSuccess = async (scannedImei: string): Promise<{ success: boolean; error?: string }> => {
    const cleanImei = scannedImei.trim();
    if (!selectedProductoId) {
      return {
        success: false,
        error: 'Debes seleccionar primero Marca y Modelo en el formulario antes de registrar.',
      };
    }

    return await handleRegisterImei(cleanImei);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (item: ReciboItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Guardar cambios de edición de un equipo
  const handleSaveEdit = async (
    id: string,
    newImei: string,
    newProductoId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await actualizarEquipoRecibo(id, { imei: newImei, producto_id: newProductoId });
    if (res.error) {
      return { success: false, error: res.error };
    }

    const prodData = productos.find((p) => p.id === newProductoId);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              imei: newImei,
              producto_id: newProductoId,
              productos: prodData
                ? {
                    marca: prodData.marca,
                    modelo: prodData.modelo,
                    color: prodData.color,
                    almacenamiento: prodData.almacenamiento,
                    ram: prodData.ram,
                  }
                : it.productos,
            }
          : it
      )
    );

    setStatus({
      type: 'success',
      message: `Equipo con IMEI ${newImei} actualizado correctamente.`,
    });

    return { success: true };
  };

  // Confirmar eliminación de equipo de recibo
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const res = await eliminarEquipoRecibo(itemToDelete.id);
    if (res.error) {
      setDeleteErrorMsg(res.error);
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      setStatus({
        type: 'success',
        message: `Equipo con IMEI ${itemToDelete.imei} eliminado de la lista de recibo.`,
      });
      setItemToDelete(null);
    }

    setIsDeleting(false);
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    if (items.length === 0) {
      alert('No hay equipos registrados para exportar.');
      return;
    }

    const dataParaExcel = items.map((item) => {
      const { fecha, hora } = formatFecha(item.fecha_ingreso);
      return {
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
        hasSelectedProduct={Boolean(selectedProductoId)}
      />

      {/* Modal de ingreso manual de IMEI */}
      <ManualImeiModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleRegisterImei}
      />

      {/* Modal de edición de IMEI / Modelo */}
      <EditReciboModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        productos={productos}
        onSave={handleSaveEdit}
      />

      {/* Modal de confirmación para eliminar equipo */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => {
          if (!isDeleting) setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar?"
        message={`¿Estás seguro de que quieres eliminar de esta lista de recibo el equipo con IMEI ${itemToDelete?.imei}? Esta acción es irreversible.`}
        requiredText="confirmar"
      />

      {/* Modal de error si falla la eliminación */}
      <AlertModal
        isOpen={Boolean(deleteErrorMsg)}
        onClose={() => setDeleteErrorMsg(null)}
        title="No se pudo eliminar"
        message={deleteErrorMsg || ''}
        type="error"
      />

      <div className="space-y-8">
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
        <div className="space-y-4">
          <label className="block text-base font-semibold text-slate-200 ml-0.5">
            Selecciona el área del proveedor
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {PROVEEDORES.map((prov) => {
              const isActive = selectedProveedor === prov.label;
              return (
                <button
                  key={prov.label}
                  type="button"
                  onClick={() => handleProveedorChange(prov.label)}
                  className={`px-3.5 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-secondary border-secondary text-slate-950'
                      : 'bg-[#0a1120] border-[#16233a] text-slate-300 hover:border-slate-700 hover:text-white hover:bg-[#0f192d]'
                  }`}
                >
                  {prov.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 2: Tipo de equipos */}
        <div className="space-y-4">
          <label className="block text-base font-semibold text-slate-200 ml-0.5">
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

        {/* SECCIÓN 3: Producto (Marca y Modelo en cascada) */}
        <div className="space-y-4">
          <label className="block text-base font-semibold text-slate-200 ml-0.5">
            Producto
          </label>
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

            {/* Modelo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">
                Modelo
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
        </div>

        {/* SECCIÓN 4: IMEI */}
        <div className="space-y-4">
          <label className="block text-base font-semibold text-slate-200 ml-0.5">
            IMEI
          </label>

          {/* 2 Botones en formato cuadrado y más altos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-3xl bg-[#060b18] hover:bg-[#0c1424] border border-[#16233a] hover:border-secondary/60 transition-all cursor-pointer group shadow-xl shadow-black/20 h-[140px]"
            >
              <span 
                className="material-symbols-outlined text-slate-300 group-hover:text-secondary group-hover:scale-110 transition-all select-none leading-none"
                style={{ fontSize: '58px', fontVariationSettings: "'opsz' 48" }}
              >
                barcode_scanner
              </span>
              <span className="text-base font-bold text-white group-hover:text-secondary transition-colors">
                Escanear
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-3xl bg-[#060b18] hover:bg-[#0c1424] border border-[#16233a] hover:border-secondary/60 transition-all cursor-pointer group shadow-xl shadow-black/20 h-[140px]"
            >
              <span
                className="material-symbols-outlined text-slate-300 group-hover:text-secondary group-hover:scale-110 transition-all select-none leading-none"
                style={{ fontSize: '58px', fontVariationSettings: "'opsz' 48" }}
              >
                keyboard
              </span>
              <span className="text-base font-bold text-white group-hover:text-secondary transition-colors">
                Ingreso manual
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 5: Equipos registrados (Tabla) */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white tracking-wide">
              Equipos registrados
            </h3>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#0c1424] text-secondary border border-[#1c2a44]">
              {items.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={items.length === 0}
            className={`flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl transition-all ${
              items.length === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-slate-700 hover:text-white cursor-pointer'
            }`}
            title="Descargar Excel"
          >
            <span className="material-symbols-outlined text-base md:text-xl shrink-0">download</span>
          </button>
        </div>

        {/* Tabla contenedora */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[32%] md:w-[26%]" />
                <col className="w-[24%] md:w-[22%]" />
                <col className="w-[14%] md:w-[15%]" />
                <col className="w-[18%] md:w-[21%]" />
                <col className="w-[12%] md:w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-800 bg-[#091122]/70 text-slate-400 uppercase tracking-wider font-semibold text-xs">
                  <th className="py-4 pl-8 md:pl-11 pr-3 text-left">PRODUCTO</th>
                  <th className="py-4 px-2 sm:px-3 text-center">IMEI</th>
                  <th className="py-4 px-3 text-center">
                    <span className="inline-block -translate-x-3 sm:-translate-x-4">COLOR</span>
                  </th>
                  <th className="py-4 px-3 text-center">FECHA INGRESO</th>
                  <th className="py-4 pr-5 md:pr-6 pl-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500 italic text-sm">
                      No hay equipos registrados en esta lista de recibo aún.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const { fecha, hora } = formatFecha(item.fecha_ingreso);
                    const colorHex = getColorHex(item.productos?.color || '');
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/20 transition-colors group border-b border-slate-800/40"
                      >
                        <td className="py-4 pl-5 md:pl-6 pr-3">
                          <div className="flex items-start gap-3">
                            <div className="pt-1 text-slate-500 shrink-0 select-none">
                              <span className="material-symbols-outlined text-[20px] leading-none">
                                smartphone
                              </span>
                            </div>
                            <div className="flex flex-col items-start gap-1 min-w-0 max-w-sm">
                              <span className="font-bold text-white text-sm">
                                {item.productos
                                  ? `${item.productos.marca} ${item.productos.modelo}`
                                  : 'Cargando modelo...'}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.productos?.ram && (
                                  <span className="text-[11px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">
                                    RAM {item.productos.ram}
                                  </span>
                                )}
                                {item.productos?.almacenamiento && (
                                  <span className="text-[11px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">
                                    ALM {item.productos.almacenamiento}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 sm:px-3 text-center whitespace-nowrap">
                          <span className="font-mono bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-secondary text-xs font-semibold inline-flex items-center justify-center shadow-sm tracking-wider">
                            {item.imei}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm"
                              style={{ backgroundColor: colorHex }}
                            />
                            <span className="text-slate-200 font-semibold text-sm">
                              {item.productos?.color || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center whitespace-nowrap" suppressHydrationWarning>
                          <div className="flex flex-col items-center justify-center leading-tight">
                            <span className="text-sm font-semibold text-slate-100">{fecha}</span>
                            <span className="text-[11px] font-mono text-slate-400">{hora}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-5 md:pr-6 pl-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="Agregar"
                              className="text-emerald-400 hover:text-emerald-300 transition-colors p-2 rounded-lg hover:bg-emerald-500/15 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              title="Editar equipo"
                              className="text-slate-400 hover:text-secondary transition-colors p-2 rounded-lg hover:bg-secondary/10 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              disabled={isDeleting && itemToDelete?.id === item.id}
                              title="Eliminar de recibo"
                              className={`text-red-500/50 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10 cursor-pointer ${
                                isDeleting && itemToDelete?.id === item.id ? 'opacity-30' : ''
                              }`}
                            >
                              <span className="material-symbols-outlined text-xl">
                                {isDeleting && itemToDelete?.id === item.id ? 'sync' : 'delete'}
                              </span>
                            </button>
                          </div>
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
