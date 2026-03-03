import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

const PROCESS_QUEUE = 'orders.process';
const DLQ_QUEUE = 'orders.dlq';
const RETRY_QUEUE = 'orders.retry';
const RETRY_DELAY_MS = 2000;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private conn!: amqp.ChannelModel;
  private channel!: amqp.Channel;
  private processQueue = PROCESS_QUEUE;
  private dlqQueue = DLQ_QUEUE;
  private retryQueue = RETRY_QUEUE;
  private retryDelayMs = RETRY_DELAY_MS;

  constructor(private config: ConfigService) {
    const q = this.config.get('queue');
    if (q?.processQueue) this.processQueue = q.processQueue;
    if (q?.dlq) this.dlqQueue = q.dlq;
    if (q?.retryDelayMs) this.retryDelayMs = q.retryDelayMs;
  }

  async onModuleInit() {
    const url = this.config.get<string>('rabbitmq.url') || 'amqp://guest:guest@localhost:5672';
    this.conn = await amqp.connect(url);
    this.channel = await this.conn.createChannel();
    await this.channel.assertQueue(this.processQueue, { durable: true });
    await this.channel.assertQueue(this.dlqQueue, { durable: true });
    await this.channel.assertQueue(this.retryQueue, {
      durable: true,
      messageTtl: this.retryDelayMs,
      deadLetterExchange: '',
      deadLetterRoutingKey: this.processQueue,
    });
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close().catch(() => {});
    if (this.conn) await this.conn.close().catch(() => {});
  }

  getChannel(): amqp.Channel {
    return this.channel;
  }

  getProcessQueue(): string {
    return this.processQueue;
  }

  getDlqQueue(): string {
    return this.dlqQueue;
  }

  getRetryQueue(): string {
    return this.retryQueue;
  }
}
