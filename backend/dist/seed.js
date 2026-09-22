"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const tenant_service_1 = require("./tenants/tenant.service");
const auth_service_1 = require("./auth/auth.service");
const roles_decorator_1 = require("./common/decorators/roles.decorator");
const typeorm_1 = require("typeorm");
async function bootstrap() {
    console.log('🌱 Iniciando seeder para Kioskos & Despenzas...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const tenantService = app.get(tenant_service_1.TenantService);
    const authService = app.get(auth_service_1.AuthService);
    try {
        console.log('Creando Tenant principal...');
        let tenant = await tenantService.findAll().then(ts => ts.find(t => t.tax_id === '20-12345678-9'));
        if (!tenant) {
            const provisioned = await tenantService.create({
                business_name: 'Kiosko Demo Central',
                owner_email: 'demo@kioskos.com',
                owner_name: 'Dueño Demo',
                owner_password: 'password123',
                tax_id: '20-12345678-9',
                plan_id: 'plan-negocio-001',
            });
            tenant = provisioned.tenant;
        }
        console.log(`✅ Tenant Creado/Encontrado! ID: ${tenant.id}`);
        console.log('Creando unidades de medida base...');
        const dataSource = app.get(typeorm_1.DataSource);
        await dataSource.query(`
      INSERT IGNORE INTO units (id, tenant_id, name, abbreviation) VALUES 
      (UUID(), '${tenant.id}', 'Unidad', 'Un'),
      (UUID(), '${tenant.id}', 'Kilogramo', 'Kg'),
      (UUID(), '${tenant.id}', 'Litro', 'L')
    `);
        console.log(`✅ Unidades de medida listas!`);
        console.log('Creando Sucursal Principal...');
        await dataSource.query(`
      INSERT IGNORE INTO branches (id, tenant_id, name, address, is_main_branch) VALUES 
      (UUID(), '${tenant.id}', 'Casa Central', 'Av. Principal 123', true)
    `);
        console.log(`✅ Sucursal Principal lista!`);
        console.log('Creando usuario Dueño (Superadmin/Admin)...');
        try {
            const user = await authService.register({
                name: 'Dueño Administrador',
                email: 'demo@kioskos.com',
                password: 'password123',
            }, tenant.id, roles_decorator_1.UserRole.ADMIN, false);
            console.log(`✅ Usuario Creado!
        Email: demo@kioskos.com
        Contraseña: password123
        Tenant ID: ${tenant.id}
      `);
        }
        catch (e) {
            console.log('El usuario demo@kioskos.com ya existe o hubo error: ' + e.message);
        }
        console.log('🎉 Seeding completado exitosamente.');
    }
    catch (error) {
        console.error('❌ Error durante el seeding:', error.message);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=seed.js.map