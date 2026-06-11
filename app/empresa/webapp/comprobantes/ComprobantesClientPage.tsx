'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { submitComprobante, getComprobantes, eliminarComprobante, ComprobanteRecord } from "./comprobantes-actions";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";
import JSZip from "jszip";

interface OptionItem {
  id: string;
  display: string;
}

interface ComprobantesClientPageProps {
  vendedores: OptionItem[];
  repartidores: OptionItem[];
  comprobantesList: ComprobanteRecord[];
  showTable: boolean;
}

const styles = {
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-6",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  inputGroup: "space-y-2",
  inputGroupFull: "space-y-2 md:col-span-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pl-8",
  relativeInputContainer: "relative flex items-center",
  prefix: "absolute left-4 text-slate-400 pointer-events-none",
  button: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer flex items-center justify-center gap-2",
  buttonDisabled: "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-not-allowed flex items-center justify-center gap-2 opacity-70",
  statusSuccess: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 bg-green-500/10 text-green-400 border border-green-500/20",
  statusError: "p-4 rounded-xl text-sm font-medium flex items-center gap-3 bg-red-500/10 text-red-400 border border-red-500/20",
  tableContainer: "bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl mt-8",
  tableWrapper: "overflow-x-auto",
  table: "w-full border-collapse text-center text-sm",
  thead: "bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-xs tracking-wider",
  th: "px-6 py-4 text-center",
  tr: "border-b border-slate-800/50 hover:bg-slate-900/20 transition-colors",
  td: "px-6 py-4 text-slate-300 font-medium text-center",
  badge: "px-2 py-1 rounded bg-slate-800 text-xs text-slate-400 font-bold border border-slate-700",
  linkBtn: "text-secondary hover:underline inline-flex items-center gap-1 cursor-pointer font-bold"
};

export default function ComprobantesClientPage({
  vendedores,
  repartidores,
  comprobantesList,
  showTable
}: ComprobantesClientPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Estados para filtros
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Estado local para la lista de comprobantes
  const [list, setList] = useState<ComprobanteRecord[]>(comprobantesList);
  
  useEffect(() => {
    setList(comprobantesList);
  }, [comprobantesList]);

  // Estados para eliminación de comprobantes
  const [deletingItem, setDeletingItem] = useState<ComprobanteRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para descarga masiva de archivos
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");

  // Estados para autocompletado de vendedores
  const [vendedorSearch, setVendedorSearch] = useState("");
  const [selectedVendedor, setSelectedVendedor] = useState<OptionItem | null>(null);
  const [showVendedorSuggestions, setShowVendedorSuggestions] = useState(false);
  const vendedorSuggestionsRef = useRef<HTMLDivElement>(null);

  // Ref para mantener el valor más reciente y evitar closures obsoletos en el timeout del Blur
  const selectedVendedorRef = useRef<OptionItem | null>(null);
  selectedVendedorRef.current = selectedVendedor;

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (vendedorSuggestionsRef.current && !vendedorSuggestionsRef.current.contains(event.target as Node)) {
        setShowVendedorSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredVendedores = useMemo(() => {
    if (!vendedorSearch) return vendedores;
    return vendedores.filter((v) =>
      v.display.toLowerCase().includes(vendedorSearch.toLowerCase())
    );
  }, [vendedores, vendedorSearch]);
  
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    if (!selectedVendedor) {
      setStatus({ type: 'error', message: 'Por favor, selecciona un vendedor válido de la lista sugerida.' });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const res = await submitComprobante(formData);

    if (res.success) {
      setStatus({ type: 'success', message: '¡Comprobante registrado y cargado exitosamente!' });
      formRef.current?.reset();
      setSelectedFileName("");
      setVendedorSearch("");
      setSelectedVendedor(null);
      
      // Obtener la lista actualizada de forma instantánea sin refrescar página completa
      if (showTable) {
        const listRes = await getComprobantes();
        if (listRes.success && listRes.data) {
          setList(listRes.data);
        }
      }
      
      router.refresh();
    } else {
      setStatus({ type: 'error', message: res.error || 'Error al procesar el comprobante.' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    setStatus(null);

    const res = await eliminarComprobante(deletingItem.id);
    if (res.success) {
      setStatus({ type: 'success', message: '¡Comprobante eliminado exitosamente!' });
      // Remover de la lista local
      setList(prev => prev.filter(item => item.id !== deletingItem.id));
      router.refresh();
    } else {
      setStatus({ type: 'error', message: res.error || 'Error al eliminar el comprobante.' });
    }

    setIsDeleting(false);
    setDeletingItem(null);
  };

  // Filtrado en memoria por rango de fechas (comparando en la zona horaria de Tijuana YYYY-MM-DD)
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const tijuanaDateStr = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(item.created_at)); // Retorna "YYYY-MM-DD"

      if (dateFrom && tijuanaDateStr < dateFrom) return false;
      if (dateTo && tijuanaDateStr > dateTo) return false;
      return true;
    });
  }, [list, dateFrom, dateTo]);

  // Descarga en lote empaquetada en un solo archivo ZIP para soportar dispositivos móviles
  const handleDownloadAllFiles = async () => {
    if (filteredList.length === 0) return;
    setIsDownloading(true);
    const zip = new JSZip();

    for (let i = 0; i < filteredList.length; i++) {
      const item = filteredList[i];
      const url = item.comprobante_url;
      setDownloadProgress(`Descargando ${i + 1} de ${filteredList.length}...`);

      try {
        const response = await fetch(url);
        const blob = await response.blob();

        const ext = url.split('.').pop()?.split('?')[0] || 'bin';
        const vendorName = item.vendedor?.username || 'vendedor';
        const formattedDate = new Intl.DateTimeFormat('es-MX', {
          timeZone: 'America/Tijuana',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(new Date(item.created_at)).replace(/[/:\s,]/g, '_');

        const fileName = `Comprobante_${vendorName}_${formattedDate}.${ext}`;
        zip.file(fileName, blob);
      } catch (err) {
        console.error("Error al agregar archivo al ZIP:", url, err);
      }
    }

    setDownloadProgress("Generando archivo ZIP...");
    try {
      const zipContent = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipContent);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Comprobantes_Finvora_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error al generar o descargar el ZIP:", err);
    }

    setIsDownloading(false);
    setDownloadProgress("");
  };

  const formatTijuanaDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date(dateStr));
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(val);
  };

  return (
    <div className="space-y-8">
      <form ref={formRef} className={styles.formCard} onSubmit={handleSubmit} suppressHydrationWarning>
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-100">Formulario de Comprobante</h3>
          <p className="text-xs text-slate-400 mt-1">Completa los datos para registrar la entrega y el comprobante.</p>
        </div>

        {status && (
          <div className={status.type === 'success' ? styles.statusSuccess : styles.statusError}>
            <span className="material-symbols-outlined">
              {status.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{status.message}</span>
          </div>
        )}

        <div className={styles.formGrid}>
          {/* SELECTOR DE VENDEDOR AUTOCOMPLETE */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Vendedor</label>
            <div className="relative w-full" ref={vendedorSuggestionsRef}>
              <input
                type="text"
                placeholder="Escribe para buscar vendedor..."
                value={vendedorSearch}
                onChange={(e) => {
                  setVendedorSearch(e.target.value);
                  setSelectedVendedor(null);
                  setShowVendedorSuggestions(true);
                }}
                onFocus={() => setShowVendedorSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => {
                    if (!selectedVendedorRef.current) {
                      setVendedorSearch("");
                    } else {
                      setVendedorSearch(selectedVendedorRef.current.display);
                    }
                    setShowVendedorSuggestions(false);
                  }, 200);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all"
                required
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                suppressHydrationWarning
              />
              <input
                type="hidden"
                name="vendedor_id"
                value={selectedVendedor?.id || ""}
              />
              {vendedorSearch && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Evita que el blur se ejecute antes y restaure el valor anterior
                    setVendedorSearch("");
                    setSelectedVendedor(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-0 cursor-pointer flex items-center"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
              
              {showVendedorSuggestions && filteredVendedores.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-slate-950/95 border border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar glass-effect animate-in fade-in duration-200">
                  {filteredVendedores.map((v) => (
                    <div
                      key={v.id}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Evita que el input pierda el foco antes de seleccionar
                        setSelectedVendedor(v);
                        setVendedorSearch(v.display);
                        setShowVendedorSuggestions(false);
                      }}
                      className="px-4 py-3 hover:bg-secondary/10 hover:text-secondary cursor-pointer transition-colors text-sm text-slate-200 border-b border-slate-900/50 last:border-b-0 flex items-center justify-between"
                    >
                      <span className="font-medium">{v.display}</span>
                      <span className="material-symbols-outlined text-xs text-slate-500">check_circle</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SELECTOR DE REPARTIDOR */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Repartidor</label>
            <select
              name="repartidor_id"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              defaultValue=""
              suppressHydrationWarning
            >
              <option value="" disabled className="bg-slate-950 text-slate-500 italic">Seleccione el repartidor...</option>
              {repartidores.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-950 text-white">
                  {r.display}
                </option>
              ))}
            </select>
          </div>

          {/* MONTO ENGANCHE */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Enganche</label>
            <div className={styles.relativeInputContainer}>
              <span className={styles.prefix}>$</span>
              <input
                type="number"
                name="monto_enganche"
                className={styles.input}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* DOCUMENTO / FOTO */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Comprobante (Imagen o PDF)</label>
            <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-secondary/40 rounded-xl p-3 bg-slate-950/20 transition-all group cursor-pointer h-[46px] select-none">
              <input
                type="file"
                name="comprobante"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                suppressHydrationWarning
              />
              <div className="flex items-center gap-2 text-center">
                <span className="material-symbols-outlined text-slate-500 group-hover:text-secondary text-xl transition-colors">
                  cloud_upload
                </span>
                <p className="text-xs text-slate-300 font-medium">
                  {selectedFileName ? selectedFileName : "Subir comprobante"}
                </p>
              </div>
            </div>
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
              Guardando comprobante...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              Registrar Comprobante
            </>
          )}
        </button>
      </form>

      {/* TABLA HISTÓRICA (Solo visible para roles superiores) */}
      {showTable && (
        <div className={styles.tableContainer}>
          {/* Header con botón para Excel y descarga masiva */}
          <div className="bg-slate-950 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Registro Histórico</h3>
              <p className="text-xs text-slate-400 mt-1">Lista detallada de comprobantes cargados.</p>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-3 self-center">
              <DownloadExcelButton data={filteredList} type="comprobantes" />
              
              <button
                type="button"
                onClick={handleDownloadAllFiles}
                disabled={isDownloading || filteredList.length === 0}
                className="flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-secondary text-slate-950 rounded-xl hover:bg-secondary/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-secondary/15"
                title={isDownloading ? downloadProgress : `Descargar archivos (${filteredList.length})`}
              >
                {isDownloading ? (
                  <span className="animate-spin h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <span className="material-symbols-outlined text-base md:text-xl">download</span>
                )}
              </button>
            </div>
          </div>

          {/* Filtros de Fecha */}
          <div className="bg-slate-900/50 p-6 border-b border-slate-800/60 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 max-sm:w-full">
              <span className="material-symbols-outlined text-slate-400 text-sm">calendar_month</span>
              <span className="text-slate-300 font-medium text-xs">Filtrar por fecha:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs text-slate-400 min-w-[45px] sm:min-w-0">Desde:</label>
              <div className="relative flex items-center flex-1 sm:flex-initial">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className={`w-full sm:w-[130px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center focus:outline-none focus:border-secondary transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                    dateFrom ? "text-slate-200" : "text-transparent"
                  }`}
                  style={{ colorScheme: 'dark' }}
                  suppressHydrationWarning
                />
                {!dateFrom && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
                    dd/mm/aaaa
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs text-slate-400 min-w-[45px] sm:min-w-0">Hasta:</label>
              <div className="relative flex items-center flex-1 sm:flex-initial">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className={`w-full sm:w-[130px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center focus:outline-none focus:border-secondary transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                    dateTo ? "text-slate-200" : "text-transparent"
                  }`}
                  style={{ colorScheme: 'dark' }}
                  suppressHydrationWarning
                />
                {!dateTo && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
                    dd/mm/aaaa
                  </span>
                )}
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
            {isDownloading && (
              <div className="text-xs text-secondary font-semibold animate-pulse ml-auto flex items-center gap-2">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-secondary border-t-transparent rounded-full" />
                {downloadProgress} (Permite descargas múltiples en tu navegador)
              </div>
            )}
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Fecha</th>
                  <th className={styles.th}>Vendedor</th>
                  <th className={styles.th}>Repartidor</th>
                  <th className={styles.th}>Enganche</th>
                  <th className={styles.th}>Comprobante</th>
                  <th className={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      No hay comprobantes que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className={styles.tr}>
                      <td className={styles.td}>
                        <span className="text-slate-100">{formatTijuanaDate(item.created_at)}</span>
                      </td>
                      <td className={styles.td}>
                        {item.vendedor ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-100 font-bold">{item.vendedor.username.charAt(0).toUpperCase() + item.vendedor.username.slice(1)}</span>
                            <span className="text-[10px] text-slate-500">{item.vendedor.role}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Desconocido</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {item.repartidor ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-100 font-bold">{item.repartidor.username.charAt(0).toUpperCase() + item.repartidor.username.slice(1)}</span>
                            <span className="text-[10px] text-slate-500">{item.repartidor.role}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Desconocido</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span className="text-secondary font-bold">{formatCurrency(item.monto_enganche)}</span>
                      </td>
                      <td className={styles.td}>
                        <a
                          href={item.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.linkBtn}
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Ver archivo
                        </a>
                      </td>
                      <td className={styles.td}>
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer animate-in duration-200"
                            title="Eliminar Comprobante"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación de Comprobante Premium */}
      {deletingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop con Blur y oscurecimiento suave */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setDeletingItem(null)}
          />
          {/* Modal Content */}
          <div className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center space-y-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">¿Eliminar Comprobante?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas eliminar este comprobante?<br/>
                Monto: <strong className="text-secondary">{formatCurrency(deletingItem.monto_enganche)}</strong><br/>
                Vendedor: <strong className="text-white">{deletingItem.vendedor?.username || "Desconocido"}</strong><br/>
                Repartidor: <strong className="text-white">{deletingItem.repartidor?.username || "Desconocido"}</strong><br/>
                Esta acción es irreversible, eliminará el registro de la base de datos y el archivo correspondiente de storage.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer border border-slate-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
