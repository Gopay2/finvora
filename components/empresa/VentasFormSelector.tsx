'use client';

import React, { useState } from "react";
import VentasForm from "./VentasForm";
import VentasCambaceadorForm from "./VentasCambaceadorForm";

interface Producto {
  id: string;
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  color: string;
}

interface RepartoZonaInfo {
  id: string;
  nombre_zona: string;
  repartidor_id: string;
  repartidor_nombre: string;
  repartidor_activo: boolean;
}

interface StockItem {
  producto_id: string;
  estado: string;
  zona: string | null;
  imei?: string;
}

interface VentasFormSelectorProps {
  productos: Producto[];
  zonasReparto: RepartoZonaInfo[];
  stockItems: StockItem[];
  userRole: string;
}

export default function VentasFormSelector({ productos, zonasReparto, stockItems, userRole }: VentasFormSelectorProps) {
  // Inicializamos en verdadero si el rol del usuario es "Cambaceador" por defecto
  const [showCambaceo, setShowCambaceo] = useState(userRole === "Cambaceador");

  const isSuperUser = ["Admin", "Supervisor", "Developer", "CambaCloser"].includes(userRole);

  return (
    <div className="space-y-6">
      {isSuperUser && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl mb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-2xl">tune</span>
            <div className="text-left">
              <h3 className="font-bold text-slate-100 text-sm">Vista del Formulario</h3>
              <p className="text-xs text-slate-400">Como {userRole}, puedes alternar entre ambas versiones de formulario</p>
            </div>
          </div>
          
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-center md:self-auto">
            <button
              type="button"
              onClick={() => setShowCambaceo(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !showCambaceo
                  ? "bg-secondary text-slate-950 shadow-md shadow-secondary/15"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Closer
            </button>
            <button
              type="button"
              onClick={() => setShowCambaceo(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showCambaceo
                  ? "bg-secondary text-slate-950 shadow-md shadow-secondary/15"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Cambaceador
            </button>
          </div>
        </div>
      )}

      {showCambaceo ? (
        <VentasCambaceadorForm
          productos={productos}
          zonasReparto={zonasReparto}
          stockItems={stockItems}
        />
      ) : (
        <VentasForm
          productos={productos}
          zonasReparto={zonasReparto}
          stockItems={stockItems}
        />
      )}
    </div>
  );
}
