import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddExpensesModule1713736000000 implements MigrationInterface {
  name = 'AddExpensesModule1713736000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tabla de categorías de gastos
    await queryRunner.createTable(
      new Table({
        name: 'expense_categories',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid', default: '(UUID())' },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'color', type: 'varchar', length: '7', default: "'#6366f1'" },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 2. Tabla de gastos
    await queryRunner.createTable(
      new Table({
        name: 'expenses',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid', default: '(UUID())' },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'description', type: 'varchar', length: '255', isNullable: false },
          { name: 'amount', type: 'decimal', precision: 15, scale: 2, isNullable: false },
          { name: 'date', type: 'date', isNullable: false },
          { name: 'category_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'branch_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'payment_method', type: 'enum', enum: ['cash', 'card', 'transfer'], default: "'cash'" },
          { name: 'receipt_number', type: 'varchar', length: '100', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'receipt_image', type: 'longtext', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 3. FK: expenses.category_id → expense_categories.id
    await queryRunner.createForeignKey(
      'expenses',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedTableName: 'expense_categories',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('expenses');
    if (table) {
      const fk = table.foreignKeys.find((fk) => fk.columnNames.indexOf('category_id') !== -1);
      if (fk) await queryRunner.dropForeignKey('expenses', fk);
    }
    await queryRunner.dropTable('expenses', true);
    await queryRunner.dropTable('expense_categories', true);
  }
}
