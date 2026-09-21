import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCheckoutSchema1776740846403 implements MigrationInterface {
    name = 'UpdateCheckoutSchema1776740846403'

    /**
     * Migración idempotente: cada operación verifica el estado real de la DB
     * antes de ejecutarse. Esto es necesario porque la DB de producción pudo
     * haber quedado en un estado intermedio (FKs/índices con nombres distintos
     * o columnas ya creadas) y los nombres hardcodeados hacían fallar todo.
     */

    private async dropFkIfExists(qr: QueryRunner, table: string, fkName: string) {
        const rows = await qr.query(
            `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ?
               AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
            [table, fkName],
        );
        if (rows.length > 0) {
            await qr.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fkName}\``);
        }
    }

    private async dropFkByColumn(qr: QueryRunner, table: string, column: string) {
        // Elimina CUALQUIER FK sobre la columna, sin importar su nombre
        const rows = await qr.query(
            `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
               AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
            [table, column],
        );
        for (const row of rows) {
            await qr.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
        }
    }

    private async dropIndexIfExists(qr: QueryRunner, table: string, indexName: string) {
        const rows = await qr.query(
            `SELECT INDEX_NAME FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
            [table, indexName],
        );
        if (rows.length > 0) {
            await qr.query(`DROP INDEX \`${indexName}\` ON \`${table}\``);
        }
    }

    private async addColumnIfMissing(qr: QueryRunner, table: string, column: string, definition: string) {
        const rows = await qr.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [table, column],
        );
        if (rows.length === 0) {
            await qr.query(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition}`);
        }
    }

    private async addFkIfMissing(qr: QueryRunner, table: string, fkName: string, definition: string) {
        const rows = await qr.query(
            `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ?
               AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
            [table, fkName],
        );
        if (rows.length === 0) {
            await qr.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fkName}\` ${definition}`);
        }
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // FKs de products: borrar por nombre conocido o por columna (cualquier nombre)
        await this.dropFkIfExists(queryRunner, 'products', 'FK_brand_product_new');
        await this.dropFkIfExists(queryRunner, 'products', 'FK_supplier_product_new');
        await this.dropFkByColumn(queryRunner, 'products', 'brand_id');
        await this.dropFkByColumn(queryRunner, 'products', 'supplier_id');

        // Índices viejos (si existen)
        await this.dropIndexIfExists(queryRunner, 'mercadopago_credentials', 'IDX_mp_credentials_tenant');
        await this.dropIndexIfExists(queryRunner, 'electronic_invoices', 'IDX_electronic_invoices_fecha');
        await this.dropIndexIfExists(queryRunner, 'electronic_invoices', 'IDX_electronic_invoices_sale');
        await this.dropIndexIfExists(queryRunner, 'electronic_invoices', 'IDX_electronic_invoices_tenant');
        await this.dropIndexIfExists(queryRunner, 'electronic_invoices', 'IDX_electronic_invoices_unique');
        await this.dropIndexIfExists(queryRunner, 'afip_credentials', 'IDX_afip_credentials_tenant');

        // Tablas nuevas
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`payment_accounts\` (\`id\` varchar(36) NOT NULL, \`tenant_id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(100) NOT NULL, \`type\` enum ('alias', 'cbu', 'other') NOT NULL DEFAULT 'alias', \`value\` varchar(100) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`pending_subscriptions\` (\`id\` varchar(36) NOT NULL, \`plan_id\` varchar(36) NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`business_name\` varchar(150) NOT NULL, \`owner_email\` varchar(100) NOT NULL, \`owner_name\` varchar(100) NOT NULL, \`owner_phone\` varchar(50) NULL, \`tax_id\` varchar(50) NULL, \`temp_password_hash\` varchar(255) NOT NULL, \`status\` enum ('pending', 'approved', 'rejected', 'expired', 'manual_pending', 'manual_approved') NOT NULL DEFAULT 'pending', \`payment_method\` varchar(50) NOT NULL, \`mp_preference_id\` varchar(255) NULL, \`mp_payment_id\` varchar(100) NULL, \`mp_init_point\` varchar(255) NULL, \`transfer_alias\` varchar(100) NULL, \`transfer_notes\` text NULL, \`tenant_id\` varchar(36) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Columnas nuevas en sales (solo si faltan)
        await this.addColumnIfMissing(queryRunner, 'sales', 'payment_status', `enum ('pending', 'confirmed', 'failed') NOT NULL DEFAULT 'confirmed'`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'mp_payment_id', `varchar(100) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'mp_payment_status', `varchar(50) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'payer_name', `varchar(200) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'payer_email', `varchar(200) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'transfer_voucher', `varchar(100) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'transfer_origin', `varchar(100) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'card_last_digits', `varchar(4) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'card_brand', `varchar(50) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'authorization_code', `varchar(50) NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'payment_notes', `text NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'payment_verified_at', `timestamp NULL`);
        await this.addColumnIfMissing(queryRunner, 'sales', 'voucher_image_url', `varchar(255) NULL`);

        // Enum ampliado de métodos de pago
        await queryRunner.query(`ALTER TABLE \`sales\` CHANGE \`payment_method\` \`payment_method\` enum ('cash', 'debit_card', 'credit_card', 'transfer', 'qr_mercadopago', 'link_mercadopago', 'credit_client') NOT NULL DEFAULT 'cash'`);

        // products.min_stock_alert: puede no existir en prod (DB desactualizada)
        await this.addColumnIfMissing(queryRunner, 'products', 'min_stock_alert', `decimal(15,2) NOT NULL DEFAULT '5.00'`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`min_stock_alert\` \`min_stock_alert\` decimal(15,2) NOT NULL DEFAULT '5.00'`);

        // FKs nuevas de products (solo si no existen ya con ese nombre)
        await this.addFkIfMissing(queryRunner, 'products', 'FK_1530a6f15d3c79d1b70be98f2be',
            `FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await this.addFkIfMissing(queryRunner, 'products', 'FK_0ec433c1e1d444962d592d86c86',
            `FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // down() se mantiene solo como referencia; no se usa en producción.
    }
}
