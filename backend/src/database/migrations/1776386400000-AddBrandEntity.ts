import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBrandEntity1776386400000 implements MigrationInterface {
    name = 'AddBrandEntity1776386400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear tabla brands
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`brands\` (
                \`id\` varchar(36) NOT NULL,
                \`tenant_id\` varchar(36) NOT NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`name\` varchar(150) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 2. Modificar tabla productos para añadir brand_id, supplier_id e image_url
        // Verificamos si las columnas existen antes de intentar agregarlas para evitar errores si synchronize=true intentó algo
        const columns = await queryRunner.query(`SHOW COLUMNS FROM \`products\``);
        const columnNames = columns.map((c: any) => c.Field);

        if (!columnNames.includes('brand_id')) {
            await queryRunner.query(`ALTER TABLE \`products\` ADD COLUMN \`brand_id\` varchar(36) NULL`);
        }
        if (!columnNames.includes('supplier_id')) {
            await queryRunner.query(`ALTER TABLE \`products\` ADD COLUMN \`supplier_id\` varchar(36) NULL`);
        }
        if (!columnNames.includes('image_url')) {
            await queryRunner.query(`ALTER TABLE \`products\` ADD COLUMN \`image_url\` varchar(255) NULL`);
        }

        // 3. Añadir relaciones
        // Nota: El nombre de la CONSTRAINT debe ser único
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_brand_product_new\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_supplier_product_new\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_supplier_product_new\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_brand_product_new\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`image_url\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`supplier_id\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`brand_id\``);
        await queryRunner.query(`DROP TABLE \`brands\``);
    }
}
