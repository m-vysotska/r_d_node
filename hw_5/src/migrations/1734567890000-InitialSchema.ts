import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1734567890000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'stock',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'idempotencyKey',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'orderId',
            type: 'uuid',
          },
          {
            name: 'productId',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDERS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDERS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDERS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'IDX_ORDER_ITEMS_ORDER_ID',
        columnNames: ['orderId'],
      }),
    );

    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'IDX_ORDER_ITEMS_PRODUCT_ID',
        columnNames: ['productId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_items');
    await queryRunner.dropTable('orders');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('users');
  }
}
