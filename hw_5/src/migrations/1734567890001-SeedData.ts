import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedData1734567890001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO users (id, email, name, "createdAt", "updatedAt") VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'user1@example.com', 'John Doe', NOW(), NOW()),
      ('550e8400-e29b-41d4-a716-446655440001', 'user2@example.com', 'Jane Smith', NOW(), NOW()),
      ('550e8400-e29b-41d4-a716-446655440002', 'user3@example.com', 'Bob Johnson', NOW(), NOW());
    `);

    await queryRunner.query(`
      INSERT INTO products (id, name, description, price, stock, "createdAt", "updatedAt") VALUES
      ('660e8400-e29b-41d4-a716-446655440000', 'Laptop', 'High-performance laptop', 999.99, 10, NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440001', 'Mouse', 'Wireless mouse', 29.99, 50, NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440002', 'Keyboard', 'Mechanical keyboard', 79.99, 30, NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440003', 'Monitor', '27-inch 4K monitor', 399.99, 15, NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440004', 'Headphones', 'Noise-cancelling headphones', 199.99, 25, NOW(), NOW());
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM products`);
    await queryRunner.query(`DELETE FROM users`);
  }
}
