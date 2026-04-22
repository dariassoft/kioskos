import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class BillingRestructure1713740000000 implements MigrationInterface {
  name = 'BillingRestructure1713740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // 1. TABLA PROMOTIONS
    // ==========================================
    await queryRunner.createTable(
      new Table({
        name: 'promotions',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid', default: '(UUID())' },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'discount_type', type: 'enum', enum: ['percentage', 'fixed_price'], default: "'percentage'" },
          { name: 'discount_value', type: 'decimal', precision: 12, scale: 2, isNullable: false },
          { name: 'start_date', type: 'timestamp', isNullable: false },
          { name: 'end_date', type: 'timestamp', isNullable: false },
          { name: 'max_uses', type: 'int', isNullable: true },
          { name: 'current_uses', type: 'int', default: 0 },
          { name: 'promo_duration_months', type: 'int', default: 1 },
          { name: 'applies_to_plan_ids', type: 'json', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // ==========================================
    // 2. NUEVAS COLUMNAS EN SUBSCRIPTIONS
    // ==========================================
    const subsNewCols: TableColumn[] = [
      new TableColumn({ name: 'locked_price', type: 'decimal', precision: 12, scale: 2, isNullable: true }),
      new TableColumn({ name: 'locked_plan_name', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'billing_day', type: 'int', default: 10 }),
      new TableColumn({ name: 'status', type: 'enum', enum: ['active', 'cancelled', 'suspended', 'past_due'], default: "'active'" }),
      new TableColumn({ name: 'cancelled_at', type: 'timestamp', isNullable: true }),
      new TableColumn({ name: 'cancellation_reason', type: 'text', isNullable: true }),
      new TableColumn({ name: 'promotion_id', type: 'varchar', length: '36', isNullable: true }),
      new TableColumn({ name: 'price_after_promo', type: 'decimal', precision: 12, scale: 2, isNullable: true }),
      new TableColumn({ name: 'promo_ends_at', type: 'date', isNullable: true }),
      new TableColumn({ name: 'mp_preapproval_id', type: 'varchar', length: '255', isNullable: true }),
    ];

    for (const col of subsNewCols) {
      const exists = await queryRunner.hasColumn('subscriptions', col.name);
      if (!exists) await queryRunner.addColumn('subscriptions', col);
    }

    // ==========================================
    // 3. NUEVAS COLUMNAS EN BILLING_HISTORY
    // ==========================================
    const billNewCols: TableColumn[] = [
      new TableColumn({ name: 'plan_id', type: 'varchar', length: '36', isNullable: true }),
      new TableColumn({ name: 'plan_name', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'billing_period_start', type: 'date', isNullable: true }),
      new TableColumn({ name: 'billing_period_end', type: 'date', isNullable: true }),
      new TableColumn({ name: 'is_prorated', type: 'boolean', default: false }),
      new TableColumn({ name: 'promotion_id', type: 'varchar', length: '36', isNullable: true }),
    ];

    for (const col of billNewCols) {
      const exists = await queryRunner.hasColumn('billing_history', col.name);
      if (!exists) await queryRunner.addColumn('billing_history', col);
    }

    // ==========================================
    // 4. MIGRAR DATOS EXISTENTES: llenar locked_price
    // ==========================================
    await queryRunner.query(`
      UPDATE subscriptions s
      JOIN plans p ON s.plan_id = p.id
      SET s.locked_price = p.price_monthly,
          s.locked_plan_name = p.name,
          s.billing_day = 10
      WHERE s.locked_price IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const subsCols = ['locked_price', 'locked_plan_name', 'billing_day', 'status', 'cancelled_at', 'cancellation_reason', 'promotion_id', 'price_after_promo', 'promo_ends_at', 'mp_preapproval_id'];
    for (const col of subsCols) {
      const exists = await queryRunner.hasColumn('subscriptions', col);
      if (exists) await queryRunner.dropColumn('subscriptions', col);
    }

    const billCols = ['plan_id', 'plan_name', 'billing_period_start', 'billing_period_end', 'is_prorated', 'promotion_id'];
    for (const col of billCols) {
      const exists = await queryRunner.hasColumn('billing_history', col);
      if (exists) await queryRunner.dropColumn('billing_history', col);
    }

    await queryRunner.dropTable('promotions', true);
  }
}
