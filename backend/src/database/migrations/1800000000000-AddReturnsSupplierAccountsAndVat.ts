import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Devoluciones, anulaciones, cuentas corrientes de proveedores y desglose de IVA.
 * Las columnas nuevas conservan los registros históricos: las líneas existentes
 * quedan con IVA 0 para no alterar retrospectivamente importes ya contabilizados.
 */
export class AddReturnsSupplierAccountsAndVat1800000000000 implements MigrationInterface {
  name = 'AddReturnsSupplierAccountsAndVat1800000000000';

  private async hasColumn(qr: QueryRunner, table: string, column: string): Promise<boolean> {
    const rows = await qr.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [table, column],
    );
    return rows.length > 0;
  }

  private async addColumn(qr: QueryRunner, table: string, column: string, definition: string): Promise<void> {
    if (!(await this.hasColumn(qr, table, column))) {
      await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumn(queryRunner, 'products', 'vat_rate', "decimal(5,2) NOT NULL DEFAULT '21.00'");
    await this.addColumn(queryRunner, 'purchase_order_items', 'vat_rate', "decimal(5,2) NOT NULL DEFAULT '0.00'");
    await this.addColumn(queryRunner, 'purchase_order_items', 'net_subtotal', "decimal(15,2) NOT NULL DEFAULT '0.00'");
    await this.addColumn(queryRunner, 'purchase_order_items', 'vat_amount', "decimal(15,2) NOT NULL DEFAULT '0.00'");
    await this.addColumn(queryRunner, 'sale_items', 'vat_rate', "decimal(5,2) NOT NULL DEFAULT '0.00'");
    await this.addColumn(queryRunner, 'sale_items', 'net_subtotal', "decimal(15,2) NOT NULL DEFAULT '0.00'");
    await this.addColumn(queryRunner, 'sale_items', 'vat_amount', "decimal(15,2) NOT NULL DEFAULT '0.00'");
    await this.addColumn(queryRunner, 'suppliers', 'current_account_enabled', 'tinyint NOT NULL DEFAULT 0');
    await this.addColumn(queryRunner, 'suppliers', 'opening_balance', "decimal(15,2) NOT NULL DEFAULT '0.00'");
    await this.addColumn(queryRunner, 'expenses', 'status', "enum('active','voided') NOT NULL DEFAULT 'active'");
    await this.addColumn(queryRunner, 'expenses', 'void_reason', 'varchar(500) NULL');
    await this.addColumn(queryRunner, 'expenses', 'voided_at', 'timestamp NULL');

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS purchase_returns (
      id varchar(36) NOT NULL,
      tenant_id varchar(36) NOT NULL,
      created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      purchase_order_id varchar(36) NOT NULL,
      supplier_id varchar(36) NOT NULL,
      branch_id varchar(36) NOT NULL,
      total decimal(15,2) NOT NULL,
      net_amount decimal(15,2) NOT NULL DEFAULT 0.00,
      vat_amount decimal(15,2) NOT NULL DEFAULT 0.00,
      reason varchar(500) NOT NULL,
      settlement_method enum('credit_note','cash_refund','bank_refund') NOT NULL DEFAULT 'credit_note',
      refund_amount decimal(15,2) NOT NULL DEFAULT 0.00,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS purchase_return_items (
      id varchar(36) NOT NULL,
      tenant_id varchar(36) NOT NULL,
      created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      purchase_return_id varchar(36) NOT NULL,
      product_id varchar(36) NOT NULL,
      quantity decimal(15,3) NOT NULL,
      unit_cost decimal(15,2) NOT NULL,
      vat_rate decimal(5,2) NOT NULL DEFAULT 0.00,
      net_subtotal decimal(15,2) NOT NULL DEFAULT 0.00,
      vat_amount decimal(15,2) NOT NULL DEFAULT 0.00,
      subtotal decimal(15,2) NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS sale_returns (
      id varchar(36) NOT NULL,
      tenant_id varchar(36) NOT NULL,
      created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      sale_id varchar(36) NOT NULL,
      branch_id varchar(36) NOT NULL,
      total decimal(15,2) NOT NULL,
      net_amount decimal(15,2) NOT NULL DEFAULT 0.00,
      vat_amount decimal(15,2) NOT NULL DEFAULT 0.00,
      reason varchar(500) NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS sale_return_items (
      id varchar(36) NOT NULL,
      tenant_id varchar(36) NOT NULL,
      created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      sale_return_id varchar(36) NOT NULL,
      product_id varchar(36) NOT NULL,
      quantity decimal(15,3) NOT NULL,
      unit_price decimal(15,2) NOT NULL,
      vat_rate decimal(5,2) NOT NULL DEFAULT 0.00,
      net_subtotal decimal(15,2) NOT NULL DEFAULT 0.00,
      vat_amount decimal(15,2) NOT NULL DEFAULT 0.00,
      subtotal decimal(15,2) NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS sale_return_items');
    await queryRunner.query('DROP TABLE IF EXISTS sale_returns');
    await queryRunner.query('DROP TABLE IF EXISTS purchase_return_items');
    await queryRunner.query('DROP TABLE IF EXISTS purchase_returns');
    for (const [table, column] of [
      ['expenses', 'voided_at'], ['expenses', 'void_reason'], ['expenses', 'status'],
      ['suppliers', 'opening_balance'], ['suppliers', 'current_account_enabled'],
      ['sale_items', 'vat_amount'], ['sale_items', 'net_subtotal'], ['sale_items', 'vat_rate'],
      ['purchase_order_items', 'vat_amount'], ['purchase_order_items', 'net_subtotal'], ['purchase_order_items', 'vat_rate'],
      ['products', 'vat_rate'],
    ]) {
      if (await this.hasColumn(queryRunner, table, column)) await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
    }
  }
}
