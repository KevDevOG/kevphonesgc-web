# KevPhonesGC

## Descripción
Plataforma web para la gestión de compra y venta de dispositivos electrónicos en Canarias.

## Funcionalidades

### Públicas
- Catálogo de stock disponible
- Asistente de cotización de iPhone
- Valoración de entrega como parte de pago (trade-in)
- Flujo de solicitud de venta de dispositivos
- Subida guiada y privada de fotografías
- Contacto vía WhatsApp
- Reseñas
- Preguntas frecuentes (FAQ)
- Páginas legales

### Administración
- Gestión de inventario
- Compras y ventas
- Clientes
- Gastos
- Movimientos de capital
- Panel financiero (Dashboard)
- Solicitudes de venta
- Configuración de cotizaciones
- Gestión de imágenes del catálogo de modelos
- Reseñas
- Configuración del negocio

*Nota: La versión V1 no incluye pagos online.*

## Tecnologías
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Server Actions
- Vercel

## Arquitectura
La aplicación está dividida en dos áreas principales:

**Pública:** Rutas accesibles para clientes, incluyendo `/`, `/cotizar` y `/vender`.
**Administración:** Rutas protegidas bajo `/admin`.

El backend está construido de manera serverless:
- Interacción mediante Server Actions de Next.js
- Supabase PostgreSQL como base de datos primaria
- Row Level Security (RLS) para proteger los datos a nivel de tabla
- RPCs (SECURITY DEFINER) para operaciones críticas
- Supabase Storage privado para alojar las imágenes de las solicitudes de venta

Las operaciones sensibles (Service Role) permanecen estrictamente limitadas al entorno del servidor (server-only).

## Seguridad
- Autenticación segura de administrador
- Autorización estricta basada en el identificador del administrador
- Row Level Security (RLS) habilitado
- Bucket de subida de imágenes privado
- URLs firmadas para subida de archivos (Signed Upload URLs)
- Validación de sesiones de subida
- Validación estricta de entradas en tiempo de ejecución (runtime input validation)
- Cabeceras de seguridad HTTP

## Variables de entorno
Para ejecutar el proyecto, es necesario configurar las siguientes variables de entorno:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

**Importante:** `SUPABASE_SERVICE_ROLE_KEY` confiere privilegios totales de administrador sobre la base de datos y jamás debe ser expuesta al navegador.

## Desarrollo local

Instalar dependencias:
```bash
npm install
```

Iniciar el servidor de desarrollo:
```bash
npm run dev
```

Construir para producción:
```bash
npm run build
```

## Base de datos
Las migraciones de Supabase PostgreSQL se encuentran en el directorio:
`supabase/migrations/`

Las migraciones deben aplicarse secuencialmente y en orden estricto antes de cualquier despliegue a producción.

## Despliegue
El proyecto está configurado para su despliegue óptimo en **Vercel**.

Checklist para producción:
- Configurar variables de entorno
- Verificar migraciones de Supabase
- Verificar buckets de Storage y políticas
- Ejecutar `npm run build`
- Desplegar en Vercel
- Configurar `NEXT_PUBLIC_SITE_URL` con el dominio HTTPS final
- Verificar manualmente los flujos públicos y administración

## Estado del proyecto
V1 en fase final de preparación para producción.
