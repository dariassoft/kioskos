import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El SuperAdmin es una identidad de plataforma, no el dueño de un tenant.
 * Se conserva el tenant técnico histórico para compatibilidad, pero se
 * elimina la relación del usuario SuperAdmin con ese registro.
 */
export class SeparatePlatformSuperAdmin1802000000000 implements MigrationInterface {
  name = 'SeparatePlatformSuperAdmin1802000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` MODIFY `tenant_id` varchar(36) NULL');
    await queryRunner.query(
      "UPDATE `users` SET `tenant_id` = NULL, `branch_id` = NULL WHERE `role` = 'superadmin'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `users` SET `tenant_id` = '00000000-0000-0000-0000-000000000001' WHERE `role` = 'superadmin'",
    );
    await queryRunner.query('ALTER TABLE `users` MODIFY `tenant_id` varchar(36) NOT NULL');
  }
}