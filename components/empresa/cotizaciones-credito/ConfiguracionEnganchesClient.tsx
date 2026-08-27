'use client';

import React, { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Subcomponentes modulares
import { ConfiguracionGeneralSection } from "./ConfiguracionGeneralSection";
import { ConfiguracionZonasSection } from "./ConfiguracionZonasSection";
import { ConfiguracionVendedoresSection } from "./ConfiguracionVendedoresSection";
import { ALL_PERCENTAGES } from "./PorcentajesPopoverSelector";
import ConfirmModal from "@/components/empresa/ConfirmModal";

// Acciones del servidor y Tipos
import {
  guardarConfiguracionesEnganche,
  eliminarConfiguracionEnganche,
  type ConfigEngancheUpdatePayload,
} from "@/app/empresa/webapp/cotizaciones-credito/configuracion/actions";
import type { ConfigEngancheItem, VendedorDisponible } from "@/types/ordenes-entrega";

interface ConfiguracionEnganchesClientProps {
  initialConfigs: ConfigEngancheItem[];
  zonasDisponibles?: string[];
  vendedoresDisponibles?: VendedorDisponible[];
}

// ─── Funciones auxiliares de validación pura ─────────────────────────────────
function validatePercentageAddition(rawInput: string, existingList: number[]): { isValid: boolean; parsedValue?: number; errorMessage?: string } {
  const parsedValue = Math.round(Number(rawInput));
  if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100) {
    return { isValid: false, errorMessage: "Ingresa un porcentaje válido entre 0 y 100." };
  }
  if (existingList.includes(parsedValue)) {
    return { isValid: false, errorMessage: `El ${parsedValue}% ya está en la lista.` };
  }
  return { isValid: true, parsedValue };
}

function validatePercentageRemoval(rawInput: string, existingList: number[]): { isValid: boolean; parsedValue?: number; errorMessage?: string } {
  const parsedValue = Math.round(Number(rawInput));
  if (isNaN(parsedValue)) {
    return { isValid: false, errorMessage: "Ingresa el porcentaje que deseas eliminar." };
  }
  if (!existingList.includes(parsedValue)) {
    return { isValid: false, errorMessage: `El ${parsedValue}% no está en la lista.` };
  }
  return { isValid: true, parsedValue };
}

function validateRulePayload(targetId: string, entityName: string, percentages: number[]): { isValid: boolean; errorMessage?: string } {
  if (!targetId || !targetId.trim()) {
    return { isValid: false, errorMessage: `Por favor selecciona ${entityName}.` };
  }
  if (percentages.length === 0) {
    return { isValid: false, errorMessage: "Selecciona al menos un porcentaje disponible." };
  }
  return { isValid: true };
}

export function ConfiguracionEnganchesClient({
  initialConfigs,
  zonasDisponibles = [],
  vendedoresDisponibles = [],
}: ConfiguracionEnganchesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string; isVisible: boolean } | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const removeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Estado para el modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState<{
    id: string;
    type: 'zona' | 'vendedor';
    name: string;
    clientType: string;
  } | null>(null);

  // Refs para click-outside y scroll
  const zoneFormRef = useRef<HTMLDivElement | null>(null);
  const zoneDropdownRef = useRef<HTMLDivElement | null>(null);
  const vendedorFormRef = useRef<HTMLDivElement | null>(null);
  const vendedorDropdownRef = useRef<HTMLDivElement | null>(null);

  // 1. Separar configuraciones por nivel: General, Zona y Vendedor
  const initialGeneralSi = initialConfigs.find(
    (config) => !config.vendedor_id && !config.zona && config.cliente_historial.toLowerCase() === "si"
  ) || {
    cliente_historial: "Si",
    zona: null,
    vendedor_id: null,
    porcentajes: [3, 5, 10, 15, 20, 25],
    permitir_enganche_libre: false,
  };

  const initialGeneralNo = initialConfigs.find(
    (config) => !config.vendedor_id && !config.zona && config.cliente_historial.toLowerCase() === "no"
  ) || {
    cliente_historial: "No",
    zona: null,
    vendedor_id: null,
    porcentajes: [5],
    permitir_enganche_libre: false,
  };

  const initialZoneConfigs = initialConfigs.filter((config) => !config.vendedor_id && Boolean(config.zona));
  const initialVendedorConfigs = initialConfigs.filter((config) => Boolean(config.vendedor_id));

  // Estados locales para General
  const [siGeneralPorcentajes, setSiGeneralPorcentajes] = useState<number[]>(initialGeneralSi.porcentajes || []);
  const [siGeneralEngancheLibre, setSiGeneralEngancheLibre] = useState<boolean>(Boolean(initialGeneralSi.permitir_enganche_libre));
  const [newSiGeneralPercent, setNewSiGeneralPercent] = useState<string>("");

  const [noGeneralPorcentajes, setNoGeneralPorcentajes] = useState<number[]>(initialGeneralNo.porcentajes || []);
  const [noGeneralEngancheLibre, setNoGeneralEngancheLibre] = useState<boolean>(Boolean(initialGeneralNo.permitir_enganche_libre));
  const [newNoGeneralPercent, setNewNoGeneralPercent] = useState<string>("");

  // Estados locales para Zonas
  const [zoneConfigs, setZoneConfigs] = useState<ConfigEngancheItem[]>(initialZoneConfigs);
  const [editingZoneConfigId, setEditingZoneConfigId] = useState<string | null>(null);
  const [selectedNewZona, setSelectedNewZona] = useState<string>(zonasDisponibles[0] || "");
  const [selectedNewZonaCliente, setSelectedNewZonaCliente] = useState<'Si' | 'No'>("Si");
  const [selectedNewZonaPercentages, setSelectedNewZonaPercentages] = useState<number[]>([3, 5, 10, 15, 20, 25]);
  const [newZoneEngancheLibre, setNewZoneEngancheLibre] = useState<boolean>(false);
  const [isZonePercentDropdownOpen, setIsZonePercentDropdownOpen] = useState<boolean>(false);

  // Estados locales para Vendedores
  const [vendedorConfigs, setVendedorConfigs] = useState<ConfigEngancheItem[]>(initialVendedorConfigs);
  const [editingVendedorConfigId, setEditingVendedorConfigId] = useState<string | null>(null);
  const [selectedNewVendedorId, setSelectedNewVendedorId] = useState<string>(vendedoresDisponibles[0]?.id || "");
  const [selectedNewVendedorCliente, setSelectedNewVendedorCliente] = useState<'Si' | 'No'>("Si");
  const [selectedNewVendedorPercentages, setSelectedNewVendedorPercentages] = useState<number[]>([3, 5, 10, 15, 20, 25]);
  const [newVendedorEngancheLibre, setNewVendedorEngancheLibre] = useState<boolean>(false);
  const [isVendedorPercentDropdownOpen, setIsVendedorPercentDropdownOpen] = useState<boolean>(false);

  // Sincronizar estados locales cuando initialConfigs cambia
  useEffect(() => {
    const generalSi = initialConfigs.find(
      (c) => !c.vendedor_id && !c.zona && c.cliente_historial.toLowerCase() === "si"
    );
    if (generalSi) {
      setSiGeneralPorcentajes(generalSi.porcentajes || []);
      setSiGeneralEngancheLibre(Boolean(generalSi.permitir_enganche_libre));
    }
    const generalNo = initialConfigs.find(
      (c) => !c.vendedor_id && !c.zona && c.cliente_historial.toLowerCase() === "no"
    );
    if (generalNo) {
      setNoGeneralPorcentajes(generalNo.porcentajes || []);
      setNoGeneralEngancheLibre(Boolean(generalNo.permitir_enganche_libre));
    }
    const zoneItems = initialConfigs.filter((c) => !c.vendedor_id && Boolean(c.zona));
    const vendedorItems = initialConfigs.filter((c) => Boolean(c.vendedor_id));
    setZoneConfigs(zoneItems);
    setVendedorConfigs(vendedorItems);
  }, [initialConfigs]);

  // Cerrar popovers al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target as Node)) {
        setIsZonePercentDropdownOpen(false);
      }
      if (vendedorDropdownRef.current && !vendedorDropdownRef.current.contains(event.target as Node)) {
        setIsVendedorPercentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper de Toasts animados
  const showToast = (type: 'success' | 'error', text: string) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);

    setToast({ type, text, isVisible: true });

    fadeTimerRef.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, isVisible: false } : null));
    }, 2800);

    removeTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // ─── 1. ACCIONES GENERALES ──────────────────────────────────────────────────
  const autoSaveGeneral = (
    clienteHistorial: 'Si' | 'No',
    porcentajesActualizados: number[],
    engancheLibreActualizado: boolean
  ) => {
    const targetItem = initialConfigs.find(
      (config) => !config.vendedor_id && !config.zona && config.cliente_historial.toLowerCase() === clienteHistorial.toLowerCase()
    );

    const payload: ConfigEngancheUpdatePayload[] = [
      {
        id: targetItem?.id,
        cliente_historial: clienteHistorial,
        zona: null,
        vendedor_id: null,
        porcentajes: porcentajesActualizados,
        permitir_enganche_libre: engancheLibreActualizado,
      },
    ];

    startTransition(async () => {
      const response = await guardarConfiguracionesEnganche(payload);
      if (response.success) {
        showToast("success", `Configuración General (${clienteHistorial === "Si" ? "Con Historial" : "Sin Historial"}) guardada.`);
        router.refresh();
      } else {
        showToast("error", response.error || "Error al guardar configuración general.");
      }
    });
  };

  const handleAddSiGeneral = () => {
    const { isValid, parsedValue, errorMessage } = validatePercentageAddition(newSiGeneralPercent, siGeneralPorcentajes);
    if (!isValid || parsedValue === undefined) {
      showToast("error", errorMessage || "Porcentaje inválido.");
      return;
    }
    const updated = Array.from(new Set([...siGeneralPorcentajes, parsedValue])).sort((a, b) => a - b);
    setSiGeneralPorcentajes(updated);
    setNewSiGeneralPercent("");
    autoSaveGeneral("Si", updated, siGeneralEngancheLibre);
  };

  const handleRemoveSiGeneral = () => {
    const { isValid, parsedValue, errorMessage } = validatePercentageRemoval(newSiGeneralPercent, siGeneralPorcentajes);
    if (!isValid || parsedValue === undefined) {
      showToast("error", errorMessage || "Porcentaje inválido.");
      return;
    }
    const updated = siGeneralPorcentajes.filter((porcentaje) => porcentaje !== parsedValue);
    setSiGeneralPorcentajes(updated);
    setNewSiGeneralPercent("");
    autoSaveGeneral("Si", updated, siGeneralEngancheLibre);
  };

  const handleAddNoGeneral = () => {
    const { isValid, parsedValue, errorMessage } = validatePercentageAddition(newNoGeneralPercent, noGeneralPorcentajes);
    if (!isValid || parsedValue === undefined) {
      showToast("error", errorMessage || "Porcentaje inválido.");
      return;
    }
    const updated = Array.from(new Set([...noGeneralPorcentajes, parsedValue])).sort((a, b) => a - b);
    setNoGeneralPorcentajes(updated);
    setNewNoGeneralPercent("");
    autoSaveGeneral("No", updated, noGeneralEngancheLibre);
  };

  const handleRemoveNoGeneral = () => {
    const { isValid, parsedValue, errorMessage } = validatePercentageRemoval(newNoGeneralPercent, noGeneralPorcentajes);
    if (!isValid || parsedValue === undefined) {
      showToast("error", errorMessage || "Porcentaje inválido.");
      return;
    }
    const updated = noGeneralPorcentajes.filter((porcentaje) => porcentaje !== parsedValue);
    setNoGeneralPorcentajes(updated);
    setNewNoGeneralPercent("");
    autoSaveGeneral("No", updated, noGeneralEngancheLibre);
  };

  // ─── 2. ACCIONES POR ZONAS ──────────────────────────────────────────────────
  const autoSaveZoneEngancheToggle = (
    id: string | undefined,
    zona: string,
    clienteHistorial: string,
    porcentajes: number[],
    nuevoEngancheLibre: boolean
  ) => {
    startTransition(async () => {
      const response = await guardarConfiguracionesEnganche([
        {
          id,
          zona,
          vendedor_id: null,
          cliente_historial: clienteHistorial,
          porcentajes,
          permitir_enganche_libre: nuevoEngancheLibre,
        },
      ]);
      if (response.success) {
        showToast("success", `Enganche Libre ${nuevoEngancheLibre ? "activado" : "desactivado"} para ${zona} (${clienteHistorial === "Si" ? "Con Historial" : "Sin Historial"}).`);
        router.refresh();
      } else {
        showToast("error", response.error || "Error al actualizar enganche libre de la zona.");
      }
    });
  };

  const toggleZonePercentage = (percentage: number) => {
    if (selectedNewZonaPercentages.includes(percentage)) {
      setSelectedNewZonaPercentages(selectedNewZonaPercentages.filter((porcentajeItem) => porcentajeItem !== percentage));
    } else {
      setSelectedNewZonaPercentages([...selectedNewZonaPercentages, percentage].sort((porcentajeA, porcentajeB) => porcentajeA - porcentajeB));
    }
  };

  const handleZonaClienteChange = (cliente: 'Si' | 'No') => {
    setSelectedNewZonaCliente(cliente);
    if (!editingZoneConfigId) {
      setSelectedNewZonaPercentages(cliente === "Si" ? [3, 5, 10, 15, 20, 25] : [5]);
    }
  };

  const handleSaveZoneConfig = () => {
    const { isValid, errorMessage } = validateRulePayload(selectedNewZona, "una zona válida", selectedNewZonaPercentages);
    if (!isValid) {
      showToast("error", errorMessage || "Datos de zona inválidos.");
      return;
    }

    // Validación de duplicados al crear una nueva excepción
    if (!editingZoneConfigId) {
      const alreadyExists = zoneConfigs.some(
        (item) =>
          item.zona?.trim().toLowerCase() === selectedNewZona.trim().toLowerCase() &&
          item.cliente_historial.toLowerCase() === selectedNewZonaCliente.toLowerCase()
      );
      if (alreadyExists) {
        showToast(
          "error",
          `Ya existe una regla para "${selectedNewZona}" (${selectedNewZonaCliente === "Si" ? "Con Historial" : "Sin Historial"}). Edítala directamente desde la tabla.`
        );
        return;
      }
    }

    const payload: ConfigEngancheUpdatePayload[] = [
      {
        id: editingZoneConfigId || undefined,
        zona: selectedNewZona.trim(),
        vendedor_id: null,
        cliente_historial: selectedNewZonaCliente,
        porcentajes: selectedNewZonaPercentages,
        permitir_enganche_libre: newZoneEngancheLibre,
      },
    ];

    startTransition(async () => {
      const response = await guardarConfiguracionesEnganche(payload);
      if (response.success) {
        const savedItem = response.savedConfigs?.[0] || {
          id: editingZoneConfigId || `temp-${Date.now()}`,
          zona: selectedNewZona.trim(),
          vendedor_id: null,
          cliente_historial: selectedNewZonaCliente,
          porcentajes: selectedNewZonaPercentages,
          permitir_enganche_libre: newZoneEngancheLibre,
        };

        setZoneConfigs((prev) => {
          const existingIndex = prev.findIndex(
            (item) =>
              (editingZoneConfigId && item.id === editingZoneConfigId) ||
              (!editingZoneConfigId &&
                item.zona?.toLowerCase() === savedItem.zona?.toLowerCase() &&
                item.cliente_historial.toLowerCase() === savedItem.cliente_historial.toLowerCase())
          );
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = savedItem;
            return next;
          } else {
            return [...prev, savedItem];
          }
        });

        showToast("success", `Regla para ${selectedNewZona} (${selectedNewZonaCliente === "Si" ? "Con Historial" : "Sin Historial"}) guardada.`);
        setEditingZoneConfigId(null);
        setNewZoneEngancheLibre(false);
        setIsZonePercentDropdownOpen(false);
        router.refresh();
      } else {
        showToast("error", response.error || "Error al guardar regla de zona.");
      }
    });
  };

  const handleEditZoneConfig = (config: ConfigEngancheItem) => {
    setEditingZoneConfigId(config.id || null);
    setSelectedNewZona(config.zona || zonasDisponibles[0] || "");
    setSelectedNewZonaCliente((config.cliente_historial === "No" ? "No" : "Si") as 'Si' | 'No');
    setSelectedNewZonaPercentages(config.porcentajes || []);
    setNewZoneEngancheLibre(Boolean(config.permitir_enganche_libre));
    setIsZonePercentDropdownOpen(false);

    if (zoneFormRef.current) {
      zoneFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleCancelEditZone = () => {
    setEditingZoneConfigId(null);
    setSelectedNewZona(zonasDisponibles[0] || "");
    setSelectedNewZonaCliente("Si");
    setSelectedNewZonaPercentages([3, 5, 10, 15, 20, 25]);
    setNewZoneEngancheLibre(false);
    setIsZonePercentDropdownOpen(false);
  };

  const handleDeleteZoneConfig = (id?: string, zonaNombre?: string | null) => {
    if (!id) return;
    const item = zoneConfigs.find((c) => c.id === id);
    const clientType = item?.cliente_historial.toLowerCase() === "si" ? "Con Historial" : "Sin Historial";
    setDeleteModal({
      id,
      type: "zona",
      name: zonaNombre || "esta zona",
      clientType,
    });
  };

  // ─── 3. ACCIONES POR VENDEDOR ────────────────────────────────────────────────
  const autoSaveVendedorEngancheToggle = (
    id: string | undefined,
    vendedorId: string,
    vendedorNombre: string | null | undefined,
    clienteHistorial: string,
    porcentajes: number[],
    nuevoEngancheLibre: boolean
  ) => {
    startTransition(async () => {
      const response = await guardarConfiguracionesEnganche([
        {
          id,
          zona: null,
          vendedor_id: vendedorId,
          cliente_historial: clienteHistorial,
          porcentajes,
          permitir_enganche_libre: nuevoEngancheLibre,
        },
      ]);
      if (response.success) {
        showToast("success", `Enganche Libre ${nuevoEngancheLibre ? "activado" : "desactivado"} para ${vendedorNombre || "Vendedor"} (${clienteHistorial === "Si" ? "Con Historial" : "Sin Historial"}).`);
        router.refresh();
      } else {
        showToast("error", response.error || "Error al actualizar enganche libre del vendedor.");
      }
    });
  };

  const toggleVendedorPercentage = (percentage: number) => {
    if (selectedNewVendedorPercentages.includes(percentage)) {
      setSelectedNewVendedorPercentages(selectedNewVendedorPercentages.filter((porcentajeItem) => porcentajeItem !== percentage));
    } else {
      setSelectedNewVendedorPercentages([...selectedNewVendedorPercentages, percentage].sort((porcentajeA, porcentajeB) => porcentajeA - porcentajeB));
    }
  };

  const handleVendedorClienteChange = (cliente: 'Si' | 'No') => {
    setSelectedNewVendedorCliente(cliente);
    if (!editingVendedorConfigId) {
      setSelectedNewVendedorPercentages(cliente === "Si" ? [3, 5, 10, 15, 20, 25] : [5]);
    }
  };

  const handleSaveVendedorConfig = () => {
    const { isValid, errorMessage } = validateRulePayload(selectedNewVendedorId, "un vendedor válido", selectedNewVendedorPercentages);
    if (!isValid) {
      showToast("error", errorMessage || "Datos de vendedor inválidos.");
      return;
    }

    const targetVendedor = vendedoresDisponibles.find((vendedor) => vendedor.id === selectedNewVendedorId);
    const targetVendedorNombre = targetVendedor?.nombre || "Vendedor";

    // Validación de duplicados al crear una nueva excepción
    if (!editingVendedorConfigId) {
      const alreadyExists = vendedorConfigs.some(
        (item) =>
          item.vendedor_id === selectedNewVendedorId.trim() &&
          item.cliente_historial.toLowerCase() === selectedNewVendedorCliente.toLowerCase()
      );
      if (alreadyExists) {
        showToast(
          "error",
          `Ya existe una regla para "${targetVendedorNombre}" (${selectedNewVendedorCliente === "Si" ? "Con Historial" : "Sin Historial"}). Edítala directamente desde la tabla.`
        );
        return;
      }
    }

    const payload: ConfigEngancheUpdatePayload[] = [
      {
        id: editingVendedorConfigId || undefined,
        zona: null,
        vendedor_id: selectedNewVendedorId.trim(),
        cliente_historial: selectedNewVendedorCliente,
        porcentajes: selectedNewVendedorPercentages,
        permitir_enganche_libre: newVendedorEngancheLibre,
      },
    ];

    startTransition(async () => {
      const response = await guardarConfiguracionesEnganche(payload);
      if (response.success) {
        const savedItem = response.savedConfigs?.[0] || {
          id: editingVendedorConfigId || `temp-${Date.now()}`,
          zona: null,
          vendedor_id: selectedNewVendedorId.trim(),
          vendedor_nombre: targetVendedorNombre,
          cliente_historial: selectedNewVendedorCliente,
          porcentajes: selectedNewVendedorPercentages,
          permitir_enganche_libre: newVendedorEngancheLibre,
        };
        if (!savedItem.vendedor_nombre) {
          savedItem.vendedor_nombre = targetVendedorNombre;
        }

        setVendedorConfigs((prev) => {
          const existingIndex = prev.findIndex(
            (item) =>
              (editingVendedorConfigId && item.id === editingVendedorConfigId) ||
              (!editingVendedorConfigId &&
                item.vendedor_id === savedItem.vendedor_id &&
                item.cliente_historial.toLowerCase() === savedItem.cliente_historial.toLowerCase())
          );
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = savedItem;
            return next;
          } else {
            return [...prev, savedItem];
          }
        });

        showToast("success", `Regla para ${targetVendedorNombre} (${selectedNewVendedorCliente === "Si" ? "Con Historial" : "Sin Historial"}) guardada.`);
        setEditingVendedorConfigId(null);
        setNewVendedorEngancheLibre(false);
        setIsVendedorPercentDropdownOpen(false);
        router.refresh();
      } else {
        showToast("error", response.error || "Error al guardar regla de vendedor.");
      }
    });
  };

  const handleEditVendedorConfig = (config: ConfigEngancheItem) => {
    setEditingVendedorConfigId(config.id || null);
    setSelectedNewVendedorId(config.vendedor_id || vendedoresDisponibles[0]?.id || "");
    setSelectedNewVendedorCliente((config.cliente_historial === "No" ? "No" : "Si") as 'Si' | 'No');
    setSelectedNewVendedorPercentages(config.porcentajes || []);
    setNewVendedorEngancheLibre(Boolean(config.permitir_enganche_libre));
    setIsVendedorPercentDropdownOpen(false);

    if (vendedorFormRef.current) {
      vendedorFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleCancelEditVendedor = () => {
    setEditingVendedorConfigId(null);
    setSelectedNewVendedorId(vendedoresDisponibles[0]?.id || "");
    setSelectedNewVendedorCliente("Si");
    setSelectedNewVendedorPercentages([3, 5, 10, 15, 20, 25]);
    setNewVendedorEngancheLibre(false);
    setIsVendedorPercentDropdownOpen(false);
  };

  const handleDeleteVendedorConfig = (id?: string, vendedorNombre?: string | null) => {
    if (!id) return;
    const item = vendedorConfigs.find((c) => c.id === id);
    const clientType = item?.cliente_historial.toLowerCase() === "si" ? "Con Historial" : "Sin Historial";
    setDeleteModal({
      id,
      type: "vendedor",
      name: vendedorNombre || "este vendedor",
      clientType,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal) return;
    const { id, type, name, clientType } = deleteModal;

    startTransition(async () => {
      const response = await eliminarConfiguracionEnganche(id);
      if (response.success) {
        showToast(
          "success",
          `Excepción de ${type === "zona" ? "zona" : "vendedor"} para ${name} (${clientType}) eliminada.`
        );
        if (type === "zona") {
          setZoneConfigs((prev) => prev.filter((item) => item.id !== id));
          if (editingZoneConfigId === id) {
            handleCancelEditZone();
          }
        } else {
          setVendedorConfigs((prev) => prev.filter((item) => item.id !== id));
          if (editingVendedorConfigId === id) {
            handleCancelEditVendedor();
          }
        }
        router.refresh();
      } else {
        showToast("error", response.error || "Error al eliminar la excepción.");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 relative">
      {/* Toast Notification */}
      {mounted && toast && createPortal(
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] pointer-events-none flex flex-col items-end max-w-[calc(100vw-2rem)]">
          <div
            className={`pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold transition-all duration-300 ${
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50"
                : "bg-red-950/95 border-red-500/40 text-red-300 shadow-red-950/50"
            } ${toast.isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95"}`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg shrink-0">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            <span className="leading-snug">{toast.text}</span>
          </div>
        </div>,
        document.body
      )}

      {/* Header de la página */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Configuración de Enganches
          </h1>
          <p className="text-slate-500 text-sm">
            Gestiona los porcentajes de enganche permitidos a nivel general, por zona y por vendedor para clientes con y sin historial crediticio.
          </p>
        </div>

        <Link
          href="/empresa/webapp/cotizaciones-credito"
          className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </header>

      {/* SECCIÓN 1: CONFIGURACIÓN GENERAL */}
      <ConfiguracionGeneralSection
        siPorcentajes={siGeneralPorcentajes}
        siEngancheLibre={siGeneralEngancheLibre}
        newSiPercent={newSiGeneralPercent}
        onChangeNewSiPercent={setNewSiGeneralPercent}
        onAddSiPercent={handleAddSiGeneral}
        onRemoveSiPercent={handleRemoveSiGeneral}
        onToggleSiEngancheLibre={() => {
          const nextVal = !siGeneralEngancheLibre;
          setSiGeneralEngancheLibre(nextVal);
          autoSaveGeneral("Si", siGeneralPorcentajes, nextVal);
        }}
        noPorcentajes={noGeneralPorcentajes}
        noEngancheLibre={noGeneralEngancheLibre}
        newNoPercent={newNoGeneralPercent}
        onChangeNewNoPercent={setNewNoGeneralPercent}
        onAddNoPercent={handleAddNoGeneral}
        onRemoveNoPercent={handleRemoveNoGeneral}
        onToggleNoEngancheLibre={() => {
          const nextVal = !noGeneralEngancheLibre;
          setNoGeneralEngancheLibre(nextVal);
          autoSaveGeneral("No", noGeneralPorcentajes, nextVal);
        }}
        isPending={isPending}
      />

      {/* SECCIÓN 2: CONFIGURACIÓN POR ZONAS */}
      <ConfiguracionZonasSection
        zonasDisponibles={zonasDisponibles}
        zoneConfigs={zoneConfigs}
        editingZoneConfigId={editingZoneConfigId}
        selectedNewZona={selectedNewZona}
        selectedNewZonaCliente={selectedNewZonaCliente}
        selectedNewZonaPercentages={selectedNewZonaPercentages}
        newZoneEngancheLibre={newZoneEngancheLibre}
        isZonePercentDropdownOpen={isZonePercentDropdownOpen}
        zoneFormRef={zoneFormRef}
        zoneDropdownRef={zoneDropdownRef}
        isPending={isPending}
        onChangeSelectedZona={setSelectedNewZona}
        onChangeZonaCliente={handleZonaClienteChange}
        onToggleZoneEngancheLibre={() => setNewZoneEngancheLibre(!newZoneEngancheLibre)}
        onTogglePercentDropdown={() => setIsZonePercentDropdownOpen(!isZonePercentDropdownOpen)}
        onToggleZonePercentage={toggleZonePercentage}
        onSelectAllPercentages={() => setSelectedNewZonaPercentages(ALL_PERCENTAGES)}
        onClearPercentages={() => setSelectedNewZonaPercentages([])}
        onSaveZoneConfig={handleSaveZoneConfig}
        onCancelEditZone={handleCancelEditZone}
        onEditZoneConfig={handleEditZoneConfig}
        onDeleteZoneConfig={handleDeleteZoneConfig}
        onToggleZoneRowEnganche={(config) => {
          const nextVal = !config.permitir_enganche_libre;
          setZoneConfigs((prev) =>
            prev.map((item) => (item.id === config.id ? { ...item, permitir_enganche_libre: nextVal } : item))
          );
          autoSaveZoneEngancheToggle(config.id, config.zona || "", config.cliente_historial, config.porcentajes, nextVal);
        }}
      />

      {/* SECCIÓN 3: CONFIGURACIÓN POR VENDEDOR */}
      <ConfiguracionVendedoresSection
        vendedoresDisponibles={vendedoresDisponibles}
        vendedorConfigs={vendedorConfigs}
        editingVendedorConfigId={editingVendedorConfigId}
        selectedNewVendedorId={selectedNewVendedorId}
        selectedNewVendedorCliente={selectedNewVendedorCliente}
        selectedNewVendedorPercentages={selectedNewVendedorPercentages}
        newVendedorEngancheLibre={newVendedorEngancheLibre}
        isVendedorPercentDropdownOpen={isVendedorPercentDropdownOpen}
        vendedorFormRef={vendedorFormRef}
        vendedorDropdownRef={vendedorDropdownRef}
        isPending={isPending}
        onChangeSelectedVendedorId={setSelectedNewVendedorId}
        onChangeVendedorCliente={handleVendedorClienteChange}
        onToggleVendedorEngancheLibre={() => setNewVendedorEngancheLibre(!newVendedorEngancheLibre)}
        onTogglePercentDropdown={() => setIsVendedorPercentDropdownOpen(!isVendedorPercentDropdownOpen)}
        onToggleVendedorPercentage={toggleVendedorPercentage}
        onSelectAllPercentages={() => setSelectedNewVendedorPercentages(ALL_PERCENTAGES)}
        onClearPercentages={() => setSelectedNewVendedorPercentages([])}
        onSaveVendedorConfig={handleSaveVendedorConfig}
        onCancelEditVendedor={handleCancelEditVendedor}
        onEditVendedorConfig={handleEditVendedorConfig}
        onDeleteVendedorConfig={handleDeleteVendedorConfig}
        onToggleVendedorRowEnganche={(config) => {
          const nextVal = !config.permitir_enganche_libre;
          setVendedorConfigs((prev) =>
            prev.map((item) => (item.id === config.id ? { ...item, permitir_enganche_libre: nextVal } : item))
          );
          autoSaveVendedorEngancheToggle(
            config.id,
            config.vendedor_id || "",
            config.vendedor_nombre,
            config.cliente_historial,
            config.porcentajes,
            nextVal
          );
        }}
      />

      {/* Modal de Confirmación de Eliminación Estándar */}
      <ConfirmModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleConfirmDelete}
        title={deleteModal?.type === "zona" ? "¿Eliminar excepción de zona?" : "¿Eliminar excepción de vendedor?"}
        message={`¿Estás seguro de que deseas eliminar la excepción para "${deleteModal?.name}" (${deleteModal?.clientType})? Volverá a regirse por la configuración ${
          deleteModal?.type === "vendedor" ? "de su zona o general" : "general"
        }.`}
      />
    </div>
  );
}
