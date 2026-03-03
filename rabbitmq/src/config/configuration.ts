export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'orders',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  },
  queue: {
    processQueue: process.env.QUEUE_ORDERS_PROCESS || 'orders.process',
    dlq: process.env.QUEUE_ORDERS_DLQ || 'orders.dlq',
    maxAttempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3', 10),
    retryDelayMs: parseInt(process.env.QUEUE_RETRY_DELAY_MS || '2000', 10),
  },
});
