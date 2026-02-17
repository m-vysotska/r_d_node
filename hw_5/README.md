# Homework 5: Transactional and SQL Optimization

E-commerce backend with transactional order creation, idempotency, and SQL optimization.

## Setup

1. Install dependencies: `npm install --legacy-peer-deps`
   (Note: `--legacy-peer-deps` is needed because `@nestjs/typeorm@10.x` doesn't officially support NestJS 11, but they are compatible)
2. Configure `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=ecommerce
   PORT=3000
   ```
3. Enable UUID extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
4. Run migrations: `npm run migration:run`
5. Start: `npm run start:dev`

## Features

### Transactional Order Creation
- Uses TypeORM `QueryRunner` for atomic operations
- No partial writes - all operations in single transaction
- Automatic rollback on errors

### Idempotency
- `idempotencyKey` in body or `Idempotency-Key` header
- Stored with UNIQUE constraint
- Duplicate key returns existing order

### Oversell Protection
- Pessimistic locking with `FOR UPDATE`
- Locks products before stock validation
- Prevents concurrent stock depletion

### SQL Optimization
- Composite indexes on `(status, createdAt)` and `(userId, status)`
- ~5x performance improvement
- See `src/orders/sql-optimization.md` for details

## API

**POST /orders** - Create order (requires idempotencyKey)
**GET /orders** - List orders (filters: status, userId, startDate, endDate)
**GET /orders/:id** - Get order by ID

**GET /products** - List products
**GET /users** - List users

## Implementation Details

### Transaction Implementation
- Uses TypeORM `QueryRunner` for transaction management
- All operations (order creation, items creation, stock updates) in single transaction
- `try/catch/finally` ensures rollback on errors and resource cleanup
- `queryRunner.commitTransaction()` only called after all operations succeed
- `queryRunner.rollbackTransaction()` on any error

### Concurrency Control
- **Mechanism**: Pessimistic locking with `FOR UPDATE`
- Products are locked using `.setLock('pessimistic_write')` before stock validation
- Prevents concurrent stock depletion - first transaction locks, others wait
- Chosen over optimistic locking for simplicity and guaranteed consistency

### Idempotency
- Check for existing order with same `idempotencyKey` before starting transaction
- `idempotencyKey` stored in `orders.idempotencyKey` with UNIQUE constraint
- If key exists, returns existing order (200/201)
- If key is new, creates new order
- Supports both body parameter and `Idempotency-Key` header

### SQL Optimization
- **Query optimized**: `findAll` method with filters (status, userId, date range)
  ```sql
  SELECT order.*, items.*, product.*
  FROM orders order
  LEFT JOIN order_items items ON items.orderId = order.id
  LEFT JOIN products product ON product.id = items.productId
  WHERE order.status = $1 AND order.userId = $2
    AND order.createdAt >= $3 AND order.createdAt <= $4
  ORDER BY order.createdAt DESC;
  ```
- **Indexes added**:
  - `IDX_ORDERS_STATUS_CREATED_AT` on `(status, createdAt)`
  - `IDX_ORDERS_USER_STATUS` on `(userId, status)`
- **Result**: ~46ms → ~9ms (5x faster)
- See `src/orders/sql-optimization.md` for detailed EXPLAIN ANALYZE results
