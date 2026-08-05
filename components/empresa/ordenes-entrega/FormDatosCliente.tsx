'use client';

import React from 'react';

/**
 * Componente que renderiza los campos iniciales de información del cliente y referencias personales/familiares
 * en el formulario de Orden de Entrega.
 */
export function FormDatosCliente() {
  const styles = {
    formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
    inputGroup: "space-y-2",
    inputGroupFull: "space-y-2 md:col-span-2",
    label: "text-sm font-medium text-slate-300 ml-1",
    input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed",
    selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer",
    sectionTitle: "text-lg font-bold text-secondary border-b border-slate-800 pb-2 mb-4",
  };

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: DATOS DEL CLIENTE */}
      <div>
        <h3 className={styles.sectionTitle}>Datos del Cliente</h3>
        <div className={styles.formGrid}>
          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Nombre de cliente</label>
            <input type="text" name="nombre_cliente" className={styles.input} required placeholder="Nombre completo" suppressHydrationWarning />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>¿Cuenta con Identificación?</label>
            <select
              name="identificacion_fisica"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              suppressHydrationWarning
            >
              <option value="Si" className="bg-slate-950 text-white">Sí cuenta con INE/Residencia</option>
              <option value="No" className="bg-slate-950 text-white">No cuenta con INE/Residencia</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>CURP</label>
            <input
              type="text"
              name="curp"
              className={styles.input}
              required
              placeholder="Ingrese los 18 caracteres de la CURP"
              suppressHydrationWarning
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Número de teléfono</label>
            <input type="tel" name="telefono" className={styles.input} required placeholder="Ej: 5212345678900" suppressHydrationWarning />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Preferencia de comunicación</label>
            <select
              name="preferencia_comunicacion"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              defaultValue=""
              suppressHydrationWarning
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione preferencia...</option>
              <option value="Llamada WhatsApp" className="bg-slate-950 text-white">Llamada WhatsApp</option>
              <option value="Llamada Telefónica" className="bg-slate-950 text-white">Llamada Telefónica</option>
              <option value="Mensaje WhatsApp" className="bg-slate-950 text-white">Mensaje WhatsApp</option>
              <option value="Mensaje SMS" className="bg-slate-950 text-white">Mensaje SMS</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Dirección</label>
            <input type="text" name="direccion" className={styles.input} required placeholder="Enlace Google Maps" suppressHydrationWarning />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>¿Cuenta activa?</label>
            <select
              name="cuenta_activa"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              defaultValue="si"
              suppressHydrationWarning
            >
              <option value="si" className="bg-slate-950 text-white">Sí</option>
              <option value="no" className="bg-slate-950 text-white">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DATOS DE REFERENCIAS */}
      <div>
        <h3 className={styles.sectionTitle}>Datos de Referencias</h3>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre referencia 1</label>
            <input
              type="text"
              name="nombre_referencia_1"
              className={styles.input}
              placeholder="Solo iPhone"
              suppressHydrationWarning
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Número referencia 1</label>
            <input
              type="tel"
              name="telefono_referencia_1"
              className={styles.input}
              placeholder="Solo iPhone"
              suppressHydrationWarning
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre referencia 2</label>
            <input
              type="text"
              name="nombre_referencia_2"
              className={styles.input}
              placeholder="Solo iPhone"
              suppressHydrationWarning
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Número referencia 2</label>
            <input
              type="tel"
              name="telefono_referencia_2"
              className={styles.input}
              placeholder="Solo iPhone"
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>
    </div>
  );
}
