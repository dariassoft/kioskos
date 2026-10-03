import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckoutAutoRenew1804000000000 implements MigrationInterface {
  name = 'AddCheckoutAutoRenew1804000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_subscriptions'
       AND COLUMN_NAME = 'auto_renew'`,
    );
    if (columns.length === 0) {
      await queryRunner.query(
        'ALTER TABLE `pending_subscriptions` ADD `auto_renew` TINYINT(1) NOT NULL DEFAULT 0',
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_subscriptions'
       AND COLUMN_NAME = 'auto_renew'`,
    );
    if (columns.length > 0) {
      await queryRunner.query('ALTER TABLE `pending_subscriptions` DROP COLUMN `auto_renew`');
    }
  }
}