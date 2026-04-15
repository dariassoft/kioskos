Aquí tienes el documento técnico integral. Está diseñado específicamente para ser interpretado por herramientas de IA dentro de tu IDE (como Cursor o WebStorm), proporcionando el contexto necesario para generar código modular, escalable y portante.

# ---

**📂 DOCUMENTO DE INGENIERÍA: SISTEMA ERP Kioskos & Despenzas (SAAS)**

Este archivo sirve como **Contexto Maestro** para el desarrollo de un sistema ERP Multi-tenant utilizando **NestJS, React, Docker y MySQL/PostgreSQL**.

## ---

**🏗️ 1\. ESPECIFICACIONES TÉCNICAS CORE**

### **Infraestructura y Entorno (Dockerizado)**

El sistema debe ejecutarse en tres contenedores principales definidos en docker-compose.yml:

* **Backend:** NestJS (Node.js) con hot-reload.  
* **Frontend:** React (Vite) en modo desarrollo.  
* **Database:** MySQL 8.0 (Configurado para permitir migración transparente a PostgreSQL mediante TypeORM).

### **Estrategia Multi-tenancy**

Se utilizará **Aislamiento por Columna (tenant\_id)**. Cada tabla principal debe contener una columna tenant\_id: UUID para filtrar los datos según el negocio que ha iniciado sesión.

## ---

**🛠️ 2\. ARQUITECTURA DEL BACKEND (NESTJS)**

### **Gestión de Base de Datos (TypeORM)**

Para cumplir con la portabilidad MySQL/Postgres:

1. **Repository Pattern:** Evitar SQL nativo. Usar QueryBuilder.  
2. **Data Types:** Usar decimal para precios y timestamp para fechas.  
3. **CORS Policy:** Configurar de forma dinámica para permitir el acceso desde el dominio del frontend, evitando errores de bloqueo previos.

### **Módulos Requeridos**

* **AuthModule:** Passport JWT \+ Manejo de roles (SUPERADMIN, ADMIN, VENDEDOR).  
* **TenantModule:** Gestión de la configuración del negocio (nombre, logo, plan).  
* **InventoryModule:** Productos, stock por sucursal, categorías y alertas automáticas.  
* **SalesModule:** POS, gestión de "Fiados", devoluciones y caja registradora.  
* **AccountingModule:** Generación automática de asientos contables mediante un EventEmitter.  
* **BillingModule:** Gestión de suscripciones de los clientes (solo accesible para el dueño de la app).

## ---

**🖥️ 3\. ARQUITECTURA DEL FRONTEND (REACTJS)**

### **UI & State Management**

* **Tailwind CSS \+ Shadcn/UI:** Para una interfaz moderna y responsive.  
* **TanStack Query (v5):** Para manejo de caché y sincronización de datos con el servidor.  
* **Zustand:** Para el estado global ligero (datos del usuario actual, sucursal seleccionada).

## ---

**📊 4\. PLAN DE DESARROLLO POR FASES (DETALLADO)**

### **Fase 1: El Core y SuperAdmin (Semanas 1-2)**

* **Base de Datos:** Definir esquema de Tenants y Subscriptions.  
* **Auth:** Login/Register. El SuperAdmin tiene acceso a /admin/tenants para ver cobros, planes activos y vencimientos.  
* **Módulo de Suscripción:** Lógica para bloquear/desbloquear módulos (ej. si el cliente no pagó, el POS se bloquea).

### **Fase 2: Inventario Multisucursal e Ilimitado (Semanas 3-4)**

* **Productos:** Carga masiva, soporte para unidades ilimitadas.  
* **Stock:** Tabla pivote ProductBranch para manejar el stock por sucursal (mínimo 2 sucursales iniciales).  
* **Barcodes:** Generación de PDF con códigos de barras mediante pdfkit.

### **Fase 3: POS y Clientes/Fiados (Semanas 5-6)**

* **Terminal POS:** Interfaz de búsqueda rápida. Registro de ventas.  
* **Fiados (Cuentas Corrientes):** Tabla ClientCredits. Cada venta "fiada" aumenta la deuda. Reporte de clientes morosos.  
* **Caja Registradora:** Flujo de Apertura \-\> Ventas \-\> Cierre de Caja.

### **Fase 4: BI y Reportes Avanzados (Semanas 7-8)**

* **Dashboards:** Visualización con Recharts de ventas diarias, semanales y mensuales.  
* **Métricas BI:** Análisis de productos con mayor margen de ganancia y rotación de stock.  
* **Exportación:** Generación de Excel (usando exceljs) para cada módulo.

### **Fase 5: Contabilidad y Asientos (Semanas 9-10)**

* **Automatización:** Cada venta genera un asiento contable (Debe/Haber).  
* **Módulo de Compras:** Registro de facturas de proveedores que alimentan automáticamente el stock y la contabilidad.  
* **Personalización:** Interfaz para que cada cliente suba su logo y personalice sus tickets de venta.

## ---

**📁 5\. ESTRUCTURA DE LA BASE DE DATOS (PARA IA)**

SQL

\-- Principales tablas para el modelo Multi-tenant  
Table tenants {  
  id uuid \[pk\]  
  name varchar  
  plan\_type enum \-- 'emprendedor', 'negocio', 'profesional'  
  status enum \-- 'active', 'overdue', 'trial'  
  logo\_url varchar  
}

Table products {  
  id uuid \[pk\]  
  tenant\_id uuid \[ref: \> tenants.id\]  
  sku varchar  
  name varchar  
  price\_retail decimal  
  price\_wholesale decimal  
}

Table inventory {  
  id uuid \[pk\]  
  product\_id uuid \[ref: \> products.id\]  
  branch\_id uuid  
  quantity int  
  min\_stock\_alert int  
}

Table sales {  
  id uuid \[pk\]  
  tenant\_id uuid \[ref: \> tenants.id\]  
  total decimal  
  payment\_method enum \-- 'cash', 'card', 'fiado'  
  created\_at timestamp  
}

## ---

**🛠️ 6\. CONFIGURACIÓN DEL PANEL DE DUEÑO (SUPERADMIN)**

El dueño de la plataforma tendrá un acceso exclusivo (owner.Kioskos\&Despenzas.com) para:

1. **Dashboard de Ingresos:** Visualizar cobros totales del mes.  
2. **Gestión de Clientes:**  
   * Activar/Desactivar Tenants manualmente.  
   * Ver historial de facturación de cada negocio.  
   * Configurar módulos extra por cliente.  
3. **Vencimientos:** Lista de negocios con suscripción por vencer en los próximos 5 días.

## ---

**📝 7\. NOTAS PARA EL DESARROLLO (PUNTOS CRÍTICOS)**

* **Rendimiento:** Implementar paginación en el backend (limit/offset) desde el día 1, ya que el sistema maneja productos y ventas ilimitadas.  
* **Seguridad:** El tenant\_id **nunca** debe ser enviado por el frontend en el cuerpo de la petición; el backend debe extraerlo del JWT decodificado para evitar que un usuario vea datos de otro negocio.  
* **Impresión:** Optimizar el CSS para impresión de tickets de 58mm y 80mm.

---

**Instrucción para la IA:** *Utiliza este archivo como guía de referencia para crear los controladores, entidades y componentes. Al generar código, respeta siempre la estructura de carpetas modular y el tipado estricto de TypeScript.*