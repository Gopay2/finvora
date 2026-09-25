'use client';

import React, { useState, useMemo } from 'react';
import ConfirmarPedidoModal from './ConfirmarPedidoModal';
import ResumenPedidoModal from './ResumenPedidoModal';
import ConsolidadoPedidosView from './ConsolidadoPedidosView';
import { registrarPedidoStock } from '@/app/empresa/webapp/inventario/pedidos/pedidos-actions';

import type { Product, ZonaRepartoItem } from '@/types/stock';
import type { PedidoItemInput, UltimoPedidoResumen } from '@/types/pedidos-stock';

interface VendedorOption {
  id: string;
  username: string | null;
  role: string;
}

interface PedidosClientViewProps {
  productos: Product[];
  zonasReparto: ZonaRepartoItem[];
  vendedores: VendedorOption[];
  userRole: string;
  userName: string;
}

const styles = {
  container: 'space-y-10 animate-in fade-in duration-500 pb-12',
  card: 'bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-5 sm:p-7 rounded-3xl shadow-xl space-y-6',
  label: 'text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5',
  select: 'w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 text-slate-100 rounded-xl px-4 py-3 pr-10 text-sm font-semibold focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  itemCard: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-sm',
  btnCounter: 'w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 hover:text-white flex items-center justify-center font-black text-xl transition-all cursor-pointer shadow-md select-none touch-manipulation',
  counterBadge: 'w-14 sm:w-16 h-11 sm:h-12 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl font-black text-lg text-white shadow-inner',
};

export default function PedidosClientView({
  productos,
  zonasReparto,
  vendedores,
  userRole,
  userName,
}: PedidosClientViewProps) {
  // 1. Zonas únicas configuradas
  const zonasUnicas = useMemo(() => {
    const set = new Set<string>();
    (zonasReparto || []).forEach((zonaItem) => {
      if (zonaItem.nombre_zona) set.add(zonaItem.nombre_zona);
    });
    return Array.from(set).sort();
  }, [zonasReparto]);

  // 2. Estados de selección de filtros (inician vacíos para forzar selección secuencial)
  const [selectedZona, setSelectedZona] = useState<string>('');
  const [selectedMarca, setSelectedMarca] = useState<string>('');

  // 3. Carrito global en memoria: Record<productoId, { producto, cantidad }>
  // Se preserva intacto aunque el usuario cambie de marca o de zona
  const [cart, setCart] = useState<Record<string, { producto: Product; cantidad: number }>>({});

  // 4. Estados de modales y mensajes
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ultimoResumen, setUltimoResumen] = useState<UltimoPedidoResumen | null>(null);
  const [isResumenModalOpen, setIsResumenModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 5. Determinar la sigla técnica de la zona seleccionada (ej: Monterrey -> MTY, Guadalajara -> GDL, Resto -> TIJ)
  const targetSigla = useMemo(() => {
    if (!selectedZona) return '';
    const zonaMatch = (zonasReparto || []).find((z) => z.nombre_zona === selectedZona);
    const siglaDirecta = (zonaMatch?.sigla || '').toUpperCase().trim();
    const norm = selectedZona.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (norm.includes('monterrey') || siglaDirecta === 'MTY') return 'MTY';
    if (norm.includes('guadalajara') || siglaDirecta === 'GDL') return 'GDL';
    return 'TIJ';
  }, [selectedZona, zonasReparto]);

  // 6. Productos filtrados por la sigla de la zona
  const productosPorZona = useMemo(() => {
    if (!selectedZona || !targetSigla) return productos;
    return productos.filter((p) => {
      const searchContent = `${p.modelo} ${p.marca} ${p.color}`.toUpperCase();
      return searchContent.includes(targetSigla);
    });
  }, [productos, selectedZona, targetSigla]);

  // 7. Marcas únicas disponibles para esa zona
  const marcasDisponibles = useMemo(() => {
    if (!selectedZona) return [];
    const set = new Set<string>();
    productosPorZona.forEach((p) => {
      if (p.marca && p.marca.trim()) {
        set.add(p.marca.trim().toUpperCase());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productosPorZona, selectedZona]);

  // Handler para cambio de zona: limpia la marca seleccionada para exigir reelección coherente
  const handleZonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedZona(e.target.value);
    setSelectedMarca('');
  };

  // 8. Modelos a renderizar según la marca y zona seleccionada
  const modelosFiltrados = useMemo(() => {
    if (!selectedZona || !selectedMarca) return [];
    return productosPorZona
      .filter((p) => p.marca?.toUpperCase() === selectedMarca.toUpperCase())
      .sort((a, b) => a.modelo.localeCompare(b.modelo, undefined, { numeric: true, sensitivity: 'base' }));
  }, [productosPorZona, selectedZona, selectedMarca]);

  // 9. Operaciones del Carrito en memoria
  const handleUpdateCantidad = (producto: Product, delta: number) => {
    setCart((prev) => {
      const actual = prev[producto.id]?.cantidad || 0;
      const nuevo = Math.max(0, actual + delta);

      if (nuevo === 0) {
        const copy = { ...prev };
        delete copy[producto.id];
        return copy;
      }

      return {
        ...prev,
        [producto.id]: {
          producto,
          cantidad: nuevo,
        },
      };
    });
  };

  const handleRemoveFromCart = (productoId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productoId];
      return copy;
    });
  };

  // Convertir carrito a lista plana de items
  const itemsEnPedido: PedidoItemInput[] = useMemo(() => {
    return Object.values(cart).map(({ producto, cantidad }) => ({
      producto_id: producto.id,
      marca: producto.marca,
      modelo: producto.modelo,
      almacenamiento: producto.almacenamiento,
      ram: producto.ram,
      color: producto.color,
      cantidad,
    }));
  }, [cart]);

  const totalEquiposSeleccionados = useMemo(() => {
    return itemsEnPedido.reduce((acc, it) => acc + it.cantidad, 0);
  }, [itemsEnPedido]);

  // 10. Confirmar y registrar pedido en base de datos
  const handleConfirmarPedido = async () => {
    if (itemsEnPedido.length === 0 || !selectedZona) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await registrarPedidoStock({
      zona: selectedZona,
      items: itemsEnPedido,
    });

    if (res.error) {
      setStatusMessage({ type: 'error', message: res.error });
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      return;
    }

    if (res.success && res.resumen) {
      setUltimoResumen(res.resumen);
      setCart({}); // Limpiar carrito tras éxito
      setIsConfirmModalOpen(false);
      setIsResumenModalOpen(true);
      setStatusMessage({
        type: 'success',
        message: `¡Pedido con ${res.resumen.totalEquipos} equipo(s) para ${res.resumen.zona} guardado exitosamente!`,
      });
    }

    setIsSubmitting(false);
  };

  const canViewConsolidado = ['Admin', 'Supervisor', 'Developer', 'JCI'].includes(userRole);

  return (
    <div className={styles.container}>
      {/* Mensaje de estado superior */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-300 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {statusMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="flex-1">{statusMessage.message}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── SECCIÓN 1: FORMULARIO DE SOLICITUD ────────────────────────────── */}
      <section className={styles.card}>
        <div className="border-b border-slate-800/80 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">add_shopping_cart</span>
            Solicitud de Equipos
          </h2>
        </div>

        {/* Fila de Selects: Zona | Marca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Select: Zona */}
          <div>
            <label className={styles.label}>
              <span className="material-symbols-outlined text-sm">location_on</span>
              Zona
            </label>
            <div className="relative">
              <select
                value={selectedZona}
                onChange={handleZonaChange}
                className={styles.select}
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-slate-950 text-slate-500 italic">
                  {zonasUnicas.length === 0 ? 'Sin zonas configuradas' : 'Elegir zona...'}
                </option>
                {zonasUnicas.map((z) => (
                  <option key={z} value={z} className="bg-slate-950 text-white">
                    {z.toUpperCase()}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none text-xl">
                expand_more
              </span>
            </div>
          </div>

          {/* Select: Marca (espera que se seleccione primero la zona) */}
          <div>
            <label className={styles.label}>
              <span className="material-symbols-outlined text-sm">smartphone</span>
              Marca
            </label>
            <div className="relative">
              <select
                value={selectedMarca}
                onChange={(e) => setSelectedMarca(e.target.value)}
                disabled={!selectedZona}
                className={styles.select}
                style={{ colorScheme: 'dark' }}
              >
                {!selectedZona ? (
                  <option value="" className="bg-slate-950 text-slate-500 italic">
                    Selecciona una zona primero...
                  </option>
                ) : (
                  <>
                    <option value="" className="bg-slate-950 text-slate-500 italic">
                      Elegir marca...
                    </option>
                    {marcasDisponibles.map((m) => (
                      <option key={m} value={m} className="bg-slate-950 text-white">
                        {m.toUpperCase()}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none text-xl">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Listado de Equipos con botones táctiles separados */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-bold uppercase tracking-wider text-[11px]">
              Modelos disponibles {selectedMarca ? `(${selectedMarca})` : ''}:
            </span>
            {selectedZona && selectedMarca && (
              <span className="text-[11px] text-slate-500">
                {modelosFiltrados.length} modelo(s)
              </span>
            )}
          </div>

          {!selectedZona ? (
            <div className="p-8 text-center text-slate-500 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-sm">
              <span className="material-symbols-outlined text-3xl mb-1 block opacity-30">location_on</span>
              Selecciona una zona para comenzar tu pedido.
            </div>
          ) : !selectedMarca ? (
            <div className="p-8 text-center text-slate-500 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-sm">
              <span className="material-symbols-outlined text-3xl mb-1 block opacity-30">smartphone</span>
              Selecciona una marca para ver los modelos disponibles.
            </div>
          ) : modelosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-500 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-sm">
              <span className="material-symbols-outlined text-3xl mb-1 block opacity-30">inventory_2</span>
              No hay modelos registrados para esta marca en la zona seleccionada.
            </div>
          ) : (
            <div className="space-y-2.5">
              {modelosFiltrados.map((producto) => {
                const cantidadActual = cart[producto.id]?.cantidad || 0;
                const estaSeleccionado = cantidadActual > 0;

                return (
                  <div
                    key={producto.id}
                    className={`${styles.itemCard} ${
                      estaSeleccionado ? 'border-secondary/50 bg-secondary/5' : ''
                    }`}
                  >
                    {/* Nombre y especificaciones */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100 text-sm sm:text-base">
                          {producto.modelo}
                        </span>
                        {producto.color && (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 uppercase">
                            {producto.color}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                        {producto.almacenamiento && (
                          <span className="font-semibold text-slate-300">
                            {producto.almacenamiento}
                          </span>
                        )}
                        {producto.ram && (
                          <span>• RAM {producto.ram}</span>
                        )}
                      </div>
                    </div>

                    {/* Controles táctiles separados [-] [ Cantidad ] [+] */}
                    <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto">
                      {/* Botón Disminuir (-) */}
                      <button
                        type="button"
                        onClick={() => handleUpdateCantidad(producto, -1)}
                        disabled={cantidadActual === 0}
                        className={`${styles.btnCounter} ${
                          cantidadActual === 0
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-red-500/20 hover:text-red-300'
                        }`}
                        title="Restar una unidad"
                        aria-label="Restar una unidad"
                      >
                        −
                      </button>

                      {/* Caja con la cantidad actual */}
                      <div
                        className={`${styles.counterBadge} ${
                          estaSeleccionado
                            ? 'border-secondary/80 text-secondary bg-secondary/10'
                            : 'text-slate-400'
                        }`}
                      >
                        {cantidadActual}
                      </div>

                      {/* Botón Aumentar (+) */}
                      <button
                        type="button"
                        onClick={() => handleUpdateCantidad(producto, 1)}
                        className={`${styles.btnCounter} hover:bg-secondary/20 hover:text-secondary`}
                        title="Sumar una unidad"
                        aria-label="Sumar una unidad"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botón Solicitar dentro de la tarjeta (alineado a la derecha, solo texto) */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={totalEquiposSeleccionados === 0}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-secondary text-slate-950 hover:bg-secondary/90 font-black text-sm transition-all shadow-lg shadow-secondary/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
          >
            Solicitar ({totalEquiposSeleccionados} equipos)
          </button>
        </div>
      </section>

      {/* ─── SECCIÓN 2: PANEL DE CARGOS SUPERIORES (Consolidado) ────────────── */}
      {canViewConsolidado && (
        <ConsolidadoPedidosView vendedores={vendedores} />
      )}

      {/* ─── MODAL 1: REVISIÓN Y CONFIRMACIÓN PREVIA ───────────────────────── */}
      <ConfirmarPedidoModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        zona={selectedZona}
        items={itemsEnPedido}
        onUpdateCantidad={(id, delta) => {
          const item = cart[id];
          if (item) handleUpdateCantidad(item.producto, delta);
        }}
        onRemoveItem={handleRemoveFromCart}
        onConfirm={handleConfirmarPedido}
        isSubmitting={isSubmitting}
      />

      {/* ─── MODAL 2: RESUMEN DEL ÚLTIMO PEDIDO Y EXCEL ─────────────────────── */}
      <ResumenPedidoModal
        isOpen={isResumenModalOpen}
        onClose={() => {
          setIsResumenModalOpen(false);
          setUltimoResumen(null);
        }}
        resumen={ultimoResumen}
      />
    </div>
  );
}
