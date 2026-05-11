# Documentación de Base de Datos - Finvora

Esta carpeta contiene la definición modular de la infraestructura de datos. Se ha dividido en archivos numerados para indicar el orden de ejecución necesario en Supabase.

## Orden de Ejecución (SQL Editor)

Para configurar la base de datos desde cero, ejecuta los archivos en este orden:

### 1. `01_roles.sql`
Define la base de usuarios y la seguridad de perfiles.
*   **Seguridad**: Nadie puede editar perfiles desde la webapp. Solo lectura.

### 2. `02_productos.sql`
Define el catálogo maestro de equipos.
*   **Permisos**: Todos ven los productos, solo Admin/Sup/Dev editan.

### 3. `03_stock.sql`
Define el inventario físico disponible.
*   **Permisos**: Todos ven el stock, solo Admin/Sup/Dev editan.

### 4. `actualizar_permisos.sql`
Actualiza los permisos de las tablas.
*   **FormatoSQL**: Para actualizar los permisos de las tablas, ejecuta los scripts SQL en el editor SQL de Supabase.

---

## Seguridad y RLS (Matriz de Permisos)

Todas las tablas utilizan **Row Level Security (RLS)** blindada en la base de datos.

| Tabla | Ver (Closer) | Editar (Closer) | Ver (Admin/Supervisor/Developer) | Editar (Admin/Supervisor/Developer) |
| :--- | :---: | :---: | :---: | :---: |
| `perfiles` | ✅ Sí | ❌ No | ✅ Sí | ❌ (Solo Supabase) |
| `productos` | ✅ Sí | ❌ No | ✅ Sí | ✅ Sí |
| `stock` | ✅ Sí | ❌ No | ✅ Sí | ✅ Sí |
