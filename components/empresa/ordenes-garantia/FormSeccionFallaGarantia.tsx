'use client';

import React from 'react';
import { styles } from '../ordenes-garantia-types';

interface FormSeccionFallaGarantiaProps {
  selectedFilesCount: number;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormSeccionFallaGarantia({
  selectedFilesCount,
  handleFileChange
}: FormSeccionFallaGarantiaProps) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Información de la Garantía</h3>
      <div className={styles.formGrid}>
        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Motivo de la garantía</label>
          <input 
            type="text" 
            name="motivo_garantia" 
            className={styles.input} 
            required 
            placeholder="Ej: Falla en pantalla, reinicios constantes" 
          />
        </div>

        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Descripción de la falla</label>
          <textarea 
            name="descripcion_falla" 
            className={styles.textarea} 
            required 
            placeholder="Describa el comportamiento de la falla observada por el cliente..." 
          />
        </div>

        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Accesorios entregados</label>
          <input 
            type="text" 
            name="accesorios_entregados" 
            className={styles.input} 
            placeholder="Ej: Caja, cargador original, cable USB, funda, mica" 
            required
          />
        </div>

        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Estado físico del equipo al recibir</label>
          <input 
            type="text" 
            name="estado_fisico" 
            className={styles.input} 
            placeholder="Ej: Rayado en tapa trasera, golpe leve en esquina inferior derecha, sin rayaduras" 
            required
          />
        </div>

        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Observaciones adicionales</label>
          <textarea 
            name="observaciones" 
            className={styles.textarea} 
            placeholder="Notas u observaciones internas..." 
            required
          />
        </div>

        {/* Carga de Fotos */}
        <div className={styles.inputGroupFull}>
          <label className={styles.label}>Fotos del equipo y fallo</label>
          <div className={styles.fileUploadBox}>
            <input
              type="file"
              name="fotos"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              required
            />
            <div className="flex items-center gap-3 text-slate-400 group-hover:text-secondary transition-all">
              <span className="material-symbols-outlined text-xl">upload_file</span>
              <span className="text-sm font-semibold">
                {selectedFilesCount > 0 
                  ? `¡${selectedFilesCount} foto${selectedFilesCount > 1 ? "s" : ""} seleccionada${selectedFilesCount > 1 ? "s" : ""}!` 
                  : "Haz clic para subir fotos"
                }
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 ml-1">Puedes seleccionar múltiples archivos de imagen. Estas fotos se enviarán directamente a Discord.</p>
        </div>
      </div>
    </div>
  );
}
