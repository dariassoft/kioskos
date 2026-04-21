# 🧠 AGENTS.md — Contexto Maestro del Sistema Kioskos & Despenzas

> **Propósito de este archivo:** Documento de referencia única y completa para el desarrollo del sistema ERP/POS SaaS **Kioskos & Despenzas**. Diseñado para ser leído por modelos de IA (Cursor, Windsurf, Claude, Gemini) y desarrolladores humanos. Contiene arquitectura, decisiones técnicas, esquemas, código de referencia y el roadmap de implementación completo.

---

## 🚦 ESTADO DEL PROYECTO — Última actualización: Abril 2026

| Fase | Estado | Descripción |
|---|---|---|
| **Fase 1** — Infraestructura y Auth | ✅ **COMPLETA** | Docker, NestJS, JWT, Multi-tenant, SuperAdmin, Billing |
| **Fase 2** — Inventario | ✅ **COMPLETA** | Productos, Stock Multisucursal, Categorías, Precios, Alerts WS |
| **Fase 3** — POS, Clientes, Caja | ✅ **COMPLETA** | Terminal POS, Fiados, CashRegister |
| **Fase 4** — Compras y Contabilidad | ✅ **COMPLETA** | Proveedores, OC, Asientos automáticos |
| **Fase 5** — BI y Reportes | ✅ **COMPLETA** | Dashboard, PDF/Excel, Recharts |
| **Fase 6** — SuperAdmin Panel Completo | ✅ **COMPLETA** | Billing, Suscripciones, Pagos, Planes, MRR |
| **Fase 7** — Gestión de Sucursales y Usuarios | ✅ **COMPLETA** | CRUD Branches, Usuarios por Sucursal, Settings |
| **Fase 8** — Hardening y Deploy VPS | ✅ **COMPLETA** | Migraciones, CI/CD, SSL, Backups, Git Deploy |
| **Fase 9** — Facturación Electrónica AFIP | 🚀 **EN PROGRESO** | Integración completa POS + Generación CAE + PDF |

---

## 🔐 CREDENCIALES DE PRUEBA (localhost)

| Usuario | Email | Contraseña | Rol | Acceso |
|---|---|---|---|---|
| **SuperAdmin** | `superadmin@kioskos.com` | `password123` | `superadmin` | Panel `/superadmin` (dueño de la plataforma) |
| **Admin Demo** | `demo@kioskos.com` | `password123` | `admin` | Panel `/dashboard` (dueño de kiosko demo) |

> Los datos se cargan ejecutando: `docker cp backend/src/database/seed.sql kioskos_mysql:/tmp/seed.sql && docker exec kioskos_mysql sh -c "mysql -u dev_user -pdev_password kioskos_db < /tmp/seed.sql"`

---

## ⚠️ PROBLEMAS CONOCIDOS Y DECISIONES TÉCNICAS

### 🐛 Bug DNS en Docker exec
Cuando se corre `docker exec kioskos_api sh -c "npx ts-node src/seed.ts"`, el proceso nuevo NO hereda el DNS interno de Docker (hostname `db` no resuelve). El proceso principal (PID 1) SÍ resuelve porque fue iniciado por Docker Compose con la red configurada. **Solución permanente:** usar `seed.sql` directamente en el contenedor MySQL.

### 🔧 node_modules en contenedores
Al hacer `docker compose down`, los volúmenes anónimos de node_modules se eliminan. Usar `docker compose stop` para pausar sin perder volúmenes. Si se perdieron: `docker compose build client && docker compose up -d`. El Dockerfile del cliente ahora ejecuta `npm install` en el CMD para garantizar dependencias frescas.

### 📌 Seed Data (datos por defecto)
El archivo `backend/src/database/seed.sql` contiene los inserts para:
- Tenant sistema (SuperAdmin platform)
- Tenant demo (Kiosko de prueba)
- Usuarios demo (superadmin + admin)
- Sucursal "Casa Central"
- Unidades de medida (Unidad, Kg, Litro)
- Lista de precios "Minorista"
- Categorías base (Bebidas, Snacks, Lácteos, Limpieza)
- Planes de suscripción (Emprendedor, Negocio, Profesional)

### 📁 Archivos implementados hasta Fase 2

```
backend/src/
  ✅ common/base.entity.ts
  ✅ common/decorators/get-tenant.decorator.ts
  ✅ common/decorators/roles.decorator.ts
  ✅ common/guards/jwt-auth.guard.ts
  ✅ common/guards/roles.guard.ts
  ✅ common/guards/superadmin.guard.ts
  ✅ auth/ (module, service, controller, dto, jwt.strategy)
  ✅ tenants/ (module, service, controller, middleware, entities)
  ✅ billing/ (module, service, controller, entities: Plan, Subscription, BillingHistory)
  ✅ inventory/
     ✅ entities/ (Branch, Unit, Category, PriceList, Product, ProductPrice, Inventory)
     ✅ dto/inventory.dto.ts
     ✅ events/stock-reduced.event.ts
     ✅ inventory.module.ts
     ✅ inventory.service.ts    (CRUD productos, stock multi-branch, precios, quickSearch)
     ✅ inventory.controller.ts (todos los endpoints RESTful + bulk-update)
     ✅ inventory.listener.ts   (escucha 'stock.reduced' → WebSocket alert)
  ✅ notifications/gateway.ts  (WebSocket rooms por tenant)
  ✅ sales/     
     ✅ entities/ (Customer, CashRegister, Sale, SaleItem)
     ✅ dto/sales.dto.ts
     ✅ events/sale-completed.event.ts
     ✅ sales.service.ts  (Fiados, apertura de caja, facturación)
     ✅ sales.controller.ts
     ✅ sales.module.ts
  ✅ accounting/
     ✅ entities/accounting-ledger.entity.ts
     ✅ accounting.service.ts (Libro diario manual y automático)
     ✅ accounting.listener.ts (Asientos automáticos de compras y ventas)
     ✅ accounting.controller.ts
  ✅ purchases/
     ✅ entities/ (Supplier, PurchaseOrder, PurchaseOrderItem)
     ✅ purchases.service.ts (Recepción de OC aumenta stock)
     ✅ purchases.controller.ts
  ✅ reports/
     ✅ reports.service.ts (Dashboard metyrics, Top Products, Weekly charts)
     ✅ reports.controller.ts
     ✅ reports.module.ts

frontend/src/
  ✅ layouts/ (AdminLayout, AuthLayout, PosLayout, SuperAdminLayout)
  ✅ store/ (auth.store, branch.store, cart.store)
  ✅ api/client.ts
  ✅ api/inventory.api.ts   ← NUEVO Fase 2
  ✅ api/inventory.types.ts ← NUEVO Fase 2
  ✅ hooks/useInventory.ts  ← NUEVO Fase 2
  ✅ pages/auth/LoginPage.tsx
  ✅ pages/DashboardPage.tsx
  ✅ pages/inventory/
     ✅ InventoryPage.tsx   (Rediseño Hub: Menu Cards/List + Nav Back)
     ✅ ProductsPage.tsx    (Grid visual premium + modal avanzado + supplier/brand inline + internal_code restored)
     ✅ MassivePricingPage.tsx (NUEVO: Actualización masiva por brand/category/supplier)
     ✅ StockPage.tsx       (selector sucursal + alertas + modal agregar stock)
     ✅ CategoriesPage.tsx  (grid visual con colores)
     ✅ BrandsPage.tsx      (NUEVO: Gestión formal de marcas)
  ✅ pages/pos/PosPage.tsx  (Terminal completo con búsqueda, carrito, cobro)
  ✅ pages/customers/CustomersPage.tsx (Fiados, límites de crédito, pagos)
  ✅ pages/accounting/AccountingPage.tsx (Libro Diario)
  ✅ pages/purchases/PurchasesPage.tsx (Órdenes y Proveedores)
   ✅ pages/superadmin/SuperAdminDashboard.tsx  (MRR, gráfico ingresos, alertas vencimiento)
   ✅ pages/superadmin/TenantsPage.tsx          (lista + activar/suspender)
   ✅ pages/superadmin/BillingPage.tsx          ← NUEVO Fase 6 (historial pagos + registrar pago)
   ✅ pages/superadmin/SubscriptionsPage.tsx    ← NUEVO Fase 6 (gestión suscripciones + cambiar plan)
   ✅ pages/superadmin/PlansPage.tsx            ← NUEVO Fase 6 (CRUD planes con features toggle)
   ✅ pages/afip/AfipInvoicesPage.tsx           ← NUEVO Fase 9 (listado de facturas electrónicas)
   ✅ pages/settings/tabs/AfipTab.tsx           ← NUEVO Fase 9 (configuración AFIP en Settings)
   ✅ components/NotificationDropdown.tsx      ← NUEVO (Alertas tiempo real)
   ✅ components/ReplenishmentAssistant.tsx    ← NUEVO (Asistente IA de compras)
   ✅ store/notification.store.ts              ← NUEVO (Estado global alertas)
```

### ⚙️ Decisiones técnicas tomadas en Fase 2

1. **`category` como entidad separada** con campo `color` (hex) para badge visual en el POS.
2. **`cost_price` en `Product`** para calcular margen de ganancia en reportes (Fase 5).
3. **`quickSearch` endpoint** en inventario para uso exclusivo del POS: busca por nombre, EAN o código interno, devuelve precio por lista default.
4. **Docker compose usa `target: development`** en el servicio `client` para evitar el build stage (Vite) dentro del contenedor.
5. **`InventoryListener` inyecta `NotificationsGateway`** directamente — `NotificationsModule` exporta el Gateway para poder importarlo en `InventoryModule`.

### 🔐 Decisiones técnicas tomadas en Fase 9 (Facturación Electrónica AFIP)

1. **Encriptación AES-256-CBC:** Todos los datos sensibles AFIP (CUIT, certificados, claves, tokens) se almacenan encriptados en la DB usando una clave derivada con `scrypt` desde `AFIP_ENCRYPTION_SECRET`.
2. **SDK @afipsdk/afip.js:** Se usa el SDK oficial de AfipSDK para comunicación con los servicios WSAA y WSFEv1 de AFIP.
3. **Dos modos de autenticación:**
   - `access_token` (recomendado para simplicidad, token gratuito de afipsdk.com)
   - `certificate` (avanzado, requiere certificado .crt + clave .key de AFIP)
4. **Determinación automática del tipo de comprobante:** Monotributista siempre emite Factura C, Responsable Inscripto emite A (si receptor tiene CUIT) o B (consumidor final).
5. **Modo homologación:** Por defecto `production_mode: false` para testing en ambiente de AFIP sin validez fiscal. Solo se activa producción cuando el usuario lo confirma explícitamente.
6. **Feature por plan:** El módulo `electronic_invoicing` se agregó al JSON `features` de los planes Negocio y Profesional. El servicio valida con `BillingService.isFeatureEnabled()` antes de cada operación.
7. **Persistencia de respuesta AFIP completa:** El campo `afip_response` (JSON) almacena toda la respuesta de AFIP para auditoría y debugging.
8. **Integración Directa con POS:** Se añadió un toggle en el terminal de ventas para emitir factura ARCA en el momento del cobro. El sistema valida si el negocio tiene el módulo habilitado y configurado antes de mostrar la opción.
9. **Determinación Inteligente de Receptor:** Si el cliente seleccionado tiene CUIT/DNI guardado, se precarga en el formulario de facturación. En caso contrario, permite el ingreso manual de datos fiscales del receptor.

### 📦 Mejoras de Inventario y Gestión de Precios (Abril 2026)

1. **Gestión Proactiva de Stock**: Se añadió `min_stock_alert` a nivel de producto con alertas visuales y sonoras.
2. **Precios de Venta Inteligentes**: El sistema ahora diferencia entre Precio de Costo y Precio de Venta. Al crear un producto, se puede definir el margen (%) o valor fijo, con sugerencias automáticas (+35% sugerido).
3. **Actualización Masiva de Precios**: Nueva herramienta de BI que permite ajustar precios en bloque filtrando por Categoría, Marca o Proveedor.
4. **Proveedores y Marcas Dinámicos**: Integración con el módulo de compras e inventario que permite crear proveedores y marcas "sobre la marcha" desde el modal de productos.
5. **Inventario Hub (Navegación Intuitiva)**: El módulo de inventario ahora funciona como un hub con selector de vista (Cards/Lista) y navegación optimizada con botones de regreso.
6. **Diseño Premium Grid**: El catálogo de productos se rediseñó como una grilla de cards visuales optimizada para dispositivos móviles (Zero Horizontal Scroll).
6. **Automatización Contable Configurable**: El administrador puede decidir desde *Ajustes de Negocio* si los movimientos de stock generan automáticamente asientos de pérdida en el Libro Diario.
7. **Mobile-First UX (Cero Scroll Horizontal)**: Se aplicaron restricciones estrictas de overflow y rediseño de componentes críticos (Header, Modales, POS) para garantizar una navegación fluida en dispositivos móviles, eliminando desplazamientos laterales.

---

## 📌 ÍNDICE

1. [Visión General del Producto](#1-visión-general-del-producto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Carpetas del Proyecto](#4-estructura-de-carpetas-del-proyecto)
5. [Configuración de Infraestructura (Docker)](#5-configuración-de-infraestructura-docker)
6. [Variables de Entorno (.env)](#6-variables-de-entorno-env)
7. [Esquema de Base de Datos](#7-esquema-de-base-de-datos)
8. [Arquitectura Multi-tenant](#8-arquitectura-multi-tenant)
9. [Módulos del Backend (NestJS)](#9-módulos-del-backend-nestjs)
10. [Código de Referencia Crítico](#10-código-de-referencia-crítico)
11. [Módulos del Frontend (React)](#11-módulos-del-frontend-react)
12. [Planes de Suscripción](#12-planes-de-suscripción)
13. [Seguridad y Puntos Críticos](#13-seguridad-y-puntos-críticos)
14. [Roadmap de Implementación](#14-roadmap-de-implementación)
15. [Reglas para la IA](#15-reglas-para-la-ia)

---

## 1. Visión General del Producto

** Kioskos & Despenzas ** es un sistema **ERP + POS SaaS Multi-tenant** diseñado para kioskos, despensas y pequeños/medianos comercios. Cada negocio (tenant) tiene un entorno aislado y accede a los módulos correspondientes según su plan de suscripción.

### Módulos Principales

| Módulo | Descripción |
|---|---|
| **POS (Punto de Venta)** | Terminal de venta rápida. Soporte para efectivo, tarjeta y "fiados". |
| **Inventario** | Control de stock multisucursal, alertas automáticas, códigos de barras (EAN/UPC). |
| **Clientes y Fiados** | Cuentas corrientes por cliente, historial de deudas, límites de crédito. |
| **Proveedores y Compras** | Registro de facturas de compra y actualización automática de stock y costos. |
| **Caja Registradora** | Flujo de Apertura → Ventas → Cierre de Caja con conciliación. |
| **Contabilidad** | Asientos contables automáticos (Debe/Haber) por cada evento financiero. |
| **Reportes y BI** | Dashboard en tiempo real, exportación PDF/Excel, análisis de márgenes. |
| **SuperAdmin Panel** | Panel exclusivo del dueño de la app para gestión de tenants y suscripciones. |

---

## 2. Stack Tecnológico

### Backend
- **Framework:** NestJS (Node.js) con TypeScript
- **ORM:** TypeORM (estrategia portable MySQL ↔ PostgreSQL)
- **Base de Datos:** MySQL 8.0 (inicial) → PostgreSQL (producción/migración)
- **Autenticación:** Passport.js + JWT (JSON Web Tokens)
- **Eventos en tiempo real:** `@nestjs/event-emitter` + Socket.io (WebSockets)
- **Tareas programadas:** `@nestjs/schedule` (Cron Jobs)
- **Configuración:** `@nestjs/config` + `.env`
- **Documentación API:** Swagger (OpenAPI 3.0)
- **Logs:** Winston o Pino (trazabilidad por `tenant_id`)

### Frontend
- **Framework:** React.js + Vite
- **Estilos:** Tailwind CSS + Shadcn/UI
- **Estado del Servidor:** TanStack Query v5 (React Query)
- **Estado Global UI:** Zustand
- **Formularios:** React Hook Form + Zod (validación)
- **Tablas:** TanStack Table (React Table)
- **Gráficos:** Recharts
- **Exportación:** ExcelJS + PDFKit

### Infraestructura
- **Contenedores:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Storage:** AWS S3 (logos, assets de tenants)
- **Cache/Sesiones:** Redis
- **Backup:** Script automático dump MySQL → S3 (cada 24h)

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE / BROWSER                       │
│                  React (Vite) - Puerto 5173                 │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND - NestJS API                      │
│                       Puerto 3000                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │AuthModule│  │TenantMod │  │Inventory │  │SalesMod  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │AccountMod│  │BillingMod│  │ReportMod │  │NotifMod  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│       TenantMiddleware → extrae tenant_id del JWT           │
└────────────┬──────────────────────────────────┬────────────┘
             │ TypeORM                           │ Socket.io
             ▼                                  ▼
┌─────────────────────┐            ┌─────────────────────────┐
│  MySQL 8.0 / PgSQL  │            │      Redis (Cache)       │
│    Puerto 3306       │            │      Puerto 6379         │
└─────────────────────┘            └─────────────────────────┘
```

### Patrón de Multi-tenancy: **Aislamiento por Columna Discriminadora**

Todas las tablas de datos de negocio contienen `tenant_id: UUID`. El backend extrae este ID del token JWT y lo inyecta automáticamente en cada consulta. **El frontend NUNCA envía el `tenant_id`** en el cuerpo de la petición.

---

## 4. Estructura de Carpetas del Proyecto

```
gestión360/
├── docker-compose.yml          # Orquestación de contenedores
├── .env                        # Variables de entorno (NO subir a Git)
├── .gitignore
│
├── backend/                    # Aplicación NestJS
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts             # Bootstrap (CORS, Swagger, WebSockets)
│       ├── app.module.ts       # Módulo raíz (TenantMiddleware global)
│       ├── common/
│       │   ├── base.entity.ts          # BaseG360Entity (id, tenant_id, timestamps)
│       │   ├── decorators/
│       │   │   └── get-tenant.decorator.ts
│       │   └── guards/
│       │       ├── jwt-auth.guard.ts
│       │       └── roles.guard.ts
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts
│       │   └── dto/
│       │       ├── login.dto.ts
│       │       └── register.dto.ts
│       ├── tenants/
│       │   ├── tenant.module.ts
│       │   ├── tenant.middleware.ts    # Inyecta tenantId en cada request
│       │   ├── tenant.entity.ts
│       │   └── tenant.service.ts
│       ├── billing/
│       │   ├── billing.module.ts
│       │   ├── plans.entity.ts
│       │   ├── subscriptions.entity.ts
│       │   ├── billing-history.entity.ts
│       │   └── billing.service.ts
│       ├── inventory/
│       │   ├── inventory.module.ts
│       │   ├── products.entity.ts
│       │   ├── inventory.entity.ts
│       │   ├── branches.entity.ts
│       │   ├── inventory.service.ts
│       │   ├── inventory.controller.ts
│       │   ├── inventory.listener.ts   # Escucha evento stock.reduced
│       │   └── events/
│       │       └── stock-reduced.event.ts
│       ├── sales/
│       │   ├── sales.module.ts
│       │   ├── sales.entity.ts
│       │   ├── sale-items.entity.ts
│       │   ├── customers.entity.ts
│       │   ├── cash-registers.entity.ts
│       │   ├── sales.service.ts
│       │   └── sales.controller.ts
│       ├── accounting/
│       │   ├── accounting.module.ts
│       │   ├── accounting-ledger.entity.ts
│       │   ├── accounting.listener.ts  # Escucha eventos de ventas → asientos
│       │   └── accounting.service.ts
│       ├── purchases/
│       │   ├── purchases.module.ts
│       │   ├── suppliers.entity.ts
│       │   ├── purchase-orders.entity.ts
│       │   └── purchases.service.ts
│       ├── reports/
│       │   ├── reports.module.ts
│       │   └── reports.service.ts
│       └── notifications/
│           ├── notifications.module.ts
│           └── notifications.gateway.ts  # WebSocket Gateway
│
└── frontend/                   # Aplicación React (Vite)
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── store/              # Zustand stores
        │   ├── auth.store.ts
        │   └── branch.store.ts
        ├── api/                # Clientes HTTP (Axios / Fetch)
        │   └── client.ts
        ├── hooks/              # TanStack Query hooks
        ├── components/         # Shadcn/UI components
        ├── pages/
        │   ├── auth/
        │   ├── pos/            # Interfaz POS optimizada para teclado/táctil
        │   ├── inventory/
        │   ├── customers/
        │   ├── reports/
        │   ├── accounting/
        │   └── superadmin/     # Solo rol SUPERADMIN
        └── layouts/
            ├── AdminLayout.tsx
            └── PosLayout.tsx
```

---

## 5. Configuración de Infraestructura (Docker)

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: g360_mysql
    #restar: always
    environment:
      MYSQL_DATABASE: kioskos_db
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_USER: dev_user
      MYSQL_PASSWORD: dev_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - g360_network

  redis:
    image: redis:7-alpine
    container_name: g360_redis
    ports:
      - "6379:6379"
    networks:
      - g360_network

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: g360_api
    #restar: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_HOST=db
      - DATABASE_PORT=3306
      - DATABASE_USER=dev_user
      - DATABASE_PASSWORD=dev_password
      - DATABASE_NAME=kioskos_db
      - JWT_SECRET=super_secret_key_2026
      - REDIS_HOST=redis
    volumes:
      - ./backend:/usr/src/app
      - /usr/src/app/node_modules
    depends_on:
      - db
      - redis
    networks:
      - g360_network

  client:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: g360_client
    #restar: always
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/usr/src/app
      - /usr/src/app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - api
    networks:
      - g360_network

  adminer:
    image: adminer
    container_name: g360_adminer
    ports:
      - "8080:8080"
    networks:
      - g360_network

networks:
  g360_network:
    driver: bridge

volumes:
  mysql_data:
```

> **Dockerfile Backend (Multi-etapa para producción):** Usar `FROM node:20-alpine AS builder` para minimizar la imagen final.

---

## 6. Variables de Entorno (.env)

```bash
# ==========================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ==========================================
NODE_ENV=development
APP_PORT=3000
APP_NAME="Kioskos_API"
APP_URL=http://localhost:3000

# ==========================================
# BASE DE DATOS (DOCKER/LOCAL)
# ==========================================
DB_TYPE=mysql
DB_HOST=db             # Si es fuera de Docker: localhost
DB_PORT=3306
DB_USERNAME=dev_user
DB_PASSWORD=dev_password
DB_DATABASE=kioskos_db
DB_SYNCHRONIZE=true    # ⚠️ Desactivar en producción (usar migraciones)
DB_LOGGING=true

# ==========================================
# SEGURIDAD Y AUTENTICACIÓN
# ==========================================
JWT_SECRET=clavesecreta_2026_para_desarrollo_local
JWT_EXPIRES_IN=8h

# ==========================================
# REDIS (Cache y WebSockets)
# ==========================================
REDIS_HOST=redis
REDIS_PORT=6379

# ==========================================
# CORREO (SMTP para alertas)
# ==========================================
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=tu_usuario
MAIL_PASS=tu_password
MAIL_FROM="noreply@kioskos.com"

# ==========================================
# STORAGE (Logos de clientes)
# ==========================================
S3_ACCESS_KEY=tus_credenciales
S3_SECRET_KEY=tus_credenciales
S3_BUCKET=kioskos-assets
```

> ⚠️ **NUNCA** subir el `.env` al repositorio. Agregarlo al `.gitignore` de inmediato.

---

## 7. Esquema de Base de Datos

### 7.1 Tablas del SuperAdmin (Control de Plataforma)

```sql
-- Planes disponibles (configurados por el SuperAdmin)
CREATE TABLE plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,         -- 'Emprendedor', 'Negocio', 'Profesional'
    description TEXT,
    price_monthly DECIMAL(12,2) NOT NULL,
    max_branches INT DEFAULT 1,
    max_users INT DEFAULT 1,
    features JSON,                     -- {"accounting": true, "multisite": true, ...}
    is_active BOOLEAN DEFAULT true
);

-- Negocios / Clientes (Tenants)
CREATE TABLE tenants (
    id VARCHAR(36) PRIMARY KEY,
    business_name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(50) UNIQUE,         -- CUIT/CUIL en Argentina
    owner_email VARCHAR(100) NOT NULL,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active','suspended','trial','past_due') DEFAULT 'trial'
);

-- Suscripciones activas
CREATE TABLE subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(id),
    plan_id VARCHAR(36) REFERENCES plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    last_payment_date TIMESTAMP,
    next_billing_date DATE
);

-- Historial de cobros
CREATE TABLE billing_history (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_status ENUM('paid','pending','failed'),
    payment_method VARCHAR(50),        -- 'MercadoPago', 'Transferencia'
    invoice_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7.2 Tablas del Negocio (ERP/POS por Tenant)

```sql
-- ==========================================
-- ORGANIZACIÓN Y ACCESO
-- ==========================================

-- Sucursales
CREATE TABLE branches (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_main_branch BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios del negocio
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) REFERENCES branches(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','manager','cashier') NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- ==========================================
-- CATÁLOGO DE PRODUCTOS E INVENTARIO
-- ==========================================

-- Unidades de medida
CREATE TABLE units (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,         -- 'Kilogramo', 'Unidad', 'Litro'
    abbreviation VARCHAR(10)           -- 'Kg', 'Un', 'Lt'
);

-- Listas de precios
CREATE TABLE price_lists (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,        -- 'Minorista', 'Mayorista'
    is_default BOOLEAN DEFAULT false
);

-- Productos base
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    unit_id VARCHAR(36) REFERENCES units(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    barcode VARCHAR(100),              -- EAN/UPC para impresión y scanner
    internal_code VARCHAR(50),
    category_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Precios por lista (relación muchos-a-muchos con precio)
CREATE TABLE product_prices (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) REFERENCES products(id),
    price_list_id VARCHAR(36) REFERENCES price_lists(id),
    price DECIMAL(15,2) NOT NULL DEFAULT 0.00
);

-- Stock multisucursal con alertas
CREATE TABLE inventory (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) REFERENCES branches(id),
    product_id VARCHAR(36) REFERENCES products(id),
    stock_quantity DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    min_stock_alert DECIMAL(15,2) DEFAULT 5.00,
    last_restock_date TIMESTAMP
);

-- ==========================================
-- CLIENTES Y VENTAS (POS)
-- ==========================================

-- Clientes (con soporte para Fiados)
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    current_debt DECIMAL(15,2) DEFAULT 0.00        -- Sistema de Fiados
);

-- Ventas (transacciones POS)
CREATE TABLE sales (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) REFERENCES branches(id),
    user_id VARCHAR(36) REFERENCES users(id),
    customer_id VARCHAR(36) REFERENCES customers(id),
    total DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash','card','transfer','credit_client') NOT NULL,
    status ENUM('completed','refunded','pending') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ítems de cada venta
CREATE TABLE sale_items (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) REFERENCES sales(id),
    product_id VARCHAR(36) REFERENCES products(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL
);

-- ==========================================
-- CAJA Y CONTABILIDAD
-- ==========================================

-- Sesiones de Caja
CREATE TABLE cash_registers (
    id VARCHAR(36) PRIMARY KEY,
    branch_id VARCHAR(36) REFERENCES branches(id),
    user_id VARCHAR(36) REFERENCES users(id),
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2),
    cash_sales DECIMAL(15,2) DEFAULT 0,
    status ENUM('open','closed') DEFAULT 'open',
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Libro Diario (Asientos Contables automáticos)
CREATE TABLE accounting_ledger (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    sale_id VARCHAR(36) REFERENCES sales(id),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    account_name VARCHAR(100) NOT NULL, -- 'Caja', 'Ventas', 'Costo Mercadería'
    debit DECIMAL(15,2) DEFAULT 0.00,
    credit DECIMAL(15,2) DEFAULT 0.00
);

-- Devoluciones
CREATE TABLE returns (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) REFERENCES sales(id),
    reason TEXT,
    refund_amount DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proveedores
CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    tax_id VARCHAR(50)
);

-- Órdenes de Compra
CREATE TABLE purchase_orders (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) REFERENCES suppliers(id),
    branch_id VARCHAR(36) REFERENCES branches(id),
    total DECIMAL(15,2) NOT NULL,
    status ENUM('pending','received','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Arquitectura Multi-tenant

### Principios fundamentales

1. **`tenant_id` viene SIEMPRE del JWT, nunca del body de la petición**
2. **Cada query a la DB incluye siempre `WHERE tenant_id = :tenantId`**
3. **WebSocket rooms son `tenant_<id>`** para aislar notificaciones

### BaseEntity (Todas las entidades heredan de esta)

```typescript
// backend/src/common/base.entity.ts
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

export abstract class BaseG360Entity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  tenant_id: string; // Discriminador Multi-tenant CRÍTICO

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

---

## 9. Módulos del Backend (NestJS)

| Módulo | Descripción | Guards | Eventos emitidos |
|---|---|---|---|
| `AuthModule` | Login, Register, JWT Strategy | Público | — |
| `TenantModule` | CRUD negocios, configuración | SUPERADMIN | — |
| `BillingModule` | Planes, suscripciones, historial | SUPERADMIN | — |
| `InventoryModule` | Productos, stock, sucursales, barcodes | JwtAuth | `stock.reduced` |
| `SalesModule` | POS, caja, fiados, devoluciones | JwtAuth | `sale.completed` |
| `AccountingModule` | Asientos contables automáticos | JwtAuth | Escucha `sale.completed` |
| `PurchasesModule` | Proveedores, órdenes de compra | JwtAuth | `purchase.received` |
| `ReportsModule` | Generación PDF/Excel, BI | JwtAuth | — |
| `NotificationsModule` | WebSocket Gateway (alertas tiempo real) | — | Escucha todos |

### Roles del Sistema

| Rol | Alcance |
|---|---|
| `SUPERADMIN` | Portal del dueño de la app. Ve todos los tenants, suscripciones, MRR. |
| `OWNER` / `ADMIN` | Dueño del negocio. Acceso total a los módulos del plan contratado. |
| `MANAGER` | Gerente de sucursal. Puede ver reportes y configurar inventario. |
| `CASHIER` | Cajero. Solo accede al POS y a caja registradora. |

---

## 10. Código de Referencia Crítico

### 10.1 Tenant Middleware

```typescript
// backend/src/tenants/tenant.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;
    if (!user || !user.tenant_id) {
      throw new UnauthorizedException('No se pudo identificar el Tenant (Negocio)');
    }
    req['tenantId'] = user.tenant_id;
    next();
  }
}
```

### 10.2 Decorador @GetTenantId

```typescript
// backend/src/common/decorators/get-tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
```

### 10.3 Uso en un Controlador

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetTenantId() tenantId: string   // ← Siempre validado por el sistema
  ) {
    return this.productsService.create(createProductDto, tenantId);
  }
}
```

### 10.4 Registro del Middleware en app.module.ts

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('auth/(.*)')      // Login/Register son públicos
      .forRoutes('*');
  }
}
```

### 10.5 Sistema de Alertas de Stock (Event-Driven)

```typescript
// backend/src/inventory/events/stock-reduced.event.ts
export class StockReducedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly productId: string,
    public readonly branchId: string,
    public readonly newQuantity: number,
  ) {}
}

// backend/src/inventory/inventory.service.ts
@Injectable()
export class InventoryService {
  constructor(
    private inventoryRepo: Repository<Inventory>,
    private eventEmitter: EventEmitter2,
  ) {}

  async updateStock(productId: string, branchId: string, quantity: number, tenantId: string) {
    await this.inventoryRepo.decrement(
      { product_id: productId, branch_id: branchId, tenant_id: tenantId },
      'stock_quantity',
      quantity
    );
    const updatedInventory = await this.inventoryRepo.findOne({
      where: { product_id: productId, branch_id: branchId, tenant_id: tenantId },
      relations: ['product']
    });
    this.eventEmitter.emit('stock.reduced', new StockReducedEvent(
      tenantId, productId, branchId, updatedInventory.stock_quantity
    ));
    return updatedInventory;
  }
}

// backend/src/inventory/inventory.listener.ts
@Injectable()
export class InventoryListener {
  @OnEvent('stock.reduced')
  async handleStockReducedEvent(event: StockReducedEvent) {
    const item = await this.inventoryRepo.findOne({
      where: { product_id: event.productId, branch_id: event.branchId, tenant_id: event.tenantId },
      relations: ['product']
    });
    if (item.stock_quantity <= item.min_stock_alert) {
      this.notificationsGateway.sendLowStockAlert(event.tenantId, {
        productName: item.product.name,
        currentStock: item.stock_quantity,
        branchId: event.branchId
      });
    }
  }
}

// backend/src/notifications/notifications.gateway.ts
@WebSocketGateway({ cors: true })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  sendLowStockAlert(tenantId: string, data: any) {
    this.server.to(`tenant_${tenantId}`).emit('low_stock_alert', data);
  }
}
```

### 10.6 Configuración TypeORM en app.module.ts

```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: config.get<'mysql' | 'postgres'>('DB_TYPE'),
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_DATABASE'),
    autoLoadEntities: true,
    synchronize: config.get<boolean>('DB_SYNCHRONIZE'),  // false en producción
  }),
})
```

### 10.7 Asientos Contables automáticos

```typescript
// accounting.listener.ts
@Injectable()
export class AccountingListener {
  @OnEvent('sale.completed')
  async handleSaleCompleted(sale: Sale) {
    // Asiento Debe: Caja / Cuenta Corriente del Cliente
    await this.ledgerRepo.save({ tenant_id: sale.tenant_id, sale_id: sale.id,
      account_name: sale.payment_method === 'credit_client' ? 'Cuentas por Cobrar' : 'Caja',
      debit: sale.total, credit: 0, description: `Venta #${sale.id}` });
    // Asiento Haber: Ventas
    await this.ledgerRepo.save({ tenant_id: sale.tenant_id, sale_id: sale.id,
      account_name: 'Ventas', debit: 0, credit: sale.total, description: `Venta #${sale.id}` });
  }
}
```

---

## 11. Módulos del Frontend (React)

### Layouts

| Layout | Usado para |
|---|---|
| `AdminLayout` | Panel de gestión (inventario, reportes, configuración). Sidebar colapsable. |
| `PosLayout` | Terminal POS. Optimizado para teclado y pantallas táctiles. Sin sidebar. |
| `SuperAdminLayout` | Dashboard del dueño de la app. Solo accesible con rol SUPERADMIN. |

### Páginas y Rutas

| Ruta | Componente | Rol mínimo |
|---|---|---|
| `/auth/login` | `LoginPage` | Público |
| `/auth/register` | `RegisterPage` | Público |
| `/pos` | `PosTerminal` | CASHIER |
| `/dashboard` | `Dashboard` | MANAGER |
| `/inventory` | `InventoryPage` | MANAGER |
| `/inventory/products` | `ProductsPage` | MANAGER |
| `/inventory/barcodes` | `BarcodesPage` | MANAGER |
| `/customers` | `CustomersPage` | MANAGER |
| `/customers/debts` | `FiadosPage` | MANAGER |
| `/purchases` | `PurchasesPage` | ADMIN |
| `/accounting` | `AccountingPage` | ADMIN |
| `/reports` | `ReportsPage` | MANAGER |
| `/settings` | `SettingsPage` | ADMIN |
| `/superadmin` | `SuperAdminDashboard` | SUPERADMIN |
| `/superadmin/tenants` | `TenantsPage` | SUPERADMIN |
| `/superadmin/billing` | `BillingPage` | SUPERADMIN |

### State Management

- **TanStack Query:** Toda la comunicación con la API. Caché automático, refetch on window focus.
- **Zustand:** Estado local de UI. Stores: `useAuthStore` (user, token), `useBranchStore` (sucursal activa), `useCartStore` (carrito del POS).

---

## 12. Planes de Suscripción

| Característica | 🌱 Emprendedor | 🏪 Negocio | 🚀 Profesional |
|---|:---:|:---:|:---:|
| **Usuarios** | 1 (dueño) | Hasta 3 | Ilimitados |
| **Sucursales** | 1 | 1 | 2+ |
| **Reportes** | Últimos 30 días | Histórico | BI completo |
| **Fiados (Cuentas corrientes)** | ✅ | ✅ | ✅ |
| **Contabilidad automática** | ❌ | ✅ | ✅ |
| **Importación masiva** | ❌ | ✅ | ✅ |
| **Exportación PDF/Excel** | ❌ | ✅ | ✅ |
| **Alertas por Email** | ❌ | ❌ | ✅ |
| **Soporte** | Email | Email | WhatsApp dedicado |

La lógica de acceso a módulos se implementa con un **Guard en NestJS** que verifica la columna `features` (JSON) de la suscripción activa del tenant antes de cada endpoint.

---

## 13. Seguridad y Puntos Críticos

1. **CORS:** Configurar en `main.ts` con origen explícito (`http://localhost:5173`). No usar `origin: '*'` en producción.
2. **tenant_id:** Nunca aceptar este valor del body del request. Siempre extraer del JWT decodificado.
3. **TypeORM Portable:** Evitar funciones específicas del motor (`JSON_CONTAINS` de MySQL, etc.). Usar `QueryBuilder` estándar.
4. **`DB_SYNCHRONIZE: false` en producción.** Usar migraciones de TypeORM.
5. **Paginación desde el día 1:** Todos los endpoints de listado deben soportar `limit` y `offset`.
6. **Impresión de tickets:** Optimizar CSS para 58mm y 80mm (`@media print`).
7. **Imagenes/Logos:** Almacenar en AWS S3, no en el servidor local.
8. **Passwords:** Hashear con `bcrypt` (costo 12 mínimo).
9. **Rate Limiting:** Aplicar en endpoints de auth para prevenir fuerza bruta.
10. **Logs por tenant:** Winston/Pino con campo `tenant_id` en cada log.

---

## 14. Roadmap de Implementación

### 🏗️ FASE 1 — El Core del Sistema (Semanas 1-2)
**Objetivo:** Infraestructura funcionando, autenticación y panel SuperAdmin.

#### Semana 1 – Infraestructura y Auth
- [ ] Crear repositorio Git con estructura de monorepo (`backend/`, `frontend/`)
- [ ] Crear `docker-compose.yml` con servicios: `db`, `redis`, `api`, `client`, `adminer`
- [ ] Crear `Dockerfile` multi-etapa para backend NestJS
- [ ] Crear `Dockerfile` para frontend React (Vite)
- [ ] Configurar `.env` y `.gitignore`
- [ ] Inicializar proyecto NestJS: `nest new backend`
- [ ] Instalar dependencias: `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `mysql2`, `pg`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/jwt`, `bcrypt`, `class-validator`, `class-dto`
- [ ] Crear `BaseG360Entity` (abstract)
- [ ] Configurar TypeORM con `ConfigService` (portátil MySQL/Postgres)
- [ ] Implementar `AuthModule` (Login, Register, JWT Strategy)
- [ ] Crear entidades: `Tenant`, `User`
- [ ] Implementar `TenantMiddleware` y decorador `@GetTenantId`
- [ ] Configurar Swagger en `main.ts`
- [ ] Configurar CORS en `main.ts`

#### Semana 2 – Suscripciones y SuperAdmin Panel
- [ ] Crear entidades: `Plan`, `Subscription`, `BillingHistory`
- [ ] Implementar `BillingModule` con CRUD de planes y suscripciones
- [ ] Crear Guard `SuperAdminGuard` (solo rol SUPERADMIN)
- [ ] Crear Guard `SubscriptionGuard` (verifica módulo activo por tenant)
- [ ] Inicializar proyecto React (Vite): `npm create vite@latest frontend -- --template react-ts`
- [ ] Instalar dependencias frontend: `tailwindcss`, `shadcn/ui`, `@tanstack/react-query`, `zustand`, `react-router-dom`, `react-hook-form`, `zod`, `axios`
- [ ] Crear `AuthLayout`, `LoginPage`, `RegisterPage`
- [ ] Crear `useAuthStore` (Zustand)
- [ ] Crear `SuperAdminLayout` y `SuperAdminDashboard` (métricas MRR básicas)
- [ ] Implementar `TenantsPage` (listar, activar/desactivar tenants)

---

### 📦 FASE 2 — Inventario Multisucursal (Semanas 3-4)

#### Semana 3 – Backend de Inventario
- [ ] Crear entidades: `Branch`, `Product`, `Unit`, `PriceList`, `ProductPrice`, `Inventory`
- [ ] Implementar `InventoryModule` con `InventoryService` y `InventoryController`
- [ ] CRUD de Productos con soporte para múltiples listas de precios
- [ ] CRUD de Categorías, Unidades de medida
- [ ] Lógica de stock por sucursal (tabla `inventory`)
- [ ] Instalar `@nestjs/event-emitter`: `npm install @nestjs/event-emitter`
- [ ] Implementar `StockReducedEvent` e `InventoryListener`
- [ ] Implementar `NotificationsGateway` (WebSocket)
- [ ] Instalar Socket.io: `npm install @nestjs/websockets socket.io`
- [ ] Endpoint de carga masiva de productos (CSV/Excel)
- [ ] Servicio de generación de códigos de barras (librería `bwip-js` o `jsbarcode`)

#### Semana 4 – Frontend de Inventario
- [ ] Crear `AdminLayout` con sidebar colapsable
- [ ] Página `ProductsPage`: tabla con filtros (TanStack Table), búsqueda, paginación
- [ ] Modal de creación/edición de producto con `react-hook-form` + `zod`
- [ ] Listas de precios: UI para gestionar precios por lista
- [ ] Indicador de stock por sucursal en la vista de producto
- [ ] Página `BarcodesPage`: selección de productos e impresión PDF
- [ ] Integrar WebSocket en el cliente para recibir alertas de stock bajo
- [ ] Componente `LowStockAlert` (toast/notificación en tiempo real)

---

### 💳 FASE 3 — POS, Clientes y Caja (Semanas 5-6) ✅ COMPLETA

#### Semana 5 – Backend POS ✅
- [x] Crear entidades: `Customer`, `Sale`, `SaleItem`, `CashRegister`
- [x] Implementar `SalesModule` con `SalesService`
- [x] Lógica de transacción de venta:
  - Decrementar stock vía `InventoryService.reduceStock()`
  - Emitir evento `sale.completed`
  - Si `payment_method === 'credit_client'`, incrementar `customer.current_debt`
- [x] Endpoint de apertura y cierre de caja (CashRegister)
- [x] Endpoints CRUD de Clientes
- [x] Endpoint de historial de deuda por cliente (Fiados)
- [x] Endpoint de búsqueda rápida de productos por nombre/código de barras (migrado a Inventory)

#### Semana 6 – Frontend POS ✅
- [x] `PosLayout` (sin sidebar, pantalla completa)
- [x] `PosTerminal`: búsqueda de productos → carrito → cobro (`PosPage.tsx`)
- [x] `useCartStore` (Zustand): items, totales, método de pago
- [x] Flujo de apertura de caja antes de primera venta (Modal obligatorio)
- [x] Modal de cierre de caja con resumen del día (incluido en Layout en la sig. fase)
- [x] Página `CustomersPage` con gestión de deudas y abonos (Fiados)
- [ ] Impresión de ticket (`@media print`, 80mm) — **diferido para Fase 5**

---

### 🏭 FASE 4 — Compras, Proveedores y Devoluciones (Semanas 7-8)

#### Semana 7 – Módulo de Compras
- [ ] Crear entidades: `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`
- [ ] Implementar `PurchasesModule` con `PurchasesService`
- [ ] Al recibir una orden de compra: incrementar stock automáticamente y actualizar `last_restock_date`
- [ ] Emitir evento `purchase.received` → `AccountingListener` registra asiento de compra
- [ ] CRUD de Proveedores

#### Semana 8 – Devoluciones y Contabilidad
- [ ] Crear entidad `Return`
- [ ] Lógica de devolución: reingresa stock, crea nota de crédito, actualiza deuda si era fiado
- [ ] Implementar `AccountingModule` con `AccountingListener`
- [ ] Listener escucha `sale.completed` → genera asientos Debe/Haber
- [ ] Listener escucha `purchase.received` → genera asientos de compra
- [ ] Endpoint de consulta de libro diario por rango de fechas
- [ ] Frontend: `AccountingPage` con tabla del libro diario y filtros

---

### 📊 FASE 5 — BI, Reportes y Personalización (Semanas 9-10)

#### Semana 9 – Dashboard y Reportes
- [ ] Implementar `ReportsModule` con endpoints de métricas:
  - Ventas por día/semana/mes
  - Productos más vendidos (top 10)
  - Margen de ganancia por producto
  - Productos con stock bajo
  - Clientes con mayor deuda
- [ ] Instalar dependencias: `exceljs`, `pdfkit`
- [ ] Endpoints de exportación:
  - `/reports/sales/excel`
  - `/reports/inventory/pdf`
  - `/reports/customers/debts/excel`
- [ ] Frontend `Dashboard`: gráficos con Recharts (ventas diarias, semanales, mensuales)
- [ ] Frontend `ReportsPage`: selección de módulo + rango de fechas + exportación

#### Semana 10 – Personalización, Pulido y Migración
- [ ] Servicio de carga de logo a AWS S3 (o local si no hay S3)
- [ ] Configuración de tickets de venta (logo, datos del negocio)
- [ ] Cron Job: verificar suscripciones por vencer (próximos 5 días) → email aviso
- [ ] Cron Job: reporte diario de stock bajo por tenant → email si tiene plan Profesional
- [ ] **Test de migración:** Cambiar `DB_TYPE=postgres`, ejecutar y validar que todo funciona
- [ ] Ajustar estilos CSS para impresión de tickets (58mm y 80mm)
- [ ] Revisar paginación en todos los endpoints de listado
- [ ] Revisar CORS, rate limiting y seguridad general
- [ ] Seed script para datos de prueba (demo tenant con productos, ventas, clientes)

---

### 🚀 FASE 6 — Hardening y Despliegue (Post-MVP)

- [ ] Cambiar `DB_SYNCHRONIZE=false` y generar migraciones de TypeORM
- [ ] Configurar GitHub Actions: build Docker → push a registry
- [ ] Configurar servidor de producción (VPS / Railway / Render)
- [ ] Configurar Nginx como reverse proxy
- [ ] Configurar SSL (Let's Encrypt)
- [ ] Configurar script de backup automático DB → S3
- [ ] Implementar Winston para logs estructurados con `tenant_id`
- [ ] Load testing básico con k6 o Artillery

---

## 15. Reglas para la IA (Skills)

> **⚠️ MÁXIMA PRIORIDAD PARA CUALQUIER AGENTE (CURSOR, WINDSURF, GEMINI, ETC.)**
> Antes de escribir código o proponer soluciones en este repositorio, DEBES leer e internalizar las reglas (skills) ubicadas en la carpeta `/skills`.

Los archivos de skills requeridos son:
1. `skills/nestjs-backend.md`: Reglas estrictas de controladores, servicios, TypeORM y seguridad.
2. `skills/react-frontend.md`: Reglas de estado de UI (Zustand, React Query), Tailwind y componentes.
3. `skills/general-architecture.md`: Principios rectores del multi-tenancy, tipado estricto y redacción.

Si una regla de la carpeta `/skills` contradice una instrucción del usuario, se debe advertir al usuario antes de violar la arquitectura establecida.

> **LEER ANTES DE GENERAR CÓDIGO**

1. **Siempre usa `BaseG360Entity` como clase base** para todas las entidades de negocio.
2. **Nunca envíes `tenant_id` desde el frontend** — extráelo siempre del JWT en el backend.
3. **Usa `QueryBuilder` de TypeORM**, no SQL nativo, para mantener portabilidad MySQL/Postgres.
4. **Tipos financieros:** Siempre `DECIMAL(15,2)`, nunca `FLOAT` o `DOUBLE`.
5. **IDs:** Siempre UUID (`VARCHAR(36)` o tipo `uuid` nativo en Postgres).
6. **Módulos desacoplados:** Cada funcionalidad en su propio módulo NestJS. La comunicación entre módulos se hace vía `EventEmitter2`, no importando servicios directamente.
7. **DTOs siempre:** Todo endpoint debe tener su DTO con validación `class-validator`.
8. **Paginación obligatoria** en cualquier endpoint que devuelva listas (`limit`, `offset`, `total`).
9. **CORS:** Configurar con origen explícito en `main.ts`. No `origin: '*'` en producción.
10. **El Módulo de Billing/SuperAdmin** solo es accesible con el Guard `SuperAdminGuard`. Los tenants nunca pueden acceder a él.
11. **Estructura de carpetas:** Respetar la estructura definida en la sección 4 de este documento.
12. **TypeScript estricto:** `strict: true` en `tsconfig.json`. No usar `any` sin justificación documentada en comentario.

---

*Última actualización: Abril 2026 | Versión del documento: 8.0 — Fase 8 completada*
*Basado en los documentos de planificación 01 al 08 del proyecto Kioskos & Despenzas.*

---

### 📝 CHANGELOG

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | Abr 2026 | Creación inicial + Fase 1 completada |
| 2.0 | Abr 2026 | Fase 2 completada: Inventario backend + frontend |
| 3.0 | Abr 2026 | Fase 3 completada: POS Terminal, Clientes (Fiados) y Caja Registradora |
| 4.0 | Abr 2026 | Fase 4 completada: Compras, Proveedores y Contabilidad |
| 5.0 | Abr 2026 | Fase 5 completada: Intelligence, Dashboard y Reportes PDF |
| 6.0 | Abr 2026 | Fase 6 completada: SuperAdmin Panel — Billing, Suscripciones, Planes, MRR |
| 7.0 | Abr 2026 | Fase 7 completada: Settings — CRUD Sucursales, Usuarios, Perfil del Negocio |
| 8.0 | Abr 2026 | Fase 8 completada: Hardening — CI/CD GitHub Actions, docker-compose.prod, SSL Traefik, Backups |
| 6.0 | Abr 2026 | Fase 6 completada: SuperAdmin Panel — Billing, Suscripciones, Planes, MRR |
| 7.0 | Abr 2026 | Fase 7 completada: Settings — CRUD Sucursales, Usuarios, Perfil del Negocio |
