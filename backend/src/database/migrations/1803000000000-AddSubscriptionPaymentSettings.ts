import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionPaymentSettings1803000000000 implements MigrationInterface {
  name = 'AddSubscriptionPaymentSettings1803000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_subscriptions'
       AND COLUMN_NAME = 'transfer_voucher'`,
    );
    if (columns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`pending_subscriptions\` ADD \`transfer_voucher\` LONGTEXT NULL`,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pending_subscriptions'
       AND COLUMN_NAME = 'transfer_voucher'`,
    );
    if (columns.length > 0) {
      await queryRunner.query(`ALTER TABLE \`pending_subscriptions\` DROP COLUMN \`transfer_voucher\``);
    }
  }
}