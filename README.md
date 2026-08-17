# 📱 Finvora - Aplicación Web ERP + CRM & Catálogo Comercial

Este repositorio contiene la aplicación web de **Finvora**, un proyecto unificado que integra tanto la **landing page y catálogo comercial público** (para captación y cotización de clientes finales) como el **portal corporativo privado** que actúa como **ERP** (para la gestión y auditoría del inventario físico por IMEI, logística de repartos por zonas y cálculo de sueldos/comisiones) y como **CRM** (para el registro de clientes, expedientes de crédito a plazos, auditoría de pagos semanales y seguimiento de cobranza). Al estar consolidados en un mismo desarrollo, ambos módulos comparten la misma base de datos e infraestructura en tiempo real. El sistema utiliza una arquitectura moderna basada en Next.js (App Router), Supabase para la infraestructura de datos y autenticación, y Resend para la mensajería transaccional.

---

## 🛠 Tecnologías Utilizadas

- **Frontend**: Next.js (App Router) con React y Tailwind CSS.
- **Base de Datos y Auth**: Supabase (PostgreSQL + GoTrue).
- **Almacenamiento Multimedia**: Supabase Storage (Bucket público para activos de celulares y comprobantes).
- **Procesamiento de Imágenes**: Canvas HTML5 local (Normalizador de márgenes y conversor WebP).
- **Email Service**: Resend (vía SMTP personalizado).
- **Notificaciones**: Discord Webhooks (Notificaciones de ventas, comprobantes y órdenes de garantía en tiempo real con canales dedicados).
- **Hosting y DNS**: Vercel.
- **Librerías Extra**: XLSX (Generación de reportes Excel) y jsPDF + jsPDF-AutoTable (Generación dinámica de recibos en PDF en el cliente).
- **Arquitectura de Datos**: Capa de paginación por lotes (*Chunks*) para escalabilidad infinita y superación de límites de API.

---
*Desarrollado por Jsoza para Finvora 2026*
