# 🧠 AGENTS.md — Contexto Maestro del Sistema Kioskos & Despenzas

> **Propósito de este archivo:** Documento de referencia única y completa para el desarrollo del sistema ERP/POS SaaS **Kioskos & Despenzas**. Diseñado para ser leído por modelos de IA (Cursor, Windsurf, Claude, Gemini) y desarrolladores humanos. Contiene arquitectura, decisiones técnicas, esquemas, código de referencia y el roadmap de implementación completo.

---

## 🚦 ESTADO DEL PROYECTO — Última actualización: Septiembre 2026

| Fase | Estado | Descripción |
|---|---|---|
| **Fase 1** — Infraestructura y Auth | ✅ **COMPLETA** | Docker, NestJS, JWT, Multi-tenant, SuperAdmin, Billing |
| **Fase 2** — Inventario | ✅ **COMPLETA** | Productos, Stock Multisucursal, Categorías, Precios, Alerts WS |
| **Fase 3** — POS, Clientes, Caja | ✅ **COMPLETA** | Terminal POS, Fiados, CashRegister |
| **Fase 4** — Compras y Contabilidad | ✅ **COMPLETA** | Proveedores, OC, Asientos automáticos |
| **Fase 5** — BI y Reportes | ✅ **COMPLETA** | Dashboard, PDF/Excel, Recharts |
| **Fase 6** — SuperAdmin Panel Completo | ✅ **COMPLETA** | Billing, Suscripciones, Pagos, Planes, MRR |
| **Fase 7** — Gestión de Sucursales y Usuarios | ✅ **COMPLETA** | CRUD Branches, Usuarios por Sucursal, Settings |
| **Fase 8** — Hardening y Deploy VPS | ✅ **COMPLETA** | Migraciones, CI/CD, Dokploy, Git Deploy |
| **Fase 9** — Facturación Electrónica AFIP | ✅ **COMPLETA** | WSAA/WSFEv1 vía AfipSDK, CAE, PDF + QR, toggle en POS |
| **Fase 10** — Checkout Self-Service y MercadoPago | ✅ **COMPLETA** | Landing pública, registro con pago (MP + transferencia), aprobación manual |
| **Fase 11** — Medios de Pago del POS | ✅ **COMPLETA** | QR/Link MercadoPago, transferencias con comprobante, cuentas de pago |
| **Fase 12** — Promociones, Referidos y Billing Avanzado | ✅ **COMPLETA** | Promotions, referral codes, prorrateo, upcoming charges, pending payments |
| **Fase 13** — Gastos, System Settings y PWA | ✅ **COMPLETA** | Módulo de gastos, system-settings, PWA instalable, mail service |
| **Fase 14** — Producción y Fraccionamiento | ✅ **COMPLETA** | Recetas (BOM), órdenes de producción, product_type, costeo prorrateado |

> **Estado general:** El sistema es un SaaS completo en producción (deploy con Dokploy + `docker-compose.prod.yml`). Documentación de usuario AFIP en `COMO-USAR-AFIP.md` y resumen técnico en `FASE-9-RESUMEN.md`.

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

### 🚨 Bug DNS en `dokploy-network` — nombres de servicios API
En producción sobre el VPS, `dokploy-network` es una red compartida por varios proyectos. Existían varios servicios que publicaban el alias genérico `api` (`rms_api`, `medical_api`, `kioskos_api`). Docker resolvía `api` hacia las tres IPs en round-robin, por lo que aproximadamente 2 de cada 3 requests podían llegar al backend equivocado y devolver errores `404` intermitentes.

**Regla permanente:** en producción nunca usar `api` como upstream del frontend de Kioskos & Despenzas. El proxy de `frontend/nginx.conf` debe apuntar explícitamente a `kioskos_api`, que es el nombre único de este proyecto dentro de `dokploy-network`. Si se agrega o modifica un servicio Docker, verificar que no se reintroduzca el alias genérico.

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

### 📁 Archivos implementados (inventario real — Sept 2026)

```
backend/src/
  ✅ main.ts                    (CORS, Swagger /api/docs, prefix api/v1, bootstrap migraciones/seed)
  ✅ app.module.ts              (13 módulos de negocio + TenantMiddleware)
  ✅ seed.ts                    (seeder de referencia; usar seed.sql en Docker)
  ✅ common/base.entity.ts
  ✅ common/decorators/ (get-tenant.decorator.ts, roles.decorator.ts)
  ✅ common/guards/ (jwt-auth.guard.ts, roles.guard.ts, superadmin.guard.ts)
  ✅ common/services/mail.service.ts
  ✅ auth/ (module, service, controller, dto, strategies/jwt.strategy)
  ✅ tenants/ (module, service, controller, middleware, entities: Tenant, User)
  ✅ billing/
     ✅ entities/ (Plan, Subscription, BillingHistory, PendingSubscription, Promotion)
     ✅ billing.service.ts / billing.controller.ts
     ✅ checkout.service.ts / checkout.controller.ts   ← NUEVO Fase 10 (registro + pago)
     ✅ promotion.service.ts                           ← NUEVO Fase 12
  ✅ inventory/
     ✅ entities/ (Branch, Unit, Category, Brand, PriceList, Product, ProductPrice, Inventory)
     ✅ dto/, events/stock-reduced.event.ts
     ✅ inventory.module/service/controller/listener
  ✅ notifications/ (module + gateway WebSocket rooms por tenant y superadmin)
  ✅ sales/
     ✅ entities/ (Customer, CashRegister, Sale, SaleItem, PaymentAccount, MercadoPagoCredentials)
     ✅ dto/ (sales.dto.ts, payment-account.dto.ts)
     ✅ events/sale-completed.event.ts
     ✅ sales.service.ts / sales.controller.ts / sales.module.ts
  ✅ accounting/ (entities/accounting-ledger, service, listener, controller, module)
  ✅ purchases/ (entities: Supplier, PurchaseOrder, PurchaseOrderItem; events/purchase-received)
  ✅ reports/ (service, controller, module)
  ✅ settings/ (settings.service/controller, settings-mercadopago.service, dto)
  ✅ electronic-invoicing/                              ← Fase 9
     ✅ entities/ (AfipCredentials, ElectronicInvoice)
     ✅ electronic-invoicing.service/controller/module
     ✅ invoice-pdf.service.ts        (PDFKit + QR bwip-js)
     ✅ dto/afip.dto.ts + README.md
  ✅ system-settings/ (entity SystemSetting, service, controller, module)  ← Fase 13
  ✅ expenses/ (entities: Expense, ExpenseCategory; events/expense-created) ← Fase 13
  ✅ production/                                                   ← Fase 14
     ✅ entities/ (Recipe, RecipeItem, ProductionOrder, ProductionInput, ProductionOutput)
     ✅ dto/production.dto.ts
     ✅ events/production-completed.event.ts
     ✅ production.service.ts  (recetas, órdenes, prorrateo de costos, requerimientos)
     ✅ production.controller.ts (/production/recipes, /orders, /requirements)
  ✅ database/
     ✅ data-source.ts  (synchronize: false — solo migraciones)
     ✅ migrations/ (InitialSchema, AddBrandEntity, AddExpensesModule,
                      BillingRestructure, UpdateCheckoutSchema)
     ✅ seed.sql + fase-9-afip.sql + run-migrations.ts

frontend/src/
  ✅ App.tsx (rutas públicas + admin + POS + superadmin, PWA toast)
  ✅ layouts/ (AdminLayout, AuthLayout, PosLayout, SuperAdminLayout)
  ✅ store/ (auth.store, branch.store, cart.store, notification.store, pwa.store)
  ✅ api/ (client.ts + inventory, sales, purchases, accounting, reports, settings,
           afip, checkout, expenses, system-settings — cada uno con sus .types)
  ✅ hooks/ (useInventory, useSales, usePurchases, useSettings, useReports, useAfip,
             useExpenses, useAccounting, useNotificationsRealtime, usePWA,
             useSuperAdminPendingRealtime)
  ✅ components/ (NotificationDropdown, ReplenishmentAssistant, InviteFriendsModal)
  ✅ pages/
     ✅ LandingPage.tsx                      ← NUEVO Fase 10 (pública)
     ✅ auth/ (LoginPage, RegisterPage)
     ✅ checkout/ (CheckoutPage, PaymentSuccessPage, PaymentResultPages) ← Fase 10
     ✅ DashboardPage.tsx
     ✅ inventory/ (InventoryPage hub, ProductsPage, MassivePricingPage,
                    StockPage, CategoriesPage, BrandsPage)
     ✅ pos/PosPage.tsx  (toggle factura AFIP, QR MP, transferencias)
     ✅ customers/CustomersPage.tsx
     ✅ purchases/ (PurchasesPage + OrdersTab + SuppliersTab)
     ✅ accounting/AccountingPage.tsx
     ✅ expenses/ExpensesPage.tsx            ← NUEVO Fase 13
     ✅ production/ (ProductionPage + OrdersTab + RecipesTab) ← NUEVO Fase 14
     ✅ afip/AfipInvoicesPage.tsx            ← Fase 9
     ✅ settings/ (SettingsPage + tabs: BranchesTab, UsersTab, BusinessTab,
                   AfipTab, MercadopagoTab, PaymentAccountsTab, SubscriptionTab)
     ✅ superadmin/ (SuperAdminDashboard, TenantsPage, BillingPage,
                     SubscriptionsPage, PlansPage, PendingPaymentsPage,
                     PromotionsPage, UpcomingChargesPage, SettingsPage)
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

### 💳 Decisiones técnicas Fase 10 — Checkout Self-Service y MercadoPago (Sept 2026)

1. **Registro con pago (self-service):** `LandingPage` pública (`/`) + `CheckoutPage` (`/checkout`). El visitante elige plan, completa sus datos y paga. Entidad `PendingSubscription` guarda el registro pendiente hasta confirmar el pago.
2. **Dos métodos de pago del checkout:** MercadoPago (preference/init_point, webhook de confirmación) y transferencia bancaria manual (alias + confirmación con aprobación manual del SuperAdmin vía `PendingPaymentsPage`).
3. **Rutas públicas excluidas del TenantMiddleware:** `checkout/plans`, `checkout/start`, `checkout/status/*`, `checkout/confirm-transfer`, `checkout/webhook/*`, `checkout/sandbox-info`, `system-settings/public-info`.
4. **SDK `mercadopago` v2** en backend; credenciales de la plataforma por env; resultado del pago en páginas `/checkout/success|pending|failure`.

### 🧾 Decisiones técnicas Fase 11 — Medios de Pago en el POS

1. **`payment_method` ampliado en `Sale`:** `cash | debit_card | credit_card | transfer | qr_mercadopago | link_mercadopago | credit_client` + `payment_status` (`pending | confirmed | failed`).
2. **Trazabilidad de pago:** campos `mp_payment_id`, `card_last_digits`, `card_brand`, `authorization_code`, `transfer_voucher`, `voucher_image_url`, `payment_verified_at`.
3. **`PaymentAccount` (entidad):** cuentas del negocio (alias/CBU) para recibir transferencias; CRUD desde Settings → Payment Accounts.
4. **`MercadoPagoCredentials` por tenant:** OAuth MP (public_key, access_token, refresh_token, store_id, pos_id, sandbox). Configuración en Settings → MercadoPago.
5. **Verificación de pagos:** endpoints `verify-payment` y `revert-payment`; el POS permite confirmar/revertir pagos pendientes de transferencia o QR.

### 🎁 Decisiones técnicas Fase 12 — Promociones, Referidos y Billing Avanzado

1. **Entidad `Promotion`:** descuentos por porcentaje o monto fijo, con vigencia, tope de usos, duración en meses y planes aplicables. CRUD en `/superadmin/promotions`.
2. **Campos promocionales en `Subscription`:** `discount_percentage`, `discount_ends_at`, `locked_price`, `locked_plan_name`, `billing_day`, `promotion_id`, `price_after_promo`, `promo_ends_at`, `mp_preapproval_id`.
3. **Sistema de referidos:** `Tenant.referral_code` y `Tenant.referred_by_id`; link compartible `/checkout?ref=...` (componente `InviteFriendsModal`, alerta WS `referral_success_alert`).
4. **Prorrateo y cobros:** `BillingHistory` con `billing_period_start/end`, `is_prorated`, `plan_name` denormalizado. Página `/superadmin/upcoming-charges` para próximos cobros.
5. **Alertas SuperAdmin en tiempo real:** hook `useSuperAdminPendingRealtime` escucha `pending_payment_alert` / `pending_payment_resolved` por WebSocket.

### 💸 Decisiones técnicas Fase 13 — Gastos, System Settings y PWA

1. **Módulo `expenses`:** entidades `Expense` y `ExpenseCategory` (con seeder de categorías), evento `expense.created`, endpoints CRUD + `/expenses/summary`. Página `/expenses`.
2. **Módulo `system-settings`:** clave/valor global de plataforma (solo SuperAdmin) + endpoint público `public-info` (datos para landing/checkout, ej: alias de transferencia).
3. **PWA:** `vite-plugin-pwa` con `autoUpdate`, manifest propio, hook `usePWA` + `pwa.store` para instalar la app; `nginx.conf` sin caché para `sw.js`.
4. **Mail service:** `common/services/mail.service.ts` (SMTP por env) para notificaciones transaccionales.
5. **Migraciones activas:** `DB_SYNCHRONIZE=false` definitivo; `main.ts` corre migraciones si `DB_RUN_MIGRATIONS=true` y seed si `DB_RUN_SEED=true`.
6. **Deploy Dokploy:** `docker-compose.prod.yml` sin puertos expuestos, redes `internal_network` + `dokploy-network` (externa); frontend production = Nginx sirviendo `dist` con proxy `/api/` → `api:3000`.

### 🏭 Decisiones técnicas Fase 14 — Producción y Fraccionamiento (Sept 2026)

Cubre dos casos de uso: **productos fraccionados** (comprar a granel y vender fraccionado, ej: bolsa de alimento de 20kg → bolsas de 1kg) y **productos elaborados** (insumos → producto vendible, ej: caja de pollos → pata-muslo, pechuga, milanesas, albóndigas).

1. **`Product.product_type`:** nuevo enum `standard | raw_material | fractionated | elaborated` (default `standard`). Los `raw_material` se compran pero **no aparecen en el POS** (`quickSearch` los excluye). Los demás tipos se comportan como siempre → **no rompe nada existente**.
2. **Recetas (`recipes` + `recipe_items`):** definen el consumo **aproximado** de insumos por tanda (`output_product_id`, `output_quantity`, items con `quantity`). Sirven para precargar producciones y para el cálculo estimado de necesidades (`GET /production/requirements`). Tipos: `fractioning` | `elaboration`.
3. **Órdenes de producción (`production_orders` + `production_inputs` + `production_outputs`):** registran la producción REAL con cantidades reales (el rinde puede variar, ej: caja de 8 o 9 pollos). Soportan multi-output manual sin receta (desposte).
4. **Transacción atómica:** al registrar una orden se descuenta stock de insumos, se incrementa stock de productos obtenidos y se actualiza `cost_price` de los outputs — todo en una sola transacción TypeORM.
5. **Seguimiento CALCULADO, no bloqueante:** el stock de materias primas puede quedar **negativo** sin bloquear la producción (se devuelve `warnings[]`), porque las compras de insumos no siempre se cargan con precisión. La cancelación de una orden sí revierte stock y falla si el producto ya se vendió.
6. **Costeo prorrateado:** el costo total de insumos (`cost_price` vigente) se distribuye entre los outputs proporcionalmente a la cantidad, salvo que se indique `unit_cost` manual por línea.
7. **Eventos:** emite `stock.reduced` por cada insumo (reusa alertas de stock bajo existentes) y `production.completed`.
8. **Frontend:** nueva página `/production` con tabs **Producciones** y **Recetas**, calculadora de insumos estimados, selector de `product_type` en el modal de producto, tarjeta en el hub de Inventario y entrada "Producción" en el menú lateral.

### 📦 Mejoras de Inventario y Gestión de Precios (Abril 2026)

1. **Gestión Proactiva de Stock**: Se añadió `min_stock_alert` a nivel de producto con alertas visuales y sonoras.
2. **Precios de Venta Inteligentes**: El sistema ahora diferencia entre Precio de Costo y Precio de Venta. Al crear un producto, se puede definir el margen (%) o valor fijo, con sugerencias automáticas (+35% sugerido).
3. **Actualización Masiva de Precios**: Nueva herramienta de BI que permite ajustar precios en bloque filtrando por Categoría, Marca o Proveedor.
4. **Proveedores y Marcas Dinámicos**: Integración con el módulo de compras e inventario que permite crear proveedores y marcas "sobre la marcha" desde el modal de productos.
5. **Inventario Hub (Navegación Intuitiva)**: El módulo de inventario ahora funciona como un hub con selector de vista (Cards/Lista) y navegación optimizada con botones de regreso.
6. **Diseño Premium Grid**: El catálogo de productos se rediseñó como una grilla de cards visuales optimizada para dispositivos móviles (Zero Horizontal Scroll).
6. **Automatización Contable Configurable**: El administrador puede decidir desde *Ajustes de Negocio* si los movimientos de stock generan automáticamente asientos de pérdida en el Libro Diario.
7. **Mobile-First UX (Cero Scroll Horizontal)**: Se aplicaron restricciones estrictas de overflow y rediseño de componentes críticos (Header, Modales, POS) para garantizar una navegación fluida en dispositivos móviles, eliminando desplazamientos laterales.

### 🛒 Mejoras de Inventario y Compras — Septiembre 2026

1. **Unidades de medida:** la pantalla de Inventario permite crear, editar y eliminar unidades; al eliminar una unidad se desvincula de los productos del tenant.
2. **Categorías y marcas:** ambas gestiones permiten editar y eliminar registros, preservando el aislamiento por tenant y desvinculando los productos relacionados antes de borrar.
3. **Órdenes de compra:** Compras permite crear órdenes manualmente seleccionando proveedor, productos, cantidades y costos. El Asistente de Reposición reutiliza el mismo formulario y genera una orden pre-cargada con los productos bajo el mínimo; la recepción continúa ingresando stock y emitiendo el evento contable correspondiente.

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

> **Estado real (Sept 2026):** El `docker-compose.yml` de desarrollo usa contenedores `kioskos_mysql`, `kioskos_redis`, `kioskos_api`, `kioskos_client`, `kioskos_adminer` sobre la red `kioskos_network`, con healthchecks en db/redis y `depends_on: service_healthy`. El `docker-compose.prod.yml` (deploy en VPS con **Dokploy**) no expone puertos, usa target `production` en ambos Dockerfiles, redes `internal_network` + `dokploy-network` (externa), y el frontend corre con **Nginx** (SPA fallback + proxy `/api/` → `api:3000`).
>
> CI/CD en `.github/workflows/`: `ci.yml` (type-check + build en PRs) y `deploy.yml` (build/push de imágenes a ghcr.io en push a main).

```yaml
# docker-compose.yml (desarrollo local — referencia resumida)
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: kioskos_mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: kioskos_db
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_USER: dev_user
      MYSQL_PASSWORD: dev_password
    ports: [ "3306:3306" ]
    volumes: [ mysql_data:/var/lib/mysql ]
    healthcheck: mysqladmin ping (10s interval, 5 retries)

  redis:
    image: redis:7-alpine
    container_name: kioskos_redis
    ports: [ "6379:6379" ]
    healthcheck: redis-cli ping

  api:
    build: ./backend           # Dockerfile multi-etapa (development por defecto)
    container_name: kioskos_api
    ports: [ "3000:3000" ]
    env_file: [ .env ]
    environment: [ DB_HOST=db, REDIS_HOST=redis ]
    volumes: [ ./backend:/usr/src/app, /usr/src/app/node_modules ]
    depends_on: db (healthy), redis (healthy)

  client:
    build:
      context: ./frontend
      target: development      # dev: vite --host; prod: nginx:alpine
    container_name: kioskos_client
    ports: [ "5173:5173" ]
    env_file: [ .env ]
    volumes: [ ./frontend:/usr/src/app, /usr/src/app/node_modules ]

  adminer:
    image: adminer:latest
    ports: [ "8080:8080" ]

networks:  kioskos_network (bridge)
volumes:   mysql_data
```

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
S3_REGION=us-east-1

# ==========================================
# FACTURACIÓN ELECTRÓNICA AFIP (Fase 9)
# ==========================================
# Secreto para cifrado AES-256-CBC de credenciales AFIP (scrypt).
# ⚠️ CAMBIAR EN PRODUCCIÓN — mínimo 32 caracteres aleatorios
AFIP_ENCRYPTION_SECRET=...

# ==========================================
# PAGOS — MERCADOPAGO PLATAFORMA (Fases 10-12)
# ==========================================
MP_ACCESS_TOKEN=APP_USR-...        # Access Token de la app (checkout)
MP_CLIENT_ID=...                   # OAuth plataforma (conexión de tenants)
MP_CLIENT_SECRET=...
MP_REDIRECT_URI=https://api.tudominio.com/api/v1/settings/mercadopago/callback
TRANSFER_ALIAS=tu.alias.mp         # Alias/CBU para pagos por transferencia del checkout
TRANSFER_CBU=0000000...

# ==========================================
# URLS / BOOTSTRAP
# ==========================================
FRONTEND_URL=http://localhost:5173     # Usado por CORS y WebSocket gateway
DB_RUN_MIGRATIONS=false                # true → corre migraciones al boot
DB_RUN_SEED=false                      # true → corre seed.sql al boot
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

### 7.3 Tablas agregadas en Fases 9-13 (Sept 2026)

> Esquema real extraído de las entidades TypeORM. La fuente de verdad son las migraciones en `backend/src/database/migrations/` (`synchronize: false`).

```sql
-- FASE 9 — Facturación electrónica AFIP
afip_credentials (
  id, tenant_id, auth_mode ENUM('certificate','access_token'),
  cuit_encrypted, certificate_encrypted, private_key_encrypted,
  access_token_encrypted, punto_de_venta INT, razon_social,
  tipo_iva ENUM('monotributista','responsable_inscripto'),
  production_mode BOOL, is_configured BOOL, last_cae_date,
  created_at, updated_at
);

electronic_invoices (
  id, tenant_id, sale_id, punto_de_venta, tipo_comprobante,
  numero_comprobante, cae, cae_expiration, fecha_comprobante,
  concepto, doc_tipo_receptor, doc_nro_receptor, nombre_receptor,
  importe_total DECIMAL(15,2), importe_neto, importe_iva, alicuota_iva,
  moneda, afip_response JSON, is_test BOOL, created_at, updated_at
);

-- FASE 10 — Checkout self-service
pending_subscriptions (
  id, plan_id, amount DECIMAL(12,2), business_name, owner_email,
  owner_name, owner_phone, tax_id, temp_password_hash,
  status, payment_method, mp_preference_id, mp_payment_id,
  mp_init_point, transfer_alias, transfer_notes, tenant_id,
  referred_by_code, created_at, updated_at
);

-- FASE 11 — Medios de pago del POS
payment_accounts (
  id, tenant_id, name, type ENUM('alias','cbu','other'),
  value, is_active, created_at, updated_at
);

mercadopago_credentials (
  id, tenant_id, public_key, access_token, refresh_token,
  mp_user_id, token_expires_at, store_id, pos_id,
  is_sandbox BOOL, is_configured BOOL, last_verified_at,
  created_at, updated_at
);
-- sales: + payment_status, mp_payment_id, mp_payment_status, payer_name,
--        payer_email, transfer_voucher, transfer_origin, card_last_digits,
--        card_brand, authorization_code, payment_notes, payment_verified_at,
--        voucher_image_url
-- sales.payment_method ahora ENUM('cash','debit_card','credit_card',
--        'transfer','qr_mercadopago','link_mercadopago','credit_client')

-- FASE 12 — Promociones y referidos
promotions (
  id, name, description, discount_type, discount_value,
  start_date, end_date, max_uses, current_uses,
  promo_duration_months, applies_to_plan_ids JSON,
  is_active, created_at
);
-- subscriptions: + discount_percentage, discount_ends_at, locked_price,
--        locked_plan_name, billing_day, status, cancelled_at,
--        cancellation_reason, promotion_id, price_after_promo,
--        promo_ends_at, mp_preapproval_id
-- billing_history: + plan_id, plan_name, billing_period_start,
--        billing_period_end, is_prorated, promotion_id
-- tenants: + phone, address, referral_code, referred_by_id,
--        trial_ends_at, settings JSON

-- FASE 13 — Gastos y settings de plataforma
expense_categories (id, tenant_id, name, ..., created_at, updated_at);
expenses (id, tenant_id, category_id, amount, description, date, ..., created_at, updated_at);
system_settings (id, key, value, ...);  -- Global plataforma (sin tenant_id)

-- EXTRAS de inventario (Fase 2 ampliada)
brands (id, tenant_id, name, created_at, updated_at);
-- products: + cost_price, image_url, brand_id, supplier_id, min_stock_alert, is_active
-- categories: + color, icon

-- FASE 14 — Producción y Fraccionamiento
-- products: + product_type ENUM('standard','raw_material','fractionated','elaborated')
--           DEFAULT 'standard'  (raw_material NO aparece en el POS)
recipes (
  id, tenant_id, name, type ENUM('fractioning','elaboration'),
  output_product_id, output_quantity DECIMAL(15,3),
  notes, is_active, created_at, updated_at
);
recipe_items (
  id, recipe_id FK→recipes CASCADE, product_id, quantity DECIMAL(15,3)
);
production_orders (
  id, tenant_id, branch_id, recipe_id NULL, user_id NULL,
  status ENUM('completed','cancelled'), total_input_cost DECIMAL(15,2),
  notes, cancelled_at NULL, created_at, updated_at
);
production_inputs (
  id, production_order_id FK→production_orders CASCADE,
  product_id, quantity DECIMAL(15,3), unit_cost, subtotal
);
production_outputs (
  id, production_order_id FK→production_orders CASCADE,
  product_id, quantity DECIMAL(15,3), unit_cost, subtotal
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
| `BillingModule` | Planes, suscripciones, historial, **checkout**, **promociones** | SUPERADMIN / público checkout | `pending_payment.*` |
| `InventoryModule` | Productos, stock, sucursales, marcas, barcodes | JwtAuth | `stock.reduced` |
| `SalesModule` | POS, caja, fiados, **medios de pago MP/transferencia** | JwtAuth | `sale.completed` |
| `AccountingModule` | Asientos contables automáticos | JwtAuth | Escucha `sale.completed` |
| `PurchasesModule` | Proveedores, órdenes de compra | JwtAuth | `purchase.received` |
| `ReportsModule` | Dashboard, métricas, BI | JwtAuth | — |
| `NotificationsModule` | WebSocket Gateway (alertas tiempo real) | — | Escucha todos |
| `SettingsModule` | Sucursales, usuarios, negocio, **MercadoPago OAuth** | JwtAuth | — |
| `ElectronicInvoicingModule` | AFIP/ARCA: credenciales, facturas, CAE, PDF | JwtAuth + feature plan | — |
| `SystemSettingsModule` | Clave/valor global de plataforma + `public-info` | SUPERADMIN / público info | — |
| `ExpensesModule` | Gastos y categorías de gastos | JwtAuth | `expense.created` |
| `ProductionModule` | Recetas, fraccionamiento y elaboración, costeo prorrateado | JwtAuth | `production.completed` |

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
| `/` | `LandingPage` | Público |
| `/checkout` | `CheckoutPage` | Público |
| `/checkout/success` `/pending` `/failure` | `PaymentResultPages` | Público |
| `/login` / `/auth/login` | `LoginPage` | Público |
| `/auth/register` | `RegisterPage` | Público |
| `/pos` | `PosPage` | CASHIER |
| `/dashboard` | `DashboardPage` | MANAGER |
| `/inventory` | `InventoryPage` (hub) | MANAGER |
| `/inventory/products` | `ProductsPage` | MANAGER |
| `/inventory/stock` | `StockPage` | MANAGER |
| `/inventory/categories` | `CategoriesPage` | MANAGER |
| `/inventory/brands` | `BrandsPage` | MANAGER |
| `/inventory/pricing` | `MassivePricingPage` | ADMIN |
| `/customers` | `CustomersPage` | MANAGER |
| `/purchases` | `PurchasesPage` (OrdersTab + SuppliersTab) | ADMIN |
| `/accounting` | `AccountingPage` | ADMIN |
| `/expenses` | `ExpensesPage` | ADMIN |
| `/production` | `ProductionPage` (OrdersTab + RecipesTab) | MANAGER |
| `/afip/invoices` | `AfipInvoicesPage` | ADMIN |
| `/settings/branches` | `BranchesTab` | ADMIN |
| `/settings/users` | `UsersTab` | ADMIN |
| `/settings/business` | `BusinessTab` | ADMIN |
| `/settings/afip` | `AfipTab` | ADMIN |
| `/settings/mercadopago` | `MercadopagoTab` | ADMIN |
| `/settings/payment-accounts` | `PaymentAccountsTab` | ADMIN |
| `/settings/subscription` | `SubscriptionTab` | ADMIN |
| `/superadmin` | `SuperAdminDashboard` | SUPERADMIN |
| `/superadmin/tenants` | `TenantsPage` | SUPERADMIN |
| `/superadmin/billing` | `BillingPage` | SUPERADMIN |
| `/superadmin/pending-payments` | `PendingPaymentsPage` | SUPERADMIN |
| `/superadmin/subscriptions` | `SubscriptionsPage` | SUPERADMIN |
| `/superadmin/plans` | `PlansPage` | SUPERADMIN |
| `/superadmin/promotions` | `PromotionsPage` | SUPERADMIN |
| `/superadmin/upcoming-charges` | `UpcomingChargesPage` | SUPERADMIN |
| `/superadmin/settings` | `SuperAdminSettingsPage` | SUPERADMIN |

### State Management

- **TanStack Query:** Toda la comunicación con la API. Caché automático, refetch on window focus.
- **Zustand:** Estado local de UI. Stores: `auth.store` (user, token), `branch.store` (sucursal activa), `cart.store` (carrito del POS), `notification.store` (alertas), `pwa.store` (instalación PWA).

---

## 12. Planes de Suscripción

| Característica | 🌱 Emprendedor | 🏪 Negocio | 🚀 Profesional |
|---|:---:|:---:|:---:|
| **Usuarios** | 1 (dueño) | Hasta 3 | Hasta 99 |
| **Sucursales** | 1 | 1 | Hasta 5 |
| **POS, caja y pagos del POS** | ✅ | ✅ | ✅ |
| **Inventario, códigos, categorías y marcas** | ✅ | ✅ | ✅ |
| **Compras y proveedores** | ✅ | ✅ | ✅ |
| **Clientes, fiados y cuentas corrientes** | ✅ | ✅ | ✅ |
| **Devoluciones y anulaciones** | ❌ | ✅ | ✅ |
| **IVA por producto y comprobante** | ❌ | ✅ | ✅ |
| **Contabilidad automática** | ❌ | ✅ | ✅ |
| **Gastos** | ❌ | ✅ | ✅ |
| **Producción y fraccionamiento** | ❌ | ✅ | ✅ |
| **Reportes y dashboard** | Básicos | Histórico | BI completo |
| **Exportación PDF/Excel** | ❌ | ✅ | ✅ |
| **Facturación electrónica AFIP** | ❌ | ✅ | ✅ |
| **Alertas por Email** | ❌ | ❌ | ✅ |
| **Sucursales** | 1 | 1 | Hasta 5 |
| **Usuarios** | 1 | Hasta 3 | Hasta 99 |
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

*Última actualización: Septiembre 2026 | Versión del documento: 10.0 — Fase 14: Producción y Fraccionamiento*
*Basado en los documentos de planificación 01 al 08 del proyecto Kioskos & Despenzas y en el inventario real del código (backend + frontend).*

### 10.2 | Septiembre 2026 — Mejoras de UX y órdenes de compra

- Las eliminaciones de unidades, categorías y marcas deben confirmarse mediante modal visual de la aplicación; no usar `window.confirm`.
- El formulario de órdenes de compra diferencia explícitamente producto, cantidad y costo unitario, muestra el total estimado y permite quitar líneas antes de guardar.
- Las sucursales sembradas pueden utilizar UUID determinísticos sin versión; el DTO de órdenes valida el formato UUID sin exigir una versión UUID específica.

### 10.3 | Septiembre 2026 — Pagos a proveedores

- Recibir una orden de compra significa ingresar la mercadería y reconocer la deuda; no implica que el proveedor haya sido pagado.
- La recepción registra `Mercadería` contra `Proveedores`. Los pagos se registran por separado, admiten pagos parciales y generan `Proveedores` contra `Caja` o `Bancos` según el medio elegido.
- El frontend muestra la acción `Registrar pago al proveedor` únicamente en órdenes recibidas.

### 10.4 | Septiembre 2026 — Estado contable y visualización de órdenes

- La recepción de una orden registra `Mercadería` (Debe) contra `Proveedores` (Haber), reconociendo la deuda; el pago posterior registra `Proveedores` (Debe) contra `Caja` o `Bancos` (Haber). Por eso el libro muestra $32.000 de movimientos para una compra de $16.000, pero la deuda queda en cero: no es un pago duplicado.
- Las órdenes acumulan los pagos realizados y se muestran como `Pendiente` o `Pagada`; al completar el total se deshabilita la acción de registrar otro pago.
- Compras permite alternar entre vista grilla y listado, además de abrir el detalle de cada orden con sus líneas, costos y estado de pago.

### 10.5 | Septiembre 2026 — Idempotencia al confirmar pagos del POS

- Una venta enviada con `payment_status: confirmed` se confirma dentro de `createSale`; el frontend no debe volver a verificarla después de subir un comprobante.
- `verifySale` es idempotente: si la venta ya está confirmada, devuelve la venta sin generar un error ni duplicar asientos contables.

### 10.6 | Septiembre 2026 — Detalle de ventas en Dashboard

- La serie de ventas de los últimos siete días incluye siempre el día actual y completa los días sin ventas con valor cero.
- La tarjeta `Ingresos de hoy`, cada barra del gráfico y el calendario del Dashboard abren el detalle de ventas de la fecha seleccionada.
- El detalle reutiliza `GET /sales` con rango de fechas, paginación y `branch_id`, manteniendo el aislamiento por tenant y sucursal.

### 10.7 | Septiembre 2026 — Productos más vendidos en el POS

- La búsqueda rápida del POS, cuando el campo está vacío, muestra automáticamente los diez productos más vendidos de la sucursal según las ventas completadas.
- La búsqueda por nombre, código de barras o código interno mantiene su comportamiento normal y continúa mostrando hasta 20 resultados.
- Las sugerencias populares respetan el tenant, la sucursal y la exclusión de materias primas; se reutiliza el mismo endpoint para conservar stock y precios actuales.

### 10.8 | Septiembre 2026 — Fechas del Dashboard

- Las etiquetas de la gráfica interpretan las fechas `YYYY-MM-DD` como días calendario locales, evitando que la conversión UTC muestre cada día desplazado.
- La tarjeta de ingresos de hoy y los clics de la gráfica consultan exactamente el mismo día local mostrado.

### 10.9 | Septiembre 2026 — Búsqueda popular del POS y `ONLY_FULL_GROUP_BY`

- La búsqueda rápida con `q=` vacío calcula la popularidad mediante un subquery correlacionado, filtrando tenant, ventas completadas y sucursal.
- No usar `GROUP BY p.id` junto con la selección completa de productos y relaciones: MySQL en producción puede tener `ONLY_FULL_GROUP_BY` habilitado y devolver `500`.

### 10.10 | Septiembre 2026 — Devoluciones, anulaciones, recepción real, cuentas corrientes e IVA

- **No se borran movimientos contabilizados.** Una venta se devuelve mediante `POST /sales/:id/returns`, que admite devolución parcial o anulación total por líneas. El documento conserva motivo y cantidades, reintegra stock, reduce la deuda del cliente si era fiado, actualiza el estado a `partially_refunded` o `refunded` y genera asientos inversos sin duplicar la venta original.
- **Los gastos se anulan, no se eliminan.** `POST /expenses/:id/void` conserva el comprobante con `status=voided`, motivo y fecha de anulación, y genera la reversa del asiento original. Las ediciones de un gasto ya contabilizado primero revierten el importe anterior y luego registran el nuevo importe; los resúmenes excluyen gastos anulados.
- **Las órdenes pendientes se pueden editar.** `PATCH /purchases/orders/:id` reemplaza sus líneas y recalcula el total solo mientras la orden está pendiente. Al recibir una orden se puede enviar la mercadería realmente entregada mediante `POST /purchases/orders/:id/receive`: se aceptan cantidades menores, mayores o productos no pedidos, y se contabiliza únicamente la recepción real.
- **Una orden recibida no se reescribe.** Las diferencias posteriores se registran como devolución parcial o total mediante `POST /purchases/orders/:id/returns`. La devolución reduce stock y la deuda con el proveedor, y admite `credit_note` (saldo a favor), `cash_refund` o `bank_refund`; si la orden ya estaba pagada, el crédito o reintegro evita alterar pagos históricos.
- **Cuentas corrientes de proveedores son opt-in.** `suppliers.current_account_enabled` no se activa por defecto. Cuando está habilitada, el saldo se calcula como saldo inicial + recepciones - pagos - notas de crédito + reintegros; la consulta `/purchases/suppliers/:id/current-account` muestra el detalle cronológico. Recibir mercadería sigue reconociendo deuda y pagar sigue siendo una operación separada.
- **IVA por producto y por línea.** `products.vat_rate` admite alícuotas diferentes (por ejemplo `0`, `10.5`, `21` y `27`). En compras, `unit_cost` es neto sin IVA, `vat_amount` es el impuesto y `subtotal`/`purchase_orders.total` es el importe final bruto. La recepción actualiza el costo neto vigente del producto; si se calcula el precio con margen, el precio de lista se obtiene como costo neto + margen + IVA y se interpreta como precio final.
- **IVA en ventas y contabilidad.** El precio POS/lista es bruto y cada `sale_items` conserva `vat_rate`, `net_subtotal` y `vat_amount`. Los asientos separan `Ventas` de `IVA Débito Fiscal`, las compras separan `Mercadería` de `IVA Crédito Fiscal`, y las devoluciones invierten ambas partes. Las columnas nuevas dejan IVA `0` en líneas históricas para no modificar comprobantes ya contabilizados.
- **Migración:** `AddReturnsSupplierAccountsAndVat1800000000000` crea las columnas fiscales, estados de anulación, cuentas corrientes y tablas `purchase_returns`, `purchase_return_items`, `sale_returns` y `sale_return_items`. En producción se debe ejecutar mediante el flujo normal de migraciones antes de utilizar estas pantallas.

### 10.11 | Septiembre 2026 — Sección centralizada de cuentas corrientes

- La ruta protegida `/current-accounts` ofrece una sección independiente con pestañas para `Clientes` y `Proveedores`, búsqueda, saldo pendiente, totales de cargos/abonos y detalle cronológico de movimientos.
- Las cuentas de clientes muestran ventas `credit_client`, abonos, devoluciones y saldo actual. Los abonos se persisten en `customer_account_payments`, admiten efectivo, transferencia o banco, y generan el asiento `Caja/Bancos` contra `Cuentas por Cobrar` mediante el evento `customer.payment.created`.
- Las cuentas de proveedores continúan siendo opt-in mediante `suppliers.current_account_enabled`; la sección lista solo las habilitadas y muestra saldo inicial, recepciones, pagos y devoluciones/notas de crédito.
- Nuevos endpoints paginados: `GET /sales/customers/current-accounts`, `GET /sales/customers/:id/current-account` y `GET /purchases/suppliers/current-accounts`. Se mantiene `GET /purchases/suppliers/:id/current-account` para compatibilidad con Compras.
- La migración `AddCustomerAccountPayments1800000000000` debe ejecutarse en producción antes de registrar abonos de clientes o utilizar el historial completo de sus cuentas.

### 10.12 | Septiembre 2026 — Relación entre fiados y cuentas corrientes de clientes

- La cuenta corriente de un cliente es la visualización formal e histórica del mismo saldo que antes se mostraba como `Fiado`; no existen dos deudas separadas.
- Las ventas con `payment_method = credit_client` aumentan `Customer.current_debt`, los abonos registrados desde cualquiera de las dos pantallas lo reducen y las devoluciones lo ajustan en sentido inverso.
- `/customers` conserva la gestión operativa de clientes y fiados, mientras `/current-accounts` centraliza movimientos, cargos, abonos y saldo para consulta auditable.

### 10.13 | Septiembre 2026 — Gráfico semanal con ingresos en cero

- El reporte semanal normaliza el resultado de `DATE(sale.created_at)` tanto si el driver MySQL devuelve una cadena como si devuelve un objeto `Date`.
- La comparación se realiza por clave de día calendario antes de completar los días sin ventas; así los importes agregados llegan a `DashboardPage` y no se convierten erróneamente en ceros.

### 10.14 | Septiembre 2026 — Auditoría SuperAdmin y aislamiento multi-tenant

- Cada negocio se identifica por el `tenant_id` derivado del JWT; el frontend nunca debe enviarlo como dato de negocio. Los endpoints de plataforma (`/tenants`, `/billing`, `/checkout/admin` y `/system-settings`) permanecen detrás de `JwtAuthGuard` + `SuperAdminGuard`.
- `JwtStrategy` vuelve a cargar el usuario y el tenant en cada request, rechaza usuarios inactivos, tenants suspendidos o vencidos y verifica que el `tenant_id` del token coincida con el usuario. `RolesGuard` también falla cerrado si no existe usuario autenticado.
- El registro autenticado de usuarios solo está disponible para `ADMIN`, fuerza el rol nuevo a `cashier` y valida que `branch_id` pertenezca al tenant actual. El rol administrativo inicial solo se asigna desde el seeder/provisionamiento interno, nunca desde el body público.
- Productos, precios, stock, gastos y usuarios validan las relaciones `unit`, `category`, `brand`, `supplier`, `branch` y `price_list` contra el tenant actual. Las búsquedas y joins de inventario deben conservar el filtro de tenant incluso cuando se recibe un UUID válido de otro negocio.
- La interfaz SuperAdmin es una frontera de navegación, no de seguridad: la autorización real está en el backend. Las rutas administrativas generales del frontend quedan limitadas a `admin` y `manager`; `cashier` solo entra al POS y SuperAdmin usa exclusivamente su panel.
- El catálogo canónico de features es: `pos_terminal`, `inventory`, `barcode_scanner`, `categories_brands`, `customers_credit`, `purchases_suppliers`, `current_accounts`, `payment_integrations`, `automated_accounting`, `reports_bi`, `export_pdf_excel`, `email_notifications`, `electronic_invoicing`, `expenses_management`, `supplier_current_accounts`, `returns_and_vat`, `production` y `multi_branch`.
- `isFeatureEnabled()` exige tenant habilitado, prueba vigente, suscripción no vencida y plan activo. Un plan desactivado no otorga nuevos accesos aunque una suscripción histórica siga marcada como activa.
- El checkout no permite usar `payment_method = trial` para activar planes pagos; las aprobaciones manuales solo aceptan solicitudes `MANUAL_PENDING` y el listado administrativo no devuelve `temp_password_hash`.
- Las columnas `tenant_id` deben reforzarse progresivamente con claves foráneas/índices compuestos en migraciones; las validaciones de servicio siguen siendo obligatorias porque las tablas de líneas (`sale_items`, `purchase_order_items`, `recipe_items`, etc.) heredan el aislamiento de su entidad raíz.

### 10.15 | Septiembre 2026 — SuperAdmin y usuarios por plan

- `superadmin@kioskos.com` es la cuenta dueña de la plataforma, no un usuario operativo de un negocio. El login y la validación JWT no deben exigirle una suscripción ni que el tenant técnico del sistema esté activo; los tenants comerciales sí deben validar estado y vigencia.
- `backend/src/database/seed.sql` es el seed operativo de Docker/MySQL. Las credenciales determinísticas del SuperAdmin y del usuario demo deben actualizarse en `ON DUPLICATE KEY UPDATE`, de modo que volver a ejecutar el seed repare una contraseña, rol o usuario desactivado preexistente.
- Solo un usuario con rol `admin` puede listar, crear o modificar usuarios desde `/settings/users`. El `tenant_id` siempre proviene del JWT y `branch_id` debe pertenecer al mismo tenant; nunca se permite asignar roles `superadmin` desde formularios o endpoints de negocio.
- La cantidad de usuarios activos incluye al administrador propietario y se limita por `Subscription -> Plan.max_users`. Crear o reactivar usuarios requiere suscripción activa, plan activo y cupo disponible; al alcanzar el límite, el backend rechaza la operación y el frontend informa el cupo restante.

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
| 8.0 | Abr 2026 | Fase 8 completada: Hardening — CI/CD GitHub Actions, docker-compose.prod, Dokploy |
| 9.0 | Sept 2026 | **Revisión completa script por script.** Fase 9 AFIP ✅ (CAE, PDF+QR, toggle POS). Nuevas fases documentadas: Fase 10 (Landing + Checkout self-service con MercadoPago/transferencia), Fase 11 (medios de pago POS: QR/Link MP, transferencias, comprobantes), Fase 12 (Promociones, Referidos, prorrateo, upcoming charges), Fase 13 (Gastos, System Settings, PWA, Mail). Inventario de archivos, esquema DB (7.3), módulos, rutas y `.env` actualizados al código real. Deploy: Dokploy + docker-compose.prod.yml. |
| 10.0 | Sept 2026 | **Fase 14 completada: Producción y Fraccionamiento.** `Product.product_type` (standard/raw_material/fractionated/elaborated), recetas con insumos aproximados, órdenes de producción multi-output con transacción atómica de stock, prorrateo de costos, seguimiento calculado no bloqueante de materias primas, calculadora de requerimientos, página `/production` (Producciones + Recetas), selector de tipo en modal de producto. Migración `AddProductionModule`. `quickSearch` del POS excluye materias primas. |
| 10.1 | Sept 2026 | Registro del incidente DNS de `dokploy-network` y corrección permanente mediante upstream explícito `kioskos_api`; CRUD de unidades, categorías y marcas; creación manual y automática de órdenes de compra desde reposición. |
| 10.2 | Sept 2026 | Corrección del flujo de pagos confirmados del POS: se evita la doble verificación de transferencias con comprobante y se hace idempotente la confirmación. |
| 10.3 | Sept 2026 | Dashboard: la gráfica incluye el día actual y permite consultar el detalle de ventas desde hoy, cada día del gráfico o un calendario. |
| 10.4 | Sept 2026 | POS: al abrir la ventana de ventas se muestran automáticamente los diez productos más vendidos de la sucursal; la búsqueda manual permanece disponible. |
| 10.5 | Sept 2026 | Dashboard: se corrige el desplazamiento de fechas causado por interpretar días calendario como UTC. |
| 10.6 | Sept 2026 | POS: se corrige el error `500` de sugerencias populares causado por `GROUP BY` incompatible con `ONLY_FULL_GROUP_BY`; se usa un subquery correlacionado. |
| 10.7 | Sept 2026 | Devoluciones parciales/totales de compras y ventas, anulaciones auditables de gastos, recepción real de órdenes, cuentas corrientes opcionales de proveedores e IVA por producto con desglose neto/bruto y asientos inversos. |
| 10.8 | Sept 2026 | Nueva sección `/current-accounts` para consultar movimientos de clientes y proveedores; abonos de clientes auditables con persistencia, asiento contable y migración `AddCustomerAccountPayments`. |
| 10.9 | Sept 2026 | Se aclara que las cuentas corrientes de clientes son los fiados existentes y se corrige la normalización de fechas del gráfico semanal para evitar ingresos en cero. |
| 10.10 | Sept 2026 | Auditoría SuperAdmin y multi-tenant: se cerró la creación privilegiada de usuarios, se validaron relaciones por tenant, se endurecieron entitlements, se actualizó el catálogo de módulos y se documentaron los planes actuales. |
| 10.11 | Sept 2026 | Se corrigió el login de la cuenta SuperAdmin de plataforma, se hizo reparable el seed de credenciales y se implementó la creación de usuarios del tenant con roles restringidos y límite según `max_users` del plan. |
