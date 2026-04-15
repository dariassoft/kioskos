Excelente. Para que tu equipo de desarrollo o tu IA de cabecera comiencen a trabajar de inmediato, aquí tienes los dos componentes estructurales más importantes: la orquestación del entorno y el modelo de datos de control.

## ---

**🐋 1\. Archivo docker-compose.yml (Entorno de Desarrollo)**

Este archivo levanta el ecosistema completo. He incluido una red interna y volúmenes persistentes para asegurar que los datos de tu base de datos no se pierdan al apagar los contenedores.

YAML

version: '3.8'

services:  
  \# Base de Datos Principal (MySQL inicialmente)  
  db:  
    image: mysql:8.0  
    container\_name: KioskosDespenzas\_mysql  
    #restar: always  
    environment:  
      MYSQL\_DATABASE: KioskosDespenzas\_db  
      MYSQL\_ROOT\_PASSWORD: root\_password  
      MYSQL\_USER: dev\_user  
      MYSQL\_PASSWORD: dev\_password  
    ports:  
      \- "3306:3306"  
    volumes:  
      \- mysql\_data:/var/lib/mysql  
    networks:  
      \- g360\_network

  \# Backend \- NestJS API  
  api:  
    build:  
      context: ./backend  
      dockerfile: Dockerfile  
    container\_name: g360\_api  
    #restar: always  
    ports:  
      \- "3000:3000"  
    environment:  
      \- DATABASE\_HOST=db  
      \- DATABASE\_PORT=3306  
      \- DATABASE\_USER=dev\_user  
      \- DATABASE\_PASSWORD=dev\_password  
      \- DATABASE\_NAME=KioskosDespenzas\_db  
      \- JWT\_SECRET=super\_secret\_key\_2026  
    volumes:  
      \- ./backend:/usr/src/app  
      \- /usr/src/app/node\_modules  
    depends\_on:  
      \- db  
    networks:  
      \- g360\_network

  \# Frontend \- React (Vite)  
  client:  
    build:  
      context: ./frontend  
      dockerfile: Dockerfile  
    container\_name: g360\_client  
    #restar: always  
    ports:  
      \- "5173:5173"  
    volumes:  
      \- ./frontend:/usr/src/app  
      \- /usr/src/app/node\_modules  
    environment:  
      \- VITE\_API\_URL=http://localhost:3000  
    depends\_on:  
      \- api  
    networks:  
      \- g360\_network

networks:  
  g360\_network:  
    driver: bridge

volumes:  
  mysql\_data:

## ---

**📊 2\. Esquema de Base de Datos para el SuperAdmin**

Este esquema está diseñado para que tú, como dueño de la aplicación, puedas controlar quién tiene acceso a qué. Utiliza una estructura de "Módulos" dinámica para que puedas activar o desactivar funcionalidades (como "Asientos Contables") según el pago del cliente.

### **Diagrama de Entidades (Lógica de Suscripción)**

SQL

\-- 1\. Definición de Planes (Configurado por el SuperAdmin)  
CREATE TABLE plans (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    name VARCHAR(50) NOT NULL, \-- 'Emprendedor', 'Negocio', 'Profesional'  
    description TEXT,  
    price\_monthly DECIMAL(12, 2) NOT NULL,  
    max\_branches INT DEFAULT 1,  
    max\_users INT DEFAULT 1,  
    features JSON, \-- {"accounting": true, "inventory\_pro": false, etc.}  
    is\_active BOOLEAN DEFAULT true  
);

\-- 2\. Clientes / Negocios (Tenants)  
CREATE TABLE tenants (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    business\_name VARCHAR(100) NOT NULL,  
    tax\_id VARCHAR(50) UNIQUE, \-- CUIT/CUIL en Argentina  
    owner\_email VARCHAR(100) NOT NULL,  
    logo\_url VARCHAR(255),  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
    status ENUM('active', 'suspended', 'trial', 'past\_due') DEFAULT 'trial'  
);

\-- 3\. Suscripciones Activas  
CREATE TABLE subscriptions (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    tenant\_id UUID REFERENCES tenants(id),  
    plan\_id UUID REFERENCES plans(id),  
    start\_date DATE NOT NULL,  
    end\_date DATE NOT NULL,  
    auto\_renew BOOLEAN DEFAULT true,  
    last\_payment\_date TIMESTAMP,  
    next\_billing\_date DATE  
);

\-- 4\. Historial de Cobros (Para tu gestión financiera)  
CREATE TABLE billing\_history (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    tenant\_id UUID REFERENCES tenants(id),  
    amount DECIMAL(12, 2) NOT NULL,  
    payment\_status EN\_STATUS('paid', 'pending', 'failed'),  
    payment\_method VARCHAR(50), \-- 'MercadoPago', 'Transferencia'  
    invoice\_url VARCHAR(255),  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

## ---

**🛠️ Instrucciones de Implementación en NestJS**

Para que tu modelo de datos sea portátil entre MySQL y Postgres, te sugiero crear un **BaseEntity** en NestJS que todas tus entidades hereden:

TypeScript

// backend/src/common/base.entity.ts  
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

export abstract class BaseG360Entity {  
  @PrimaryGeneratedColumn('uuid')  
  id: string;

  @Column({ type: 'uuid', nullable: false })  
  tenant\_id: string; // Discriminador Multi-tenant crítico

  @CreateDateColumn()  
  created\_at: Date;

  @UpdateDateColumn()  
  updated\_at: Date;  
}

### **Seguridad del SuperAdmin**

Para la interfaz de gestión de suscripciones, debes implementar un Guard específico que solo permita el acceso si el user.role \=== 'SUPERADMIN'. Esto evitará que los dueños de los locales vean la facturación de otros negocios o modifiquen sus propios planes.

¿Te gustaría que redacte ahora el **Middleware de Extracción de Tenant** para NestJS, que es lo que garantiza que un cliente nunca vea los datos de otro?