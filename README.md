# Finvora - Plataforma de Gestión Empresarial

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
- `/empresa/webapp/stock`: Consulta y actualización de stock (Solo Admin).
- `/empresa/webapp/dashboard`: Métricas y rendimiento empresarial (Solo Admin).
- `/empresa/webapp/perfil`: Gestión de identidad (Nombre de usuario y rol).

## 🔐 Gestión de Roles y Seguridad

El sistema implementa **RBAC (Role-Based Access Control)** gestionado desde la base de datos:

1.  **Roles**:
    - `Admin`: Acceso total a todas las secciones y edición de datos.
    - `Closer`: Acceso restringido únicamente al Formulario de Ventas.
2.  **Sincronización**: Los perfiles se crean automáticamente mediante un Trigger en Supabase tras el registro exitoso. El esquema completo se encuentra en `database/schema.sql`.
3.  **Identidad (Onboarding)**: Los usuarios deben elegir un `username` único al primer ingreso. Esto garantiza la trazabilidad en Discord y en el header de la webapp.
4.  **Protección**: La validación de roles se realiza en el servidor (Server Components) para prevenir accesos no autorizados.

## 📧 Configuración de Mensajería (Resend)

Para garantizar la entrega de correos institucionales, se ha integrado **Resend** como proveedor SMTP:

### Configuración DNS (Vercel)
Se deben añadir los registros MX, TXT y CNAME proporcionados por Resend en el panel de DNS de Vercel para el dominio `finvora.mx`.

### Configuración SMTP en Supabase
- **Host**: `smtp.resend.com`
- **Port**: `587`
- **User**: `resend`
- **Password**: `[API_KEY_RESEND]`
- **Sender**: `noreply@finvora.mx`

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
- **Campos**: Incluye datos del cliente, equipo, enganche, fecha/hora de entrega y comentarios opcionales.

## 📱 Desarrollo y Pruebas Móviles

Para probar la aplicación en dispositivos físicos (iPhone/Android) durante el desarrollo local:

1.  **Red Local**: Acceder mediante la IP de la máquina (ej: `http://192.168.1.5:3000`).
2.  **Configuración de Origen**: Es necesario actualizar `allowedDevOrigins` en `next.config.ts` con la IP actual para permitir la carga de recursos de Next.js y el funcionamiento de componentes interactivos (como el menú hamburguesa o selectores de fecha).

---
*Documento de uso interno - Finvora 2026*
