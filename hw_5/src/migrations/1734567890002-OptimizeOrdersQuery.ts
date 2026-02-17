import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class OptimizeOrdersQuery1734567890002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDERS_STATUS_CREATED_AT',
        columnNames: ['status', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDERS_USER_STATUS',
        columnNames: ['userId', 'status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('orders', 'IDX_ORDERS_USER_STATUS');
    await queryRunner.dropIndex('orders', 'IDX_ORDERS_STATUS_CREATED_AT');
  }
}
