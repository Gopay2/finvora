'use client';

import React from 'react';

export function FormDatosCliente() {
  const styles = {
    inputGroup: "space-y-2",
    inputGroupFull: "space-y-2 md:col-span-2",
    label: "text-sm font-medium text-slate-300 ml-1",
    input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed",
    selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer",
  };

  return (
    <>
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
    </>
  );
}
