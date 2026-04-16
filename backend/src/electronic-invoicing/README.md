# Módulo de Facturación Electrónica AFIP

## ✅ Implementación Completada

Este módulo permite a los comercios emitir **facturas electrónicas válidas ante AFIP** (Argentina) directamente desde Kioskos & Despenzas.

---

## 📦 Componentes Implementados

### Backend (NestJS)

#### Entidades
- ✅ `AfipCredentials` — Almacena credenciales AFIP encriptadas (AES-256-CBC)
- ✅ `ElectronicInvoice` — Registro de cada factura emitida con CAE

#### Servicio (`ElectronicInvoicingService`)
- ✅ Encriptación/desencriptación de certificados y claves AFIP
- ✅ Guardado seguro de credenciales AFIP por tenant
- ✅ Test de conexión con AFIP
- ✅ Generación automática de facturas A/B/C según tipo de contribuyente
- ✅ Listado y consulta de facturas emitidas
- ✅ Validación de feature por plan de suscripción

#### Controlador (`ElectronicInvoicingController`)
- ✅ `GET /electronic-invoicing/credentials` — Ver configuración (sin secretos)
- ✅ `POST /electronic-invoicing/credentials` — Guardar credenciales AFIP
- ✅ `GET /electronic-invoicing/credentials/test` — Probar conexión
- ✅ `GET /electronic-invoicing/invoices` — Listar facturas (paginado)
- ✅ `GET /electronic-invoicing/invoices/:id` — Ver detalle
- ✅ `POST /electronic-invoicing/invoices` — Emitir factura electrónica

### Frontend (React + TypeScript)

#### API Client
- ✅ `afip.types.ts` — Tipos TypeScript completos
- ✅ `afip.api.ts` — Cliente HTTP con Axios
- ✅ `useAfip.ts` — Hooks de React Query

#### Componentes
- ✅ `AfipTab.tsx` — Configuración AFIP en Settings (pestañaañadida)
- ✅ `AfipInvoicesPage.tsx` — Listado de facturas emitidas
- ✅ Ruta `/afip/invoices` agregada al App.tsx
- ✅ Menú "Facturas AFIP" agregado al AdminLayout

---

## 🔐 Seguridad

### Encriptación de Credenciales

Todos los datos sensibles (CUIT, certificados, claves privadas, access tokens) se almacenan **encriptados en la base de datos** usando:

- **Algoritmo:** AES-256-CBC
- **Clave derivada:** PBKDF con `scrypt` desde `AFIP_ENCRYPTION_SECRET` (.env)
- **IV único:** Se genera un IV aleatorio para cada valor cifrado
- **Formato almacenado:** `iv_hex:encrypted_hex`

### Variables de Entorno

Se agregó al `.env`:

```bash
# Clave maestra para cifrado de credenciales AFIP (cambiar en producción)
AFIP_ENCRYPTION_SECRET=dev_afip_encription_secret_cambiar_en_produccion_2026
```

⚠️ **IMPORTANTE:** Usar una clave fuerte (mínimo 32 caracteres aleatorios) en producción.

---

## 🎯 Funcionalidades

### Configuración por Tenant

Cada kiosko puede configurar:

1. **Modo de autenticación:**
   - **Access Token** (recomendado): Token gratuito de [AfipSDK.com](https://app.afipsdk.com)
   - **Certificado propio**: `.crt` + `.key` generados en AFIP (avanzado)

2. **Datos del emisor:**
   - CUIT (11 dígitos)
   - Razón social
   - Punto de venta (1-99999)
   - Tipo de IVA: Monotributista o Responsable Inscripto

3. **Entorno:**
   - **Homologación (testing)**: Para pruebas, sin valor fiscal
   - **Producción**: Facturas válidas ante AFIP

### Emisión Automática de Facturas

El sistema **determina automáticamente el tipo de comprobante** según el contribuyente:

| Emisor | Receptor | Tipo Emitido |
|---|---|---|
| **Monotributista** | Cualquiera | **Factura C** (11) |
| **Responsable Inscripto** | RI con CUIT | **Factura A** (1) |
| **Responsable Inscripto** | Consumidor Final / DNI | **Factura B** (6) |

### Prueba de Conexión

Botón "Probar Conexión con AFIP" en la interfaz de configuración:
- Verifica que las credenciales sean válidas
- Muestra el último número de comprobante emitido
- Indica si está en homologación o producción

---

## 📊 Planes y Suscripciones

El módulo de facturación electrónica se agregó al feature `electronic_invoicing` en los planes:

```json
{
  "accounting": true,
  "multisite": false,
  "reports_history": true,
  "pdf_export": true,
  "email_alerts": false,
  "electronic_invoicing": true  // ✅ NUEVO
}
```

### Distribución por Plan

| Plan | Facturación AFIP |
|---|---|
| **Emprendedor** | ❌ No incluido |
| **Negocio** | ✅ Incluido |
| **Profesional** | ✅ Incluido |

El servicio valida automáticamente con `BillingService.isFeatureEnabled()` antes de cada operación.

---

## 🧪 Modo Homologación (Testing)

AFIP provee un entorno de **homologación** para pruebas:

- **URL:** `https://wswhomo.afip.gov.ar/wsfev1/service.asmx`
- **Función:** Permite emitir comprobantes de prueba **sin validez fiscal**
- **Requisitos:** Mismo certificado/token que producción, pero en modo `production: false`
- **Recomendación:** Siempre probar en homologación antes de activar producción

En la base de datos, las facturas de testing se marcan con `is_test: true`.

---

## 📚 Referencias Útiles

1. [Documentación WSAA AFIP](https://www.afip.gob.ar/ws/documentacion/wsaa.asp)
2. [Guía de Factura Electrónica AFIP](https://afipsdk.com/blog/crear-factura-electronica-de-afip-via-api/)
3. [AfipSDK.com](https://app.afipsdk.com) — Plataforma para obtener Access Token gratuito
4. [SDK @afipsdk/afip.js](https://www.npmjs.com/package/@afipsdk/afip.js)

---

## 🚀 Próximos Pasos (Opcionales)

- [ ] Integración con el POS para emitir factura automáticamente al cobrar
- [ ] Generación de PDF de factura con QR de validación AFIP
- [ ] Envío de factura por email al cliente
- [ ] Notas de crédito (anulación de facturas)
- [ ] Sincronización automática con sistema contable
- [ ] Dashboard de facturas mensuales (gráficos, totales)

---

## 🔧 Mantenimiento

### Renovar Certificado AFIP

Los certificados `.crt` de AFIP tienen una validez limitada (generalmente 1-2 años). Cuando venza:

1. Generar nuevo certificado en AFIP
2. Ir a **Configuración → Facturación AFIP**
3. Actualizar el certificado y clave privada
4. Guardar

El sistema reemplazará automáticamente el certificado encriptado.

### Migración de Homologación a Producción

1. Probar todo en homologación hasta estar seguro
2. Activar checkbox "Modo Producción"
3. Guardar credenciales
4. Probar conexión
5. Emitir primera factura de prueba con importe mínimo

---

**Implementado en:** Abril 2026
**Fase:** 9 — Facturación Electrónica AFIP
**Estado:** ✅ Completada y lista para pruebas

