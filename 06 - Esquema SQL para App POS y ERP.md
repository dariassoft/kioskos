Para completar el ecosistema técnico de tu aplicación, aquí tienes el esquema SQL detallado. Este diseño sigue el principio de **aislamiento por tenant\_id**, es compatible con el enfoque de **TypeORM** y utiliza tipos de datos estándar para facilitar la migración entre **MySQL** y **PostgreSQL**.

### ---

**🗄️ Esquema SQL: Core de la Aplicación (POS & ERP)**

Este bloque de código define la estructura para soportar inventario multisucursal, ventas, fiados, compras y contabilidad.

SQL

\-- \==========================================  
\-- 1\. ESTRUCTURA DE ORGANIZACIÓN Y ACCESO  
\-- \==========================================

\-- Sucursales de cada negocio  
CREATE TABLE branches (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    name VARCHAR(100) NOT NULL,  
    address TEXT,  
    phone VARCHAR(50),  
    is\_main\_branch BOOLEAN DEFAULT false,  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Usuarios vinculados a sucursales y roles  
CREATE TABLE users (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    branch\_id VARCHAR(36) REFERENCES branches(id),  
    name VARCHAR(100) NOT NULL,  
    email VARCHAR(100) UNIQUE NOT NULL,  
    password\_hash VARCHAR(255) NOT NULL,  
    role ENUM('admin', 'manager', 'cashier') NOT NULL,  
    is\_active BOOLEAN DEFAULT true  
);

\-- \==========================================  
\-- 2\. CATÁLOGO DE PRODUCTOS E INVENTARIO  
\-- \==========================================

\-- Unidades de medida (Kg, Unidades, Litros, etc.)  
CREATE TABLE units (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    name VARCHAR(50) NOT NULL,  
    abbreviation VARCHAR(10)  
);

\-- Listas de Precios (Minorista, Mayorista, etc.)  
CREATE TABLE price\_lists (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    name VARCHAR(100) NOT NULL,  
    is\_default BOOLEAN DEFAULT false  
);

\-- Productos base  
CREATE TABLE products (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    unit\_id VARCHAR(36) REFERENCES units(id),  
    name VARCHAR(200) NOT NULL,  
    description TEXT,  
    barcode VARCHAR(100), \-- EAN/UPC para impresión y lectura  
    internal\_code VARCHAR(50),  
    category\_id VARCHAR(36),  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Precios por lista (Relación Muchos a Muchos con precio)  
CREATE TABLE product\_prices (  
    id VARCHAR(36) PRIMARY KEY,  
    product\_id VARCHAR(36) REFERENCES products(id),  
    price\_list\_id VARCHAR(36) REFERENCES price\_lists(id),  
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00  
);

\-- Stock Multisucursal y Alertas  
CREATE TABLE inventory (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    branch\_id VARCHAR(36) REFERENCES branches(id),  
    product\_id VARCHAR(36) REFERENCES products(id),  
    stock\_quantity DECIMAL(15, 2) NOT NULL DEFAULT 0.00,  
    min\_stock\_alert DECIMAL(15, 2) DEFAULT 5.00,  
    last\_restock\_date TIMESTAMP  
);

\-- \==========================================  
\-- 3\. VENTAS (POS) Y CLIENTES (FIADOS)  
\-- \==========================================

CREATE TABLE customers (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    name VARCHAR(150) NOT NULL,  
    email VARCHAR(100),  
    phone VARCHAR(50),  
    credit\_limit DECIMAL(15, 2) DEFAULT 0.00,  
    current\_debt DECIMAL(15, 2) DEFAULT 0.00 \-- Para el sistema de Fiados  
);

CREATE TABLE sales (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    branch\_id VARCHAR(36) REFERENCES branches(id),  
    user\_id VARCHAR(36) REFERENCES users(id),  
    customer\_id VARCHAR(36) REFERENCES customers(id),  
    total DECIMAL(15, 2) NOT NULL,  
    payment\_method ENUM('cash', 'card', 'transfer', 'credit\_client') NOT NULL,  
    status ENUM('completed', 'refunded', 'pending') DEFAULT 'completed',  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

CREATE TABLE sale\_items (  
    id VARCHAR(36) PRIMARY KEY,  
    sale\_id VARCHAR(36) REFERENCES sales(id),  
    product\_id VARCHAR(36) REFERENCES products(id),  
    quantity DECIMAL(15, 2) NOT NULL,  
    unit\_price DECIMAL(15, 2) NOT NULL,  
    subtotal DECIMAL(15, 2) NOT NULL  
);

\-- \==========================================  
\-- 4\. MOVIMIENTOS DE CAJA Y CONTABILIDAD  
\-- \==========================================

\-- Sesiones de Caja (Apertura y Cierre)  
CREATE TABLE cash\_registers (  
    id VARCHAR(36) PRIMARY KEY,  
    branch\_id VARCHAR(36) REFERENCES branches(id),  
    user\_id VARCHAR(36) REFERENCES users(id),  
    opening\_balance DECIMAL(15, 2) NOT NULL,  
    closing\_balance DECIMAL(15, 2),  
    cash\_sales DECIMAL(15, 2) DEFAULT 0,  
    status ENUM('open', 'closed') DEFAULT 'open',  
    opened\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
    closed\_at TIMESTAMP  
);

\-- Asientos Contables (Libro Diario)  
CREATE TABLE accounting\_ledger (  
    id VARCHAR(36) PRIMARY KEY,  
    tenant\_id VARCHAR(36) NOT NULL,  
    sale\_id VARCHAR(36) REFERENCES sales(id), \-- Opcional, para trazabilidad  
    date TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
    description TEXT,  
    account\_name VARCHAR(100) NOT NULL, \-- Ej: 'Caja', 'Ventas', 'Costo Mercadería'  
    debit DECIMAL(15, 2) DEFAULT 0.00,  
    credit DECIMAL(15, 2) DEFAULT 0.00  
);

\-- Devoluciones  
CREATE TABLE returns (  
    id VARCHAR(36) PRIMARY KEY,  
    sale\_id VARCHAR(36) REFERENCES sales(id),  
    reason TEXT,  
    refund\_amount DECIMAL(15, 2),  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

### ---

**💡 Notas de Diseño para tu Implementación**

1. **UUIDs:** He definido los IDs como VARCHAR(36). Si usas MySQL 8+, puedes usar BINARY(16) para mayor velocidad, o si migras a PostgreSQL, cámbialos a UUID. La IA en WebStorm/Cursor sabrá manejar VARCHAR(36) como un string estándar en TypeScript.  
2. **Sistema de Fiados:** La tabla customers tiene current\_debt. Cada vez que se realiza una venta con payment\_method \= 'credit\_client', debes disparar un proceso (o trigger) que sume el total al current\_debt del cliente.  
3. **Integridad Referencial:** Todas las tablas de transacciones (sales, inventory) incluyen tenant\_id. Esto es redundante pero **crítico** para la seguridad: permite que tus consultas siempre incluyan un WHERE tenant\_id \= '...', asegurando que un local nunca vea los datos de otro por error de programación.  
4. **Decimales:** He usado DECIMAL(15, 2\) para evitar los errores de redondeo de punto flotante (FLOAT/DOUBLE) en cálculos financieros.

¿Te gustaría que prepare un archivo **.env** de ejemplo con todas las variables necesarias para conectar NestJS con esta base de datos dentro de Docker?