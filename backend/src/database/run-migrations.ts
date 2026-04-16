/**
 * Script de ejecución de migraciones TypeORM para producción.
 * Se invoca desde el contenedor backend en el pipeline de CI/CD:
 *   docker compose exec backend node dist/database/run-migrations.js
 */
import AppDataSource from './data-source';

async function runMigrations() {
  console.log('🗄️  Conectando a la base de datos...');
  await AppDataSource.initialize();

  console.log('🔄 Ejecutando migraciones pendientes...');
  const migrations = await AppDataSource.runMigrations({ transaction: 'all' });

  if (migrations.length === 0) {
    console.log('✅ No hay migraciones pendientes.');
  } else {
    console.log(`✅ Se ejecutaron ${migrations.length} migración(es):`);
    migrations.forEach((m) => console.log(`   - ${m.name}`));
  }

  await AppDataSource.destroy();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('❌ Error al ejecutar migraciones:', err);
  process.exit(1);
});

