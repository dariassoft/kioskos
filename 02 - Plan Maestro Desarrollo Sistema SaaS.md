Este documento ha sido diseñado como un **Blueprint de Ingeniería** exhaustivo. Está optimizado para ser procesado por modelos de IA (como los integrados en Cursor, WebStorm o Windsurf) y para servir de guía técnica definitiva para el desarrollo del sistema.

# ---

**🚀 Plan Maestro de Desarrollo: Sistema de Kioskos & Despenzas (SaaS)**

Este documento detalla la arquitectura, hoja de ruta y especificaciones técnicas para un sistema ERP/POS Multi-tenant, diseñado para alta escalabilidad y portabilidad de datos.

## **🛠 1\. Stack Tecnológico & Infraestructura**

### **Core Stack**

* **Backend:** NestJS (Node.js Framework) con TypeScript.  
* **Frontend:** React.js (Vite) \+ Tailwind CSS \+ Shadcn/UI.  
* **Base de Datos:** MySQL 8.0 (inicial) con **TypeORM** (Abstracción para migración transparente a PostgreSQL).  
* **Estado Global (Frontend):** TanStack Query (Data fetching) \+ Zustand (UI state).  
* **Documentación API:** Swagger (OpenAPI 3.0).

### **Entorno Dockerizado (docker-compose.yml)**

* services-api: NestJS en modo watch.  
* services-client: React en modo dev.  
* services-db: MySQL con volúmenes persistentes.  
* services-adminer: Para gestión visual de la DB en desarrollo.  
* services-redis: Para caching de sesiones y alertas automáticas.

## ---

**🏗 2\. Arquitectura de Datos (Multi-tenancy)**

Se utilizará una estrategia de **Aislamiento por Discriminador (tenant\_id)** para permitir una migración fluida entre motores de bases de datos.

### **Entidades Principales**

1. **Tenants (Negocios):** UUID, Nombre, Logo, Plan Actual, Status (Activo/Suspendido/Vencido).  
2. **Users:** Relacionados a un tenant\_id. Roles: SUPERADMIN, OWNER, MANAGER, CASHIER.  
3. **Products:** Stock global, alertas mínimas, códigos de barras (EAN/UPC).  
4. **Inventory (Multisucursal):** Tabla pivote product\_id \+ branch\_id \+ stock\_quantity.  
5. **Sales & SaleItems:** Registro de transacciones, método de pago (Efectivo, Tarjeta, Fiado).  
6. **Ledger (Asientos Contables):** Registro automático de Debe/Haber por cada movimiento de caja o venta.  
7. **Subscriptions:** Historial de pagos, módulos activos, fechas de vencimiento.

## ---

**📅 3\. Hoja de Ruta (Milestones)**

### **Fase 1: El Núcleo del Sistema (Semanas 1-2)**

* **Infraestructura:** Configuración de Docker, NestJS Boilerplate, y TypeORM con soporte dual MySQL/Postgres.  
* **Auth System:** Implementación de JWT con Multi-tenancy. El middleware debe extraer el tenant\_id del token.  
* **Panel SuperAdmin:** Creación de la interfaz para el dueño de la app (Gestión de suscripciones y activación de módulos).

### **Fase 2: Inventario & Productos (Semanas 3-4)**

* **Módulo de Productos:** CRUD con soporte para unidades ilimitadas y múltiples listas de precios.  
* **Multisucursal:** Lógica de asignación de stock por sede.  
* **Códigos de Barras:** Servicio de generación y lectura.

### **Fase 3: El Corazón Comercial (Semanas 5-6)**

* **POS (Punto de Venta):** Interfaz ultra-rápida. Manejo de carrito, descuentos y múltiples medios de pago.  
* **Caja Registradora:** Flujo de apertura, movimientos de caja y cierre diario.  
* **Fiados:** Módulo de cuentas corrientes de clientes con límites de crédito.

### **Fase 4: Operaciones Avanzadas & Contabilidad (Semanas 7-8)**

* **Compras & Proveedores:** Registro de facturas de compra y actualización automática de stock/costos.  
* **Devoluciones:** Lógica de reingreso a stock y notas de crédito.  
* **Asientos Contables:** Automatización de registros contables basados en eventos del sistema (ventas/gastos).

### **Fase 5: BI, Reportes & Personalización (Semanas 9-10)**

* **Alertas:** Sistema de notificaciones automáticas (Stock bajo, vencimiento de deudas).  
* **Dashboard BI:** Gráficos de ventas, productos más vendidos y márgenes de ganancia.  
* **Personalización:** Sistema de carga de logos y configuración de tickets/facturas.

## ---

**🛠 4\. Detalles de Implementación Técnica (Para IA/Devs)**

### **Lógica de Base de Datos Portátil (NestJS \+ TypeORM)**

Para permitir el cambio MySQL ↔ PostgreSQL, todas las entidades deben evitar decoradores específicos del motor.

TypeScript

@Entity('products')  
export class Product {  
  @PrimaryGeneratedColumn('uuid')  
  id: string;

  @Column()  
  tenant\_id: string; // Discriminador Multi-tenant

  @Column({ type: 'decimal', precision: 12, scale: 2 })  
  price: number;

  @OneToMany(() \=\> Stock, (stock) \=\> stock.product)  
  stocks: Stock\[\];  
}

### **Módulo de Suscripciones (Panel del Dueño)**

El SuperAdmin gestionará una tabla subscriptions:

* status: enum ('active', 'past\_due', 'canceled', 'trialing').  
* modules: JSONB/Text que define qué features están desbloqueadas (ej: {"accounting": true, "multisite": true}).  
* **Middleware de Validación:** Un Guard en NestJS que verifique antes de cada acción si el tenant tiene el módulo contratado y el pago al día.

### **Algoritmo de Alertas de Stock**

Un cron-job diario o un trigger en la tabla inventory comparará current\_stock vs min\_stock. Si es menor, disparará un evento mediante WebSockets (Socket.io) al dashboard del cliente.

### **Integración de Asientos Contables**

Cada venta debe disparar un evento (NestJS EventEmitter). El AccountingListener capturará el evento y creará dos entradas:

1. **Debe:** Cuenta de Caja o Cuenta Corriente (Cliente).  
2. **Haber:** Cuenta de Ventas e Impuestos.

## ---

**🖥 5\. Interfaz de Usuario (Frontend)**

### **Layouts Dinámicos**

* **Admin App:** Dashboard colapsable, tablas con filtrado avanzado (React Table), formularios con validación (Zod \+ React Hook Form).  
* **POS Mode:** Interfaz optimizada para teclado y pantallas táctiles, búsqueda rápida por nombre o scanner.  
* **SuperAdmin:** Dashboard simplificado con métricas de MRR (Ingresos Mensuales Recurrentes) y salud de los clientes.

## ---

**🚀 6\. Despliegue & Escalabilidad**

1. **CI/CD:** Pipeline de GitHub Actions para build de imágenes Docker.  
2. **Backup:** Script automatizado de dumping de MySQL a S3 cada 24 horas.  
3. **Logs:** Implementación de Winston o Pino para trazabilidad de errores por tenant\_id.

---

**Nota para el Modelo de IA:** Al generar código basado en este plan, priorizar la creación de módulos desacoplados. Cada funcionalidad (Ventas, Stock, Contabilidad) debe residir en su propio módulo de NestJS para facilitar el mantenimiento y la activación selectiva por plan de suscripción.

---

**¿Deseas que genere el archivo docker-compose.yml inicial o el esquema de base de datos para las suscripciones del SuperAdmin?**