# Homework 4: GraphQL для Orders + DataLoader

GraphQL API для Orders у курсовому e-commerce бекенді на NestJS з використанням DataLoader для оптимізації N+1 проблеми.

## Встановлення

```bash
npm install --legacy-peer-deps
```

## Налаштування

Створіть файл `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ecommerce
PORT=3000
```

## Запуск

```bash
npm run start:dev
```

GraphQL Playground доступний за адресою: `http://localhost:3000/graphql`

## Архітектура

### GraphQL Schema (Code-First)

Використано **code-first** підхід через декоратори NestJS GraphQL. Переваги:
- Type safety з TypeScript
- Автоматична генерація схеми з TypeScript класів
- Легше підтримувати синхронізацію між кодом та схемою
- Менше дублювання коду

### Структура проєкту

```
src/
├── entities/          # TypeORM entities
├── orders/
│   ├── dto/          # GraphQL Input types
│   ├── graphql/       # GraphQL Object types (models)
│   ├── orders.resolver.ts
│   ├── orders.service.ts
│   └── orders.module.ts
├── products/
│   ├── products.service.ts
│   └── products.module.ts
└── loaders/
    └── product.loader.ts  # DataLoader для Product
```

### GraphQL Types

#### Order
```graphql
type Order {
  id: ID!
  userId: ID!
  status: OrderStatus!
  total: Float!
  createdAt: DateTime!
  updatedAt: DateTime!
  items: [OrderItem!]!
}
```

#### OrderItem
```graphql
type OrderItem {
  id: ID!
  orderId: ID!
  productId: ID!
  quantity: Int!
  price: Float!
  createdAt: DateTime!
  product: Product!
}
```

#### Product
```graphql
type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  stock: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### OrderStatus Enum
```graphql
enum OrderStatus {
  pending
  confirmed
  cancelled
}
```

### Input Types

#### OrdersFilterInput
```graphql
input OrdersFilterInput {
  status: OrderStatus
  userId: String
  dateFrom: String
  dateTo: String
}
```

#### OrdersPaginationInput
```graphql
input OrdersPaginationInput {
  limit: Int
  offset: Int
}
```

### Resolvers

#### Orders Query

Резолвер `orders` використовує `OrdersService.findAll()` для отримання даних. Вся бізнес-логіка знаходиться в сервісі, резолвер лише викликає сервіс та обробляє GraphQL-специфічні параметри (filter, pagination).

```typescript
@Query(() => [OrderModel], { name: 'orders' })
async getOrders(
  @Args('filter', { nullable: true }) filter?: OrdersFilterInput,
  @Args('pagination', { nullable: true }) pagination?: OrdersPaginationInput,
): Promise<Order[]>
```

### DataLoader

#### Проблема N+1

Без DataLoader, при запиті:
```graphql
query {
  orders {
    id
    items {
      product {
        id
        name
      }
    }
  }
}
```

Для кожного `OrderItem` виконується окремий SQL-запит до `products`:
```
SELECT * FROM orders ...
SELECT * FROM products WHERE id = 'product-1'
SELECT * FROM products WHERE id = 'product-2'
SELECT * FROM products WHERE id = 'product-3'
...
```

#### Рішення з DataLoader

`ProductLoader` використовує DataLoader для батчингу запитів:

```typescript
@Injectable({ scope: Scope.REQUEST })
export class ProductLoader {
  private readonly loader: DataLoader<string, Product>;

  constructor(private readonly productsService: ProductsService) {
    this.loader = new DataLoader<string, Product>(
      async (productIds: readonly string[]) => {
        const products = await this.productsService.findByIds([...productIds]);
        const productMap = new Map(products.map(p => [p.id, p]));
        return productIds.map(id => productMap.get(id) || null);
      },
    );
  }

  load(id: string): Promise<Product> {
    return this.loader.load(id);
  }
}
```

Тепер всі `productId` збираються в один батч і виконується один запит:
```
SELECT * FROM orders ...
SELECT * FROM products WHERE id IN ('product-1', 'product-2', 'product-3', ...)
```

#### Доказ оптимізації

**До DataLoader:**
- 1 запит для orders
- N запитів для products (де N = кількість унікальних productId)
- Загалом: 1 + N запитів

**Після DataLoader:**
- 1 запит для orders
- 1 запит для products (WHERE id IN (...))
- Загалом: 2 запити

**Приклад:**
Для 10 orders з 3 items кожен (30 items, 10 унікальних products):
- До: 1 + 10 = 11 запитів
- Після: 1 + 1 = 2 запити

### Error Handling

- Некоректні фільтри: GraphQL validation error
- "Нічого не знайдено": порожній список `[]`
- Помилки БД: стандартні GraphQL errors з логуванням

## Приклад GraphQL Query

```graphql
query GetOrders($filter: OrdersFilterInput, $pagination: OrdersPaginationInput) {
  orders(filter: $filter, pagination: $pagination) {
    id
    status
    total
    createdAt
    items {
      id
      quantity
      price
      product {
        id
        name
        price
        stock
      }
    }
  }
}
```

**Variables:**
```json
{
  "filter": {
    "status": "confirmed",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31"
  },
  "pagination": {
    "limit": 10,
    "offset": 0
  }
}
```

## Перевірка N+1

Для перевірки, що N+1 прибрано:

1. Увімкніть SQL логування в `app.module.ts`:
   ```typescript
   logging: true,
   ```

2. Виконайте запит з кількома orders та items

3. Перевірте логи - має бути лише 2 SQL-запити (orders + products batch)

## Технології

- NestJS 11
- GraphQL (Apollo Server)
- TypeORM
- PostgreSQL
- DataLoader
