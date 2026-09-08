'use client';

// React y Framework
import React, { useState, useMemo } from 'react';

// Librerías externas
import * as XLSX from 'xlsx';

// Server Actions
import {
  registrarEquipoRecibo,
  eliminarEquipoRecibo,
  actualizarEquipoRecibo,
  cargarAStockDesdeRecibo,
} from '@/app/empresa/webapp/inventario/recibo/recibo-actions';

// Modales
import BarcodeScannerModal from '@/components/empresa/BarcodeScannerModal';
import ManualImeiModal from '@/components/empresa/ManualImeiModal';
import EditReciboModal from '@/components/empresa/EditReciboModal';
import ConfirmModal from '@/components/empresa/ConfirmModal';
import AlertModal from '@/components/empresa/AlertModal';
import CargarStockReciboModal from '@/components/empresa/recibo/CargarStockReciboModal';

// Subcomponentes del módulo Recibo
import ProveedorSelector from '@/components/empresa/recibo/ProveedorSelector';
import TipoEquipoSelector from '@/components/empresa/recibo/TipoEquipoSelector';
import ReciboProductForm from '@/components/empresa/recibo/ReciboProductForm';
import ReciboTable from '@/components/empresa/recibo/ReciboTable';

// Constantes y Utilidades
import { PROVEEDORES, formatFecha } from '@/utils/recibo';

// Tipos
import type { Product } from '@/types/stock';
import type { ReciboItem, TipoEquipo } from '@/types/recibo';

// Re-exportar ReciboItem por compatibilidad con otros módulos
export type { ReciboItem };

interface RepartidorOption {
  id: string;
  nombre: string;
}

interface ZonaRepartoItem {
  id: string;
  nombre_zona: string;
  sigla?: string;
  repartidor_id: string;
}

interface ReciboClientViewProps {
  productos: Product[];
  itemsIniciales: ReciboItem[];
  userRole?: string;
  repartidores?: RepartidorOption[];
  zonasReparto?: ZonaRepartoItem[];
}

export default function ReciboClientView({
  productos,
  itemsIniciales,
  userRole = '',
  repartidores = [],
  zonasReparto = [],
}: ReciboClientViewProps) {
  // 1. Estados principales del formulario
  const [selectedProveedor, setSelectedProveedor] = useState<string>('Tijuana');
  const [selectedTipoEquipo, setSelectedTipoEquipo] = useState<TipoEquipo>('credito');
  const [selectedMarca, setSelectedMarca] = useState<string>('');
  const [selectedProductoId, setSelectedProductoId] = useState<string>('');

  // 2. Estados de modales y notificaciones
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ReciboItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<ReciboItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
  const [itemToCargar, setItemToCargar] = useState<ReciboItem | null>(null);
  const [isCargarModalOpen, setIsCargarModalOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 3. Lista reactiva de items de recibo
  const [items, setItems] = useState<ReciboItem[]>(itemsIniciales);

  // 4. Cálculos derivados (Sigla, catálogo filtrado y marcas disponibles)
  const activeSigla = useMemo(() => {
    const proveedorEncontrado = PROVEEDORES.find((proveedor) => proveedor.label === selectedProveedor);
    return proveedorEncontrado?.sigla || 'TIJ';
  }, [selectedProveedor]);

  const productosPorProveedor = useMemo(() => {
    return productos.filter((producto) => {
      const searchContent = `${producto.modelo} ${producto.marca} ${producto.color}`.toUpperCase();
      return searchContent.includes(activeSigla);
    });
  }, [productos, activeSigla]);

  const marcasDisponibles = useMemo(() => {
    const marcasUnicas = new Set<string>();
    productosPorProveedor.forEach((producto) => {
      if (producto.marca && producto.marca.trim()) {
        marcasUnicas.add(producto.marca.trim().toUpperCase());
      }
    });
    return Array.from(marcasUnicas).sort((a, b) => a.localeCompare(b));
  }, [productosPorProveedor]);

  const modelosFiltrados = useMemo(() => {
    if (!selectedMarca) return [];
    return productosPorProveedor
      .filter((producto) => producto.marca?.toUpperCase() === selectedMarca.toUpperCase())
      .sort((a, b) => a.modelo.localeCompare(b.modelo, undefined, { numeric: true }));
  }, [productosPorProveedor, selectedMarca]);

  // 5. Handlers de selección
  const handleProveedorChange = (proveedorLabel: string) => {
    setSelectedProveedor(proveedorLabel);
    setSelectedMarca('');
    setSelectedProductoId('');
  };

  const handleMarcaChange = (marcaSeleccionada: string) => {
    setSelectedMarca(marcaSeleccionada);
    setSelectedProductoId('');
  };

  // 6. Registro de IMEI (utilizado tanto por scanner como por modal manual)
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
      const productoSeleccionado = productos.find((producto) => producto.id === selectedProductoId);
      const newItem: ReciboItem = {
        ...result.item,
        productos: productoSeleccionado
          ? {
              marca: productoSeleccionado.marca,
              modelo: productoSeleccionado.modelo,
              color: productoSeleccionado.color,
              almacenamiento: productoSeleccionado.almacenamiento,
              ram: productoSeleccionado.ram,
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

  // 7. Modales de Edición y Eliminación
  const handleOpenEditModal = (item: ReciboItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (
    id: string,
    newImei: string,
    newProductoId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await actualizarEquipoRecibo(id, { imei: newImei, producto_id: newProductoId });
    if (res.error) {
      return { success: false, error: res.error };
    }

    const productoActualizado = productos.find((producto) => producto.id === newProductoId);
    setItems((prev) =>
      prev.map((itemActual) =>
        itemActual.id === id
          ? {
              ...itemActual,
              imei: newImei,
              producto_id: newProductoId,
              productos: productoActualizado
                ? {
                    marca: productoActualizado.marca,
                    modelo: productoActualizado.modelo,
                    color: productoActualizado.color,
                    almacenamiento: productoActualizado.almacenamiento,
                    ram: productoActualizado.ram,
                  }
                : itemActual.productos,
            }
          : itemActual
      )
    );

    setStatus({
      type: 'success',
      message: `Equipo con IMEI ${newImei} actualizado correctamente.`,
    });

    return { success: true };
  };

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

  // 8. Carga a Stock (Transferencia)
  const handleOpenCargarModal = (item: ReciboItem) => {
    setItemToCargar(item);
    setIsCargarModalOpen(true);
  };

  const handleConfirmCargarStock = async (
    reciboId: string,
    repartidorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await cargarAStockDesdeRecibo(reciboId, repartidorId);
    if (res.error) {
      return { success: false, error: res.error };
    }

    // Al confirmarse la carga en stock, se retira de la lista local de recibo
    setItems((prev) => prev.filter((item) => item.id !== reciboId));
    setStatus({
      type: 'success',
      message: `Equipo cargado con éxito al Stock disponible y removido de la bandeja de recibo.`,
    });
    setItemToCargar(null);
    return { success: true };
  };

  // 9. Exportación a Excel
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
      {/* Modales */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        hasSelectedProduct={Boolean(selectedProductoId)}
      />

      <ManualImeiModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleRegisterImei}
      />

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

      <AlertModal
        isOpen={Boolean(deleteErrorMsg)}
        onClose={() => setDeleteErrorMsg(null)}
        title="No se pudo eliminar"
        message={deleteErrorMsg || ''}
        type="error"
      />

      <CargarStockReciboModal
        isOpen={isCargarModalOpen}
        onClose={() => {
          setIsCargarModalOpen(false);
          setItemToCargar(null);
        }}
        item={itemToCargar}
        repartidores={repartidores}
        zonasReparto={zonasReparto}
        onConfirm={handleConfirmCargarStock}
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

        {/* Sección 1: Selección de Plaza / Proveedor */}
        <ProveedorSelector
          selectedProveedor={selectedProveedor}
          onSelectProveedor={handleProveedorChange}
        />

        {/* Sección 2: Selección de Tipo de Equipo */}
        <TipoEquipoSelector
          selectedTipoEquipo={selectedTipoEquipo}
          onSelectTipoEquipo={setSelectedTipoEquipo}
        />

        {/* Secciones 3 y 4: Selección de Marca/Modelo e Ingreso de IMEI */}
        <ReciboProductForm
          selectedMarca={selectedMarca}
          selectedProductoId={selectedProductoId}
          marcasDisponibles={marcasDisponibles}
          modelosFiltrados={modelosFiltrados}
          activeSigla={activeSigla}
          onMarcaChange={handleMarcaChange}
          onProductoChange={setSelectedProductoId}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenManualModal={() => setIsManualModalOpen(true)}
        />
      </div>

      {/* Sección 5: Grilla de Equipos Registrados y Acciones */}
      <ReciboTable
        items={items}
        isDeleting={isDeleting}
        itemToDeleteId={itemToDelete?.id}
        userRole={userRole}
        onExportExcel={handleExportExcel}
        onOpenEditModal={handleOpenEditModal}
        onSelectItemToDelete={setItemToDelete}
        onOpenCargarModal={handleOpenCargarModal}
      />
    </div>
  );
}
