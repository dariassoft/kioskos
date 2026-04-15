# Reglas de Negocio Generales: Kioskos & Despenzas

## Principio Básico: API First y Multi-tenancy
- El proyecto es un modelo SaaS. Significa que siempre coexisten múltiples clientes. Todo código creado deberá pensar en la variable **"Aislamiento de Tenant"**.
- El `tenant_id` domina cada flujo. Cualquier fuga o filtración entre Tenants (`branch_id` no filtrado por `tenant_id`) es considerada una vulnerabilidad crítica (Severidad 1).

## Reglas de Agente (LLMs)
Al escribir o modificar código:
1. **Analiza si afecta permisos**: ¿A quién pertenece este dato?.
2. **Prioriza mantenibilidad**: Haz código aburrido y predecible. Predecible > Inteligente.
3. **Comenta el ¿por qué?, no el ¿qué?**: Si implementas un cálculo extraño o una corrección que solvente un bug específico, tu comentario debe ilustrar el motivo de negocio (ref: "Redondeo alfanumérico para soporte SAT").
4. **Responde usando sintaxis en español** cuando el código afecta la interfaz visual del cliente final (Textos, Labels, Alerts, ERRORES legibles).

## Tipado de Datos
- Usar `Typescript` de formás estricta (`strict: true`). Minimiza el uso agresivo del flag `any` o conversiones no supervisadas (`as Type`).
- Los contratos compartidos entre Microservicios o Capas (Front <=> Back) deben guiarse por interfaces claras en las carpetas respectivas (`/api/types.ts` en front, `DTOs` en backend).
