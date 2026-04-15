/**
 * SEED SCRIPT — Kioskos & Despenzas
 *
 * ⚠️  CÓMO EJECUTAR:
 *   El seed no puede usar NestFactory directamente dentro de Docker porque
 *   los procesos lanzados con `docker exec` no heredan el DNS de la red Docker.
 *
 *   MÉTODO RECOMENDADO (directo a MySQL):
 *   docker cp backend/src/database/seed.sql kioskos_mysql:/tmp/seed.sql
 *   docker exec kioskos_mysql sh -c "mysql -u dev_user -pdev_password kioskos_db < /tmp/seed.sql"
 *
 *   Este archivo queda como referencia de la lógica de seed con TypeORM.
 *   Usar seed.sql para ejecución real en Docker.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TenantService } from './tenants/tenant.service';
import { AuthService } from './auth/auth.service';
import { UserRole } from './common/decorators/roles.decorator';
import { DataSource } from 'typeorm';

async function bootstrap() {
  console.log('🌱 Iniciando seeder para Kioskos & Despenzas...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const tenantService = app.get(TenantService);
  const authService = app.get(AuthService);
  
  try {
    // 1. Crear el Tenant
    console.log('Creando Tenant principal...');
    let tenant = await tenantService.findAll().then(ts => ts.find(t => t.tax_id === '20-12345678-9'));
    if (!tenant) {
      tenant = await tenantService.create({
        business_name: 'Kiosko Demo Central',
        owner_email: 'demo@kioskos.com',
        tax_id: '20-12345678-9',
      });
    }

    console.log(`✅ Tenant Creado/Encontrado! ID: ${tenant.id}`);

    // 1.5 Crear Unidades de Medida Básicas
    console.log('Creando unidades de medida base...');
    // TypeORM entities are normally managed by repository, but since we are using services
    // if there is a unit service we could use it, but since this script is simple, let's just 
    // insert them directly bypassing the service if it doesn't exist, or actually we can just
    // run a raw query using the DataSource.
    const dataSource = app.get(DataSource);
    await dataSource.query(`
      INSERT IGNORE INTO units (id, tenant_id, name, abbreviation) VALUES 
      (UUID(), '${tenant.id}', 'Unidad', 'Un'),
      (UUID(), '${tenant.id}', 'Kilogramo', 'Kg'),
      (UUID(), '${tenant.id}', 'Litro', 'L')
    `);
    console.log(`✅ Unidades de medida listas!`);

    // 1.8 Crear Sucursal Principal
    console.log('Creando Sucursal Principal...');
    await dataSource.query(`
      INSERT IGNORE INTO branches (id, tenant_id, name, address, is_main_branch) VALUES 
      (UUID(), '${tenant.id}', 'Casa Central', 'Av. Principal 123', true)
    `);
    console.log(`✅ Sucursal Principal lista!`);

    // 2. Crear el Usuario SuperAdmin
    console.log('Creando usuario Dueño (Superadmin/Admin)...');
    try {
      const user = await authService.register({
        name: 'Dueño Administrador',
        email: 'demo@kioskos.com',
        password: 'password123',
        role: UserRole.ADMIN,
      }, tenant.id);
      console.log(`✅ Usuario Creado!
        Email: demo@kioskos.com
        Contraseña: password123
        Tenant ID: ${tenant.id}
      `);
    } catch (e) {
      console.log('El usuario demo@kioskos.com ya existe o hubo error: ' + e.message);
    }

    console.log('🎉 Seeding completado exitosamente.');
  } catch (error) {
    console.error('❌ Error durante el seeding:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();
