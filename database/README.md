# Documentación de Base de Datos - Finvora

Esta carpeta contiene la definición modular de la infraestructura de datos. Se ha dividido en archivos numerados para indicar el orden de ejecución necesario en Supabase.

## Orden de Ejecución (SQL Editor)

Para configurar la base de datos desde cero, ejecuta los archivos en este orden:

### 1. `01_roles.sql`
Define la base de usuarios y la seguridad de perfiles.
*   **Seguridad**: Nadie puede editar perfiles desde la webapp. Solo lectura.

### 2. `02_productos.sql`
Define el catálogo maestro de equipos (SKUs).
*   **Permisos**: Todos ven los productos, solo Admin/Sup/Dev editan.

### 3. `03_stock.sql`
Define el inventario físico disponible (IMEIs).
*   **Permisos**: Todos ven el stock disponible, solo Admin/Sup/Dev editan estados.
*   **Roles**: Los *Closers* tienen vista de solo lectura en esta tabla.

### 4. `04_ventas.sql`
Define el historial de equipos vendidos.
*   **Lógica**: Los equipos se mueven automáticamente de `stock` a `ventas` tras una confirmación de 20 segundos en el frontend.
*   **Permisos**: Solo Admin, Supervisor y Developer tienen acceso a esta tabla.

---

## Seguridad y RLS (Matriz de Permisos)

Todas las tablas utilizan **Row Level Security (RLS)** blindada en la base de datos.

| Tabla | Ver (Closer) | Editar (Closer) | Ver (Admin/Sup/Dev) | Editar (Admin/Sup/Dev) |
| :--- | :---: | :---: | :---: | :---: |
| `perfiles` | ✅ Sí | ❌ No | ✅ Sí | ❌ (Solo Supabase) |
| `productos` | ✅ Sí | ❌ No | ✅ Sí | ✅ Sí |
| `stock` | ✅ Sí | ❌ No | ✅ Sí | ✅ Sí |
| `ventas` | ❌ No | ❌ No | ✅ Sí | ✅ Sí |

## Flujo de Trabajo (IMEI Lifecycle)
1. **Carga**: Se crea el producto en `productos` y luego se carga la unidad física en `stock`.
2. **Venta**: El usuario cambia el estado a "Vendido".
3. **Gracia**: Se disparan 20 segundos de espera (cancelables).
4. **Migración**: El sistema ejecuta `registrarVenta`, inserta el registro en `ventas` y lo elimina de `stock`.
