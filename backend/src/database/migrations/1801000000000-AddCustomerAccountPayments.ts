import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persiste los abonos de clientes para que las cuentas corrientes puedan
 * reconstruir su historial sin depender únicamente del saldo acumulado.
 */
export class AddCustomerAccountPayments1801000000000 implements MigrationInterface {
  name = 'AddCustomerAccountPayments1801000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS customer_account_payments (
      id varchar(36) NOT NULL,
      tenant_id varchar(36) NOT NULL,
      created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      customer_id varchar(36) NOT NULL,
      amount decimal(15,2) NOT NULL,
      payment_method enum('cash','transfer','bank') NOT NULL DEFAULT 'cash',
      notes varchar(500) NULL,
      PRIMARY KEY (id),
      INDEX IDX_customer_account_payments_tenant_customer (tenant_id, customer_id)
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS customer_account_payments');
  }
}
