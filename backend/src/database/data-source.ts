import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Asegurarse de que dotenv cargue las variables antes de inicializar DataSource,
// útil cuando se corre el TypeORM CLI externamente.
config({ path: join(__dirname, '../../../.env') });

export const dataSourceOptions: DataSourceOptions = {
  type: (process.env.DB_TYPE as any) || 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
  synchronize: false, // ¡ESTRICTAMENTE FALSE para Producción! Usamos migraciones.
  logging: process.env.DB_LOGGING === 'true',
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
