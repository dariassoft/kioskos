import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCheckoutSchema1776740846403 implements MigrationInterface {
    name = 'UpdateCheckoutSchema1776740846403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_brand_product_new\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_supplier_product_new\``);
        await queryRunner.query(`DROP INDEX \`IDX_mp_credentials_tenant\` ON \`mercadopago_credentials\``);
        await queryRunner.query(`DROP INDEX \`IDX_electronic_invoices_fecha\` ON \`electronic_invoices\``);
        await queryRunner.query(`DROP INDEX \`IDX_electronic_invoices_sale\` ON \`electronic_invoices\``);
        await queryRunner.query(`DROP INDEX \`IDX_electronic_invoices_tenant\` ON \`electronic_invoices\``);
        await queryRunner.query(`DROP INDEX \`IDX_electronic_invoices_unique\` ON \`electronic_invoices\``);
        await queryRunner.query(`DROP INDEX \`IDX_afip_credentials_tenant\` ON \`afip_credentials\``);
        await queryRunner.query(`CREATE TABLE \`payment_accounts\` (\`id\` varchar(36) NOT NULL, \`tenant_id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(100) NOT NULL, \`type\` enum ('alias', 'cbu', 'other') NOT NULL DEFAULT 'alias', \`value\` varchar(100) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pending_subscriptions\` (\`id\` varchar(36) NOT NULL, \`plan_id\` varchar(36) NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`business_name\` varchar(150) NOT NULL, \`owner_email\` varchar(100) NOT NULL, \`owner_name\` varchar(100) NOT NULL, \`owner_phone\` varchar(50) NULL, \`tax_id\` varchar(50) NULL, \`temp_password_hash\` varchar(255) NOT NULL, \`status\` enum ('pending', 'approved', 'rejected', 'expired', 'manual_pending', 'manual_approved') NOT NULL DEFAULT 'pending', \`payment_method\` varchar(50) NOT NULL, \`mp_preference_id\` varchar(255) NULL, \`mp_payment_id\` varchar(100) NULL, \`mp_init_point\` varchar(255) NULL, \`transfer_alias\` varchar(100) NULL, \`transfer_notes\` text NULL, \`tenant_id\` varchar(36) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`payment_status\` enum ('pending', 'confirmed', 'failed') NOT NULL DEFAULT 'confirmed'`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`mp_payment_id\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`mp_payment_status\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`payer_name\` varchar(200) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`payer_email\` varchar(200) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`transfer_voucher\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`transfer_origin\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`card_last_digits\` varchar(4) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`card_brand\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`authorization_code\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`payment_notes\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`payment_verified_at\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD \`voucher_image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`sales\` CHANGE \`payment_method\` \`payment_method\` enum ('cash', 'debit_card', 'credit_card', 'transfer', 'qr_mercadopago', 'link_mercadopago', 'credit_client') NOT NULL DEFAULT 'cash'`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`min_stock_alert\` \`min_stock_alert\` decimal(15,2) NOT NULL DEFAULT '5.00'`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_1530a6f15d3c79d1b70be98f2be\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_0ec433c1e1d444962d592d86c86\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_0ec433c1e1d444962d592d86c86\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_1530a6f15d3c79d1b70be98f2be\``);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`min_stock_alert\` \`min_stock_alert\` decimal(15,2) NULL DEFAULT '5.00'`);
        await queryRunner.query(`ALTER TABLE \`sales\` CHANGE \`payment_method\` \`payment_method\` enum ('cash', 'card', 'transfer', 'credit_client') NOT NULL DEFAULT 'cash'`);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`voucher_image_url\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`payment_verified_at\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`payment_notes\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`authorization_code\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`card_brand\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`card_last_digits\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`transfer_origin\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`transfer_voucher\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`payer_email\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`payer_name\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`mp_payment_status\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`mp_payment_id\``);
        await queryRunner.query(`ALTER TABLE \`sales\` DROP COLUMN \`payment_status\``);
        await queryRunner.query(`DROP TABLE \`pending_subscriptions\``);
        await queryRunner.query(`DROP TABLE \`payment_accounts\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_afip_credentials_tenant\` ON \`afip_credentials\` (\`tenant_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_electronic_invoices_unique\` ON \`electronic_invoices\` (\`tenant_id\`, \`punto_de_venta\`, \`tipo_comprobante\`, \`numero_comprobante\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_electronic_invoices_tenant\` ON \`electronic_invoices\` (\`tenant_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_electronic_invoices_sale\` ON \`electronic_invoices\` (\`sale_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_electronic_invoices_fecha\` ON \`electronic_invoices\` (\`fecha_comprobante\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_mp_credentials_tenant\` ON \`mercadopago_credentials\` (\`tenant_id\`)`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_supplier_product_new\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_brand_product_new\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
