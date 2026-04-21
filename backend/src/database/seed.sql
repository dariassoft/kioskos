-- ============================================
-- SEED: Kioskos & Despenzas — Datos iniciales
-- ============================================

-- 1. Tenant SISTEMA (para el SuperAdmin de la plataforma)
INSERT INTO tenants (id, business_name, owner_email, tax_id, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Kioskos & Despenzas SISTEMA', 'superadmin@kioskos.com', '00-00000000-0', 'active')
ON DUPLICATE KEY UPDATE id=id;

-- 2. Usuario SUPERADMIN (dueño de la plataforma) — password: password123
INSERT INTO users (id, tenant_id, name, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Super Administrador',
  'superadmin@kioskos.com',
  '$2b$12$qvgXdS1kxeJcygM0dN44nOcgoD.HwSi7T8CASaROv1F4aZH74a/Km',
  'superadmin',
  1
) ON DUPLICATE KEY UPDATE id=id;

-- 3. Tenant DEMO (kiosko de prueba)
INSERT INTO tenants (id, business_name, owner_email, tax_id, status)
VALUES ('10000000-0000-0000-0000-000000000001', 'Kiosko Demo Central', 'demo@kioskos.com', '20-12345678-9', 'active')
ON DUPLICATE KEY UPDATE id=id;

-- 4. Usuario ADMIN del Kiosko Demo — password: password123
INSERT INTO users (id, tenant_id, name, email, password_hash, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000001',
  'Dueno Demo',
  'demo@kioskos.com',
  '$2b$12$qvgXdS1kxeJcygM0dN44nOcgoD.HwSi7T8CASaROv1F4aZH74a/Km',
  'admin',
  1
) ON DUPLICATE KEY UPDATE id=id;

-- 5. Sucursal Principal del Kiosko Demo
INSERT INTO branches (id, tenant_id, name, address, is_main_branch)
VALUES ('10000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000001', 'Casa Central', 'Av. Principal 123', 1)
ON DUPLICATE KEY UPDATE id=id;

-- 6. Unidades de Medida para el Kiosko Demo
INSERT INTO units (id, tenant_id, name, abbreviation)
VALUES
  ('10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000001', 'Unidad', 'Un'),
  ('10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001', 'Kilogramo', 'Kg'),
  ('10000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000001', 'Litro', 'L')
ON DUPLICATE KEY UPDATE id=id;

-- 7. Lista de Precios por defecto
INSERT INTO price_lists (id, tenant_id, name, is_default)
VALUES ('10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000001', 'Minorista', 1)
ON DUPLICATE KEY UPDATE id=id;

-- 8. Categorias base para el Kiosko Demo
INSERT INTO categories (id, tenant_id, name, color, icon)
VALUES
  ('10000000-0000-0000-0000-000000000050', '10000000-0000-0000-0000-000000000001', 'Bebidas', '#3B82F6', ''),
  ('10000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000001', 'Snacks', '#F59E0B', ''),
  ('10000000-0000-0000-0000-000000000052', '10000000-0000-0000-0000-000000000001', 'Lacteos', '#10B981', ''),
  ('10000000-0000-0000-0000-000000000053', '10000000-0000-0000-0000-000000000001', 'Limpieza', '#8B5CF6', '')
ON DUPLICATE KEY UPDATE id=id;

-- 9. Planes de suscripcion
INSERT INTO plans (id, name, description, price_monthly, max_branches, max_users, features, is_active)
VALUES
  ('plan-emprendedor-001', 'Emprendedor', 'Plan basico para arrancar', 0.00, 1, 1, '{"automated_accounting":false,"multi_branch":false,"reports_bi":false,"export_pdf_excel":false,"email_notifications":false,"electronic_invoicing":false}', 1),
  ('plan-negocio-001', 'Negocio', 'Para comercios en crecimiento', 4999.00, 1, 3, '{"automated_accounting":true,"multi_branch":false,"reports_bi":true,"export_pdf_excel":true,"email_notifications":false,"electronic_invoicing":true}', 1),
  ('plan-profesional-001', 'Profesional', 'Para cadenas y profesionales', 9999.00, 5, 99, '{"automated_accounting":true,"multi_branch":true,"reports_bi":true,"export_pdf_excel":true,"email_notifications":true,"electronic_invoicing":true}', 1)
ON DUPLICATE KEY UPDATE id=id;

-- 10. Suscripcion del Demo al plan Negocio
INSERT INTO subscriptions (id, tenant_id, plan_id, start_date, end_date, auto_renew)
VALUES ('10000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-000000000001', 'plan-negocio-001', '2026-01-01', '2026-12-31', 1)
ON DUPLICATE KEY UPDATE id=id;

SELECT 'Seed completado exitosamente' AS resultado;
SELECT email, role FROM users;
SELECT business_name, status FROM tenants;

