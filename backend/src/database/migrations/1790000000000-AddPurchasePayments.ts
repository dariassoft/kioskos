import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchasePayments1790000000000 implements MigrationInterface {
  name = 'AddPurchasePayments1790000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("CREATE TABLE `purchase_payments` (`id` varchar(36) NOT NULL, `tenant_id` varchar(36) NOT NULL, `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `purchase_order_id` varchar(36) NOT NULL, `supplier_id` varchar(36) NOT NULL, `amount` decimal(15,2) NOT NULL, `payment_method` enum ('cash','transfer','bank') NOT NULL, `notes` varchar(500) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
  }

  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query('DROP TABLE `purchase_payments`'); }
}