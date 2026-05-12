# 📱 Finvora - Plataforma de Gestión Empresarial

Este repositorio contiene la aplicación web de Finvora, diseñada para la gestión de ventas, stock y métricas de negocio. El sistema utiliza una arquitectura moderna basada en Next.js, Supabase para la infraestructura de datos y autenticación, y Resend para la mensajería transaccional.

## 🛠 Tecnologías Utilizadas

- **Frontend**: Next.js (App Router) con React y Tailwind CSS.
- **Base de Datos y Auth**: Supabase (PostgreSQL + GoTrue).
- **Email Service**: Resend (vía SMTP personalizado).
- **Notificaciones**: Discord Webhooks (Notificaciones de ventas en tiempo real).
- **Hosting y DNS**: Vercel.

## ⚙️ Configuración de Entorno

La aplicación depende de un conjunto de variables de entorno para su correcto funcionamiento en los distintos niveles de la infraestructura (cliente y servidor). Estas deben definirse en el archivo `.env.local` para entornos de desarrollo o en la consola de administración de Vercel para entornos de producción.

### Diccionario de Variables de Entorno

| Variable | Ámbito | Descripción Técnica | Propósito Operativo |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente/Servidor | Punto de enlace (Endpoint) de la API de Supabase. | Establecer la conexión con el clúster de base de datos y servicios de infraestructura. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente/Servidor | Clave pública de acceso anónimo. | Validar peticiones mediante políticas de seguridad a nivel de fila (RLS). |
| `NEXT_PUBLIC_SITE_URL` | Cliente/Servidor | URL absoluta del sitio (ej: `https://finvora.mx`). | Punto de retorno para redireccionamientos de autenticación (emails de confirmación/recuperación). |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | Cliente | Identificador telefónico (E.164, sin prefijo +). | Configuración del destino para los servicios de mensajería instantánea y soporte técnico. |
| `DISCORD_WEBHOOK_URL` | Servidor | URL de integración para Webhooks de Discord. | Automatización de reportes de ventas y logs de actividad en tiempo real hacia canales internos. |
| `DISCORD_ROLE_ID` | Servidor | ID del rol de Discord a mencionar. | Permite notificar a un equipo específico (ej: Ventas) al recibir un nuevo reporte. |


## 📂 Estructura de Navegación (Webapp)

La aplicación utiliza un sistema de rutas anidadas y layouts compartidos para optimizar la seguridad y la experiencia de usuario:

- `/empresa/login`: Acceso de empleados.
- `/empresa/register`: Registro de nuevas cuentas (Asigna rol `Closer` por defecto).
- `/empresa/forgot-password`: Solicitud de recuperación de cuenta.
- `/empresa/webapp`: Panel de control principal (Menú de apps).
- `/empresa/webapp/ventas`: Registro de nuevos pedidos y notificaciones.
- `/empresa/webapp/stock`: Consulta y actualización de stock (Admin/Supervisor/Dev).
- `/empresa/webapp/dashboard`: Métricas y rendimiento empresarial (Admin/Dev).
- `/empresa/webapp/perfil`: Gestión de identidad (Nombre de usuario y rol).

## 🔐 Gestión de Roles y Seguridad

El sistema implementa **RBAC (Role-Based Access Control)** gestionado desde la base de datos:

1.  **Roles**:
    - `Admin / Developer`: Acceso total a todas las secciones y edición de datos.
    - `Supervisor`: Acceso a gestión de inventario y métricas.
    - `Closer`: Acceso restringido al Formulario de Ventas y vista de solo lectura del Stock.
2.  **Sincronización**: Los perfiles se crean automáticamente mediante un Trigger en Supabase tras el registro exitoso. El esquema completo se encuentra en `database/schema.sql`.
3.  **Identidad (Onboarding)**: Los usuarios deben elegir un `username` único al primer ingreso. Esto garantiza la trazabilidad en Discord y en el header de la webapp.
4.  **Protección**: La validación de roles se realiza en el servidor (Server Components) para prevenir accesos no autorizados.

## 📧 Configuración de Mensajería (Resend + SMTP)

Para garantizar que los correos lleguen a la bandeja de entrada y no a Spam, se utiliza **Resend** como proveedor SMTP personalizado en Supabase.

### Paso 0: Crear API Key en Resend
1.  Entra a tu cuenta de **Resend**.
2.  Ve a **API Keys > Create API Key**.
3.  **Permisos**: Selecciona **"Sending Access"** (Mínimo privilegio recomendado).
4.  Copia la clave (empieza con `re_...`).

### Paso 1: Validación de Dominio (Cuidado de Reputación)
Se recomienda configurar un **subdominio** (ej: `app.tudominio.com`) en lugar del dominio raíz. Esto aísla la reputación de los envíos automáticos.

**Pasos en Vercel DNS:**
Si el dominio tiene los nameservers en Vercel, los registros DNS (MX, TXT y CNAME) que entrega Resend deben añadirse en:
`Vercel Project > Settings > Domains > [Tu Dominio] > DNS Records`.

### Paso 2: Configuración en el Dashboard de Supabase
1.  Ve a **Project Settings > Authentication > SMTP Settings**.
2.  Activa **Enable Custom SMTP**.
3.  Rellena los campos:
    - **Sender email**: `no-reply@app.tudominio.com` (Debe coincidir con el subdominio verificado).
    - **Sender name**: `Finvora`
    - **SMTP Host**: `smtp.resend.com`
    - **SMTP Port**: `465`
    - **SMTP Username**: `resend`
    - **SMTP Password**: `[TU_API_KEY_DE_RESEND]`
4.  Haz clic en **Save**.

### Paso 3: Configuración de URLs de Redirección
Para que los enlaces de confirmación de email y recuperación de contraseña funcionen correctamente, ve a **Authentication > URL Configuration**:

1.  **Site URL**: Define la URL principal de tu aplicación (ej: `https://finvora.mx`).
2.  **Redirect URLs**: Añade las URLs permitidas para redirecciones tras la autenticación:
    - `https://tu-dominio.com/**` (Producción).
    - `http://localhost:3000/**` (Desarrollo local).

## 🚀 Despliegue en Producción

Para garantizar el funcionamiento de los flujos de autenticación en producción, se deben cumplir los siguientes requisitos:

1.  **Variables de Entorno**: Configurar `NEXT_PUBLIC_SITE_URL` en Vercel con el dominio de producción (ej: `https://finvora.mx`).
2.  **Redirect URLs**: En Supabase (Authentication > URL Configuration), añadir las siguientes URLs permitidas:
    - `https://finvora.mx/auth/callback`
    - `https://finvora.mx/empresa/update-password`
3.  **Email Confirmation**: Asegurarse de que "Confirm Email" esté activado en el panel de Supabase para mayor seguridad.

## 🤖 Integración con Discord

El sistema de ventas envía notificaciones automáticas a un canal de Discord configurado mediante un Webhook.

- **Configuración**: Se debe crear un Webhook en Discord y asignar su URL a la variable `DISCORD_WEBHOOK_URL`.
- **Formato**: Los datos llegan como *Embeds* estilizados con colores de marca y campos organizados.
- **Campos**: Incluye datos del cliente, equipo (seleccionado jerárquicamente), enganche, fecha/hora de entrega y comentarios opcionales.
- **Flujo**: Al marcar una unidad como vendida, el sistema otorga **20 segundos de gracia** para cancelar antes de migrar la unidad de Stock a Ventas.

## 📱 Desarrollo y Pruebas Móviles

Para probar la aplicación en dispositivos físicos (iPhone/Android) durante el desarrollo local:

1.  **Red Local**: Acceder mediante la IP de la máquina (ej: `http://192.168.1.5:3000`).
2.  **Configuración de Origen**: Es necesario actualizar `allowedDevOrigins` en `next.config.ts` con la IP actual para permitir la carga de recursos de Next.js y el funcionamiento de componentes interactivos (como el menú hamburguesa o selectores de fecha).

---
*Documento de uso interno - Finvora 2026*
