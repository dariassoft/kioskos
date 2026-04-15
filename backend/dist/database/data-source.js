"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.join)(__dirname, '../../../.env') });
exports.dataSourceOptions = {
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [(0, path_1.join)(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [(0, path_1.join)(__dirname, '/migrations/*{.ts,.js}')],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
};
const AppDataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
exports.default = AppDataSource;
//# sourceMappingURL=data-source.js.map