Basado en el análisis del sitio **Kioskos\&Despenzas**, he diseñado un plan de desarrollo integral utilizando el stack tecnológico que mencionaste (**NestJS, React, Docker y MySQL/PostgreSQL**).

### **1\. Resumen de Funcionalidades a Implementar**

El sistema se divide en varios módulos clave extraídos de las descripciones del sitio:

* **Módulo de Ventas y POS:** Terminal de punto de venta rápido, soporte para efectivo, tarjeta y "fiados" (créditos a clientes).  
* **Gestión de Inventario:** Control de stock, alertas de agotamiento, impresión de códigos de barras y soporte multisucursal.  
* **Administración de Clientes y Proveedores:** Historial de compras, gestión de deudas (fiados) y cuentas corrientes.  
* **Módulo de Compras:** Registro de ingresos de mercadería y gestión con proveedores.  
* **Reportes y BI:** Dashboard en tiempo real, reportes en PDF/Excel y análisis de ventas.  
* **Configuración y Usuarios:** Roles y permisos (RBAC), múltiples listas de precios y personalización de marca.

### ---

**2\. Arquitectura del Sistema**

Para garantizar la escalabilidad y la facilidad de migración de base de datos, utilizaremos una arquitectura desacoplada.

* **Infraestructura:** Docker Compose para orquestar los contenedores (App, API, DB).  
* **Backend (NestJS):** Implementaremos el patrón **Repository** mediante **TypeORM**. Esto permitirá que el cambio de MySQL a PostgreSQL sea solo una cuestión de configuración en el data-source.ts y el cambio de driver en el package.json.  
* **Frontend (React):** Arquitectura basada en componentes (Vite) con **TanStack Query** para la gestión de estado de servidor y **Tailwind CSS** para un diseño responsive.

### ---

**3\. Plan de Desarrollo (Roadmap)**

#### **Fase 1: Cimientos e Infraestructura (Semanas 1-2)**

* Configuración de entornos Docker (Development, Staging).  
* Configuración de NestJS con TypeORM y migraciones iniciales.  
* Implementación de Autenticación (JWT) y Sistema de Roles (Admin, Vendedor, Gerente).  
* Estructura base de la UI en React.

#### **Fase 2: Núcleo de Inventario y Productos (Semanas 3-4)**

* CRUD de Productos con soporte para categorías y marcas.  
* Lógica de control de stock y alertas automáticas.  
* Generador de códigos de barras (integración con librerías de backend).  
* Gestión de múltiples listas de precios (Minorista/Mayorista).

#### **Fase 3: Terminal de Ventas (POS) y Clientes (Semanas 5-6)**

* Desarrollo de la interfaz de venta rápida (Punto de Venta).  
* Lógica de transacciones (Caja registradora, apertura y cierre).  
* Módulo de Clientes y sistema de **"Fiados"** (Gestión de deuda).  
* Integración de métodos de pago.

#### **Fase 4: Compras, Proveedores y Sucursales (Semanas 7-8)**

* Módulo de órdenes de compra y recepción de stock.  
* Gestión de Proveedores.  
* Lógica Multisucursal (Transferencias de stock entre depósitos).  
* Gestión de Devoluciones.

#### **Fase 5: Reportes, BI y Pulido (Semanas 9-10)**

* Dashboard con métricas en tiempo real (Chart.js o Recharts).  
* Exportación de reportes a PDF y Excel (ExcelJS / PDFKit).  
* Personalización (Logo del negocio en tickets y reportes).  
* Pruebas de migración de MySQL a PostgreSQL para validar la portabilidad.

### ---

**4\. Estrategia de Suscripciones (Modelado de Base de Datos)**

El sistema debe estar diseñado para ser **Multi-tenant**. Cada cliente (negocio) tendrá su propio tenant\_id.

| Característica | Plan Emprendedor | Plan Negocio | Plan Profesional |
| :---- | :---- | :---- | :---- |
| **Usuarios** | 1 (Solo dueño) | Hasta 3 | Ilimitados |
| **Sucursales** | 1 | 1 | 2+ |
| **Reportes** | Últimos 30 días | Histórico completo | Business Intelligence |
| **Soporte** | Email | Email | WhatsApp Dedicado |

### **5\. Consideraciones Técnicas Críticas**

1. **Migración de DB:** Al usar **TypeORM**, asegúrate de no usar funciones específicas de MySQL (como JSON\_CONTAINS) si planeas moverte a Postgres pronto; utiliza funciones estándar de SQL.  
2. **Docker:** El Dockerfile del backend debe ser multi-etapa para optimizar el tamaño de la imagen en producción.  
3. **Seguridad:** Implementar *CORS policy* correctamente (dado que has tenido problemas previos con esto) configurando los orígenes permitidos en el main.ts de NestJS.
---

## ✅ ACTUALIZACIÓN DE ESTADO — Septiembre 2026

> Este plan fue la base del proyecto. El desarrollo se completó y superó lo planificado. Estado real verificado contra el código (ver `AGENTS.md` v9.0 para el detalle completo):

### Estado de las fases originales

| Fase planificada | Estado | Notas |
|---|---|---|
| **Fase 1** — Cimientos, Docker, Auth JWT, Roles | ✅ Completada | + Multi-tenant por columna, SuperAdmin panel, Billing |
| **Fase 2** — Inventario, productos, stock, listas de precios | ✅ Completada | + Marcas, alertas WS en tiempo real, precios masivos, imágenes |
| **Fase 3** — POS, Clientes, Fiados, Caja | ✅ Completada | + Medios de pago: QR/Link MercadoPago, transferencias con comprobante |
| **Fase 4** — Compras, Proveedores, Devoluciones | ✅ Completada | + Asientos contables automáticos (event-driven) |
| **Fase 5** — Reportes, BI, Exportación | ✅ Completada | Dashboard con Recharts, métricas, valuación de inventario |

### Funcionalidades agregadas más allá del plan original

1. **Fase 6-8:** SuperAdmin completo (MRR, suscripciones, planes), gestión de sucursales/usuarios, hardening con migraciones TypeORM, CI/CD (GitHub Actions) y deploy en VPS con **Dokploy** (`docker-compose.prod.yml` + Nginx).
2. **Fase 9 — Facturación Electrónica AFIP:** Credenciales encriptadas (AES-256-CBC), generación de CAE vía AfipSDK, PDF con QR, toggle de facturación en el POS, modo homologación/producción.
3. **Fase 10 — Checkout self-service:** Landing pública, registro de nuevos negocios con pago online (MercadoPago) o transferencia con aprobación manual.
4. **Fase 11 — Medios de pago del POS:** OAuth de MercadoPago por tenant, cuentas de pago (alias/CBU), verificación de pagos pendientes.
5. **Fase 12 — Promociones y Referidos:** Descuentos por plan con vigencia, códigos de referido, prorrateo y próximos cobros.
6. **Fase 13 — Gastos, System Settings y PWA:** Módulo de gastos con categorías, settings globales de plataforma, app instalable (PWA) y servicio de mail.

### Consideraciones técnicas — validación final

1. **Migración de DB:** ✅ TypeORM portable, `synchronize: false`, 5 migraciones versionadas. Drivers `mysql2` y `pg` instalados.
2. **Docker:** ✅ Backend multi-etapa (development/production); frontend con etapa Nginx para producción.
3. **Seguridad CORS:** ✅ Origen explícito vía `FRONTEND_URL` en `main.ts`; prefijo global `/api/v1`; Swagger en `/api/docs`.

---

## 🏭 FASE 14 — Producción y Fraccionamiento (Septiembre 2026) ✅

Funcionalidad agregada más allá del plan original, solicitada por negocios que compran a granel o elaboran productos:

- **Productos Fraccionados:** compra de bultos grandes (ej: bolsa de alimento 20/25kg) que se fraccionan en unidades vendibles (bolsas de 1kg).
- **Productos Elaborados:** insumos que se transforman en productos vendibles (ej: caja de pollos —cantidad variable por kg— → pata-muslo, pechuga, alitas, milanesas, albóndigas, carne molida).

### Implementación

| Componente | Detalle |
|---|---|
| `products.product_type` | `standard` (default) / `raw_material` (insumo, oculto en POS) / `fractionated` / `elaborated` |
| **Recetas** (`recipes`, `recipe_items`) | Consumo **aproximado** de insumos por tanda; precargan producciones y alimentan la calculadora de requerimientos |
| **Órdenes de producción** (`production_orders`, `production_inputs`, `production_outputs`) | Registro real con cantidades variables; multi-output (desposte); transacción atómica de stock |
| **Costeo** | Prorrateo automático del costo de insumos a los productos obtenidos (o `unit_cost` manual) |
| **Seguimiento de insumos** | **Calculado, no bloqueante:** el stock de materias primas puede quedar negativo con advertencia |
| **Frontend** | Página `/production` (tabs Producciones/Recetas), calculadora de insumos, selector de tipo en el modal de producto |
| **No rompe lo existente** | Productos `standard` intactos; POS solo excluye `raw_material`; nueva migración `AddProductionModule` |

Endpoints: `/api/v1/production/recipes`, `/api/v1/production/orders`, `/api/v1/production/requirements`. Detalle completo en `AGENTS.md` v10.0.
