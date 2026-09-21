import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Fase 14 — Producción y Fraccionamiento.
 * - products.product_type: tipo de producto (standard | raw_material | fractionated | elaborated)
 * - recipes / recipe_items: recetas (cuánto insumo consume aprox. cada producto elaborado/fraccionado)
 * - production_orders / production_inputs / production_outputs: registro de producción real
 * Idempotente: segura de correr sobre DBs en estado intermedio.
 */
export class AddProductionModule1777700000000 implements MigrationInterface {
  name = 'AddProductionModule1777700000000';

  private async hasColumn(qr: QueryRunner, table: string, column: string): Promise<boolean> {
    const rows = await qr.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column],
    );
    return rows.length > 0;
  }

  private async hasTable(qr: QueryRunner, table: string): Promise<boolean> {
    const rows = await qr.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table],
    );
    return rows.length > 0;
  }

  private async hasFk(qr: QueryRunner, table: string, column: string): Promise<boolean> {
    const rows = await qr.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
         AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [table, column],
    );
    return rows.length > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Columna product_type en products
    if (!(await this.hasColumn(queryRunner, 'products', 'product_type'))) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'product_type',
          type: 'enum',
          enum: ['standard', 'raw_material', 'fractionated', 'elaborated'],
          default: "'standard'",
        }),
      );
    }

    // 1. Recetas (templates de producción)
    if (!(await this.hasTable(queryRunner, 'recipes'))) {
      await queryRunner.createTable(
        new Table({
          name: 'recipes',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid', default: '(UUID())' },
            { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'name', type: 'varchar', length: '150', isNullable: false },
            { name: 'type', type: 'enum', enum: ['fractioning', 'elaboration'], default: "'elaboration'" },
            { name: 'output_product_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'output_quantity', type: 'decimal', precision: 15, scale: 3, default: 1 },
            { name: 'notes', type: 'text', isNullable: true },
            { name: 'is_active', type: 'boolean', default: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );
    }

    // 2. Ítems de receta (insumos aproximados por tanda)
    if (!(await this.hasTable(queryRunner, 'recipe_items'))) {
      await queryRunner.createTable(
        new Table({
          name: 'recipe_items',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid', default: '(UUID())' },
            { name: 'recipe_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'product_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'quantity', type: 'decimal', precision: 15, scale: 3, isNullable: false },
          ],
        }),
        true,
      );
    }

    // 3. Órdenes de producción (fraccionamiento / elaboración real)
    if (!(await this.hasTable(queryRunner, 'production_orders'))) {
      await queryRunner.createTable(
        new Table({
          name: 'production_orders',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid', default: '(UUID())' },
            { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'branch_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'recipe_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'user_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'status', type: 'enum', enum: ['completed', 'cancelled'], default: "'completed'" },
            { name: 'total_input_cost', type: 'decimal', precision: 15, scale: 2, default: 0 },
            { name: 'notes', type: 'text', isNullable: true },
            { name: 'cancelled_at', type: 'timestamp', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );
    }

    // 4. Insumos consumidos por la orden
    if (!(await this.hasTable(queryRunner, 'production_inputs'))) {
      await queryRunner.createTable(
        new Table({
          name: 'production_inputs',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid', default: '(UUID())' },
            { name: 'production_order_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'product_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'quantity', type: 'decimal', precision: 15, scale: 3, isNullable: false },
            { name: 'unit_cost', type: 'decimal', precision: 15, scale: 2, default: 0 },
            { name: 'subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 },
          ],
        }),
        true,
      );
    }

    // 5. Productos obtenidos por la orden
    if (!(await this.hasTable(queryRunner, 'production_outputs'))) {
      await queryRunner.createTable(
        new Table({
          name: 'production_outputs',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid', default: '(UUID())' },
            { name: 'production_order_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'product_id', type: 'varchar', length: '36', isNullable: false },
            { name: 'quantity', type: 'decimal', precision: 15, scale: 3, isNullable: false },
            { name: 'unit_cost', type: 'decimal', precision: 15, scale: 2, default: 0 },
            { name: 'subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 },
          ],
        }),
        true,
      );
    }

    // FKs (solo si no existen ya sobre esa columna)
    if (!(await this.hasFk(queryRunner, 'recipe_items', 'recipe_id'))) {
      await queryRunner.createForeignKey(
        'recipe_items',
        new TableForeignKey({
          columnNames: ['recipe_id'],
          referencedTableName: 'recipes',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }
    if (!(await this.hasFk(queryRunner, 'production_inputs', 'production_order_id'))) {
      await queryRunner.createForeignKey(
        'production_inputs',
        new TableForeignKey({
          columnNames: ['production_order_id'],
          referencedTableName: 'production_orders',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }
    if (!(await this.hasFk(queryRunner, 'production_outputs', 'production_order_id'))) {
      await queryRunner.createForeignKey(
        'production_outputs',
        new TableForeignKey({
          columnNames: ['production_order_id'],
          referencedTableName: 'production_orders',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('production_outputs', true);
    await queryRunner.dropTable('production_inputs', true);
    await queryRunner.dropTable('production_orders', true);
    await queryRunner.dropTable('recipe_items', true);
    await queryRunner.dropTable('recipes', true);
    if (await this.hasColumn(queryRunner, 'products', 'product_type')) {
      await queryRunner.dropColumn('products', 'product_type');
    }
  }
}
