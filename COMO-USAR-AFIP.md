# 📘 Guía de Usuario — Facturación Electrónica AFIP
## 🎯 Introducción
Este módulo te permite **emitir facturas electrónicas válidas ante AFIP** directamente desde tu sistema de gestión. Es ideal para kioskos, despensas y comercios que necesitan cumplir con la normativa fiscal argentina.
---
## ✅ Requisitos Previos
1. **Plan habilitado**: Necesitás estar suscripto al plan **Negocio** o **Profesional**
2. **Cuenta en AFIP**: Tener un CUIT activo y habilitado para facturación electrónica
3. **Punto de venta**: Número de punto de venta autorizado por AFIP (generalmente 1-5)
---
## 🚀 Configuración Inicial (Una Sola Vez)
### Opción 1: Con Access Token (Recomendado — Más Simple)
1. **Obtener Access Token Gratuito**:
   - Ingresá a https://app.afipsdk.com
   - Creá una cuenta gratis
   - Generá tu Access Token
   - Copialo (lo necesitarás en el paso 4)
2. **Configurar en Kioskos & Despenzas**:
   - Iniciá sesión en tu panel
   - Menú **Configuración** → **Facturación AFIP**
   - Modo de autenticación: **Access Token (AfipSDK.com)**
3. **Completar Datos**:
   - **CUIT**: Tu CUIT de 11 dígitos (ej: 20123456789)
   - **Access Token**: Pegá el token que copiaste
   - **Punto de Venta**: Generalmente 1 (consultá con AFIP)
   - **Razón Social**: Tu nombre comercial
   - **Tipo IVA**: 
     - Monotributista → emite Factura C
     - Responsable Inscripto → emite Facturas A o B
4. **Modo de Operación**:
   - **Dejá DESACTIVADO "Modo Producción"** inicialmente
   - Esto te permite probar sin generar facturas reales
5. **Guardar y Probar**:
   - Click en **"Guardar Credenciales"**
   - Click en **"Probar Conexión con AFIP"**
   - Si todo está bien, verás un mensaje de éxito
### Opción 2: Con Certificado Propio (Avanzado)
Solo para usuarios con conocimientos técnicos que ya tienen certificado de AFIP:
1. Descargar tu certificado `.crt` y clave `.key` de AFIP
2. Elegir modo **Certificado + Clave Privada**
3. Pegar el contenido de ambos archivos en los campos correspondientes
4. Completar el resto de los datos (igual que Opción 1)
---
## 💳 Emitir tu Primera Factura
### En Modo Homologación (Testing)
1. Ir a **Facturas AFIP** en el menú
2. Click en **"Nueva Factura"** (si hay botón, sino se muestra formulario)
3. Completar:
   - **Concepto**: Productos (1) / Servicios (2) / Ambos (3)
   - **Receptor**: 
     - Tipo doc: DNI / CUIT / Sin especificar (consumidor final)
     - Número: El documento del cliente (o 0 para consumidor final)
     - Nombre: Opcional
   - **Importes**:
     - Total: El monto total de la factura
     - Si sos Responsable Inscripto, también completá Neto e IVA
4. **Enviar** → El sistema:
   - Determina el tipo de factura (A/B/C) automáticamente
   - Se conecta con AFIP
   - Obtiene el CAE (Código de Autorización)
   - Guarda la factura
5. **Resultado**:
   - Verás el CAE asignado
   - La factura queda registrada con marca "TEST"
   - **No tiene validez fiscal** (es solo prueba)
### Activar Modo Producción
Solo cuando hayas probado todo y estés seguro:
1. **Configuración → Facturación AFIP**
2. Activar checkbox **"Modo Producción"**
3. Guardar
4. Probar conexión nuevamente
5. Emitir factura de prueba con importe bajo (ej: $100)
⚠️ **IMPORTANTE**: Las facturas en producción **SÍ son válidas ante AFIP** y no se pueden eliminar.
---
## 📊 Tipos de Facturas
El sistema elige automáticamente:
### Si sos Monotributista:
- Siempre emitís **Factura C**
- No se discrimina IVA
- Podés facturar a cualquier cliente
### Si sos Responsable Inscripto:
- **Factura A**: Si tu cliente es Responsable Inscripto (tiene CUIT)
  - Se discrimina IVA
  - Debés pedir el CUIT del cliente
- **Factura B**: Si tu cliente es consumidor final (DNI o sin documento)
  - No se discrimina IVA
  - Es la más común para ventas minoristas
---
## 📋 Ver y Gestionar Facturas
### Listado de Facturas
En **Facturas AFIP** verás:
- Tipo de factura (A, B o C)
- Número del comprobante (formato: 00001-00000123)
- CAE (código único de AFIP)
- Receptor
- Importe total
- Fecha
- Modo (TEST o PRODUCCIÓN)
### Filtros y Búsqueda
- Paginación automática (20 facturas por página)
- Podés navegar entre páginas con botones Anterior/Siguiente
### Descargar PDF
_(Funcionalidad planificada para próxima versión)_
---
## ❓ Preguntas Frecuentes
### ¿Cuánto cuesta el módulo?
Está incluido en los planes **Negocio** y **Profesional**. El Access Token de AfipSDK.com es gratuito.
### ¿Qué pasa si vence mi certificado?
Si usás certificado propio, debés renovarlo en AFIP y actualizar en **Configuración → Facturación AFIP**.
Si usás Access Token, AfipSDK renueva automáticamente todo por vos.
### ¿Puedo facturar en USD o EUR?
Por ahora solo Pesos Argentinos (ARS/PES). Otras monedas se agregarán en futuras versiones.
### ¿Cómo anulo una factura?
Deberás emitir una **Nota de Crédito** (funcionalidad planificada para próxima versión).
### ¿Se integra con el POS?
En esta versión es manual. La integración automática (cobrar → emitir factura) está planificada.
### ¿Qué pasa con mis facturas en modo TEST?
Quedan guardadas en tu sistema con marca "TEST" para tu control, pero no tienen validez fiscal.
---
## 🆘 Soporte
### Errores Comunes
**"Error al conectar con AFIP"**
- Verificá que el CUIT sea correcto
- Verificá que el Access Token esté bien copiado
- Verificá que el punto de venta esté habilitado en AFIP
**"Plan no incluye este módulo"**
- Upgradeá a plan Negocio o Profesional
**"CAE no devuelto"**
- Verificá que los importes sean correctos
- Verificá que el CUIT del receptor sea válido (si factura A)
### Contacto
Para soporte técnico: ayuda@kioskosydespenzas.com
---
**¡Listo! Ya podés empezar a facturar electrónicamente 🎉**
