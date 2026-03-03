# RabbitMQ Orders

Order processing over a queue: the API accepts orders and returns right away; a worker processes them in the background with retries, a dead-letter queue, and idempotent handling.

## Run it

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:3000  
- RabbitMQ Management: http://localhost:15672 (guest/guest)

To run without Docker (you’ll need Postgres and RabbitMQ running):

```bash
npm install
npm run start:dev
```

## RabbitMQ setup

Three queues:

- **orders.process** — main queue. The worker reads from here and processes orders.
- **orders.retry** — retry queue. Messages sit here for 2 seconds (TTL), then go back to `orders.process` via dead-letter.
- **orders.dlq** — dead-letter queue. Messages that still fail after the max number of attempts end up here.

We only use the default exchange; everything is published straight to these queues by name.

Flow: API publishes to `orders.process` → worker consumes (manual ack) → on failure we republish to `orders.retry` with `attempt + 1` → after TTL it goes back to `orders.process` → after 3 failed attempts we send the message to `orders.dlq` and ack the original.

In the Management UI you should see all three queues. After creating an order, a message appears in `orders.process`; once the worker finishes, the queue goes back to 0 ready.

## Retries

On failure the worker doesn’t nack. It republishes the message to `orders.retry` with the attempt count incremented and acks the original. The retry queue has a 2s TTL and is configured to dead-letter back into `orders.process`. Max attempts is 3 (configurable via `QUEUE_MAX_ATTEMPTS`). After that, the message is published to `orders.dlq`.

## Idempotency

We store processed message IDs in a `processed_messages` table (`message_id` is unique). When the worker gets a message it starts a transaction, tries to insert the `messageId`. If it hits a duplicate key (Postgres 23505), it acks and skips — so the same message is never processed twice, even with multiple workers.

## How to try the scenarios

**Happy path** — create an order and watch it get processed:

```bash
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{}'
```

You get back `orderId` and `messageId`. In the worker logs you should see `result: 'success'`. In the DB the order moves from PENDING to PROCESSED with `processedAt` set.

**Retry** — make the worker throw for the first couple of attempts (e.g. add a condition in code). Create an order. Logs should show `result: 'retry'` and `nextAttempt` increasing, then eventually `result: 'success'`.

**DLQ** — set `QUEUE_MAX_ATTEMPTS=1` or make the worker always fail. Create an order. Logs show `result: 'dlq'` and the message appears in `orders.dlq` in the Management UI.

**Idempotency** — to see the skip in action you need the same message delivered twice. One way is to publish manually to `orders.process` with a payload that reuses an existing `messageId` from `processed_messages`. The worker should log `result: 'idempotent_skip'` and not change the order again.

## API

- **POST /orders** — creates an order in the DB with status PENDING, generates a messageId, publishes to `orders.process`, and returns immediately. No heavy work in the request.

## Worker logs

Log lines include `messageId`, `orderId`, `attempt`, and `result` (one of success, retry, dlq, idempotent_skip). On failure we also log `reason`.
