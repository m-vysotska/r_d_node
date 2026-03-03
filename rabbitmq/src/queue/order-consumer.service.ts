import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import type amqp from 'amqplib';
import { RabbitMQService } from './rabbitmq.service';
import { OrderMessage } from './order-message.interface';
import { Order, OrderStatus } from '../entities/order.entity';
import { ProcessedMessage } from '../entities/processed-message.entity';

const HANDLER_NAME = 'order.process';

@Injectable()
export class OrderConsumerService implements OnModuleInit {
  private readonly logger = new Logger(OrderConsumerService.name);
  private readonly maxAttempts: number;

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly config: ConfigService,
    @InjectRepository(Order) _orderRepo: Repository<Order>,
    @InjectRepository(ProcessedMessage) _processedRepo: Repository<ProcessedMessage>,
    private readonly dataSource: DataSource,
  ) {
    this.maxAttempts = this.config.get<number>('queue.maxAttempts') ?? 3;
  }

  async onModuleInit() {
    const channel = this.rabbit.getChannel();
    const queue = this.rabbit.getProcessQueue();
    channel.prefetch(1);
    channel.consume(queue, (msg) => {
      if (!msg) return;
      this.handleMessage(msg).catch((err) => {
        this.logger.error(`Unhandled error processing message: ${err.message}`);
        channel.nack(msg, false, false);
      });
    });
  }

  private async handleMessage(msg: amqp.ConsumeMessage): Promise<void> {
    const channel = this.rabbit.getChannel();
    let payload: OrderMessage;
    try {
      payload = JSON.parse(msg.content.toString()) as OrderMessage;
    } catch {
      this.logger.warn({ messageId: 'unknown', orderId: 'unknown', attempt: 0, result: 'dlq', reason: 'invalid_json' });
      channel.sendToQueue(this.rabbit.getDlqQueue(), msg.content, { persistent: true });
      channel.ack(msg);
      return;
    }
    const { messageId, orderId, attempt } = payload;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.insert(ProcessedMessage, {
        messageId,
        processedAt: new Date(),
        orderId,
        handler: HANDLER_NAME,
      });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (err?.code === '23505') {
        this.logger.log({ messageId, orderId, attempt, result: 'idempotent_skip', reason: 'duplicate_message_id' });
        channel.ack(msg);
        return;
      }
      await this.handleFailure(msg, payload, err);
      return;
    }

    try {
      const order = await queryRunner.manager.findOne(Order, { where: { id: orderId } });
      if (!order) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        this.logger.warn({ messageId, orderId, attempt, result: 'dlq', reason: 'order_not_found' });
        channel.sendToQueue(this.rabbit.getDlqQueue(), msg.content, { persistent: true });
        channel.ack(msg);
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
      await queryRunner.manager.update(Order, { id: orderId }, {
        status: OrderStatus.PROCESSED,
        processedAt: new Date(),
      });
      await queryRunner.commitTransaction();
      this.logger.log({ messageId, orderId, attempt, result: 'success' });
      channel.ack(msg);
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      await this.handleFailure(msg, payload, err);
    } finally {
      await queryRunner.release();
    }
  }

  private async handleFailure(msg: amqp.ConsumeMessage, payload: OrderMessage, err: Error): Promise<void> {
    const channel = this.rabbit.getChannel();
    const nextAttempt = payload.attempt + 1;
    if (nextAttempt >= this.maxAttempts) {
      this.logger.warn({
        messageId: payload.messageId,
        orderId: payload.orderId,
        attempt: payload.attempt,
        result: 'dlq',
        reason: err.message,
      });
      channel.sendToQueue(this.rabbit.getDlqQueue(), msg.content, { persistent: true });
      channel.ack(msg);
      return;
    }
    this.logger.log({
      messageId: payload.messageId,
      orderId: payload.orderId,
      attempt: payload.attempt,
      result: 'retry',
      nextAttempt,
      reason: err.message,
    });
    const retryPayload: OrderMessage = { ...payload, attempt: nextAttempt };
    channel.sendToQueue(this.rabbit.getRetryQueue(), Buffer.from(JSON.stringify(retryPayload)), { persistent: true });
    channel.ack(msg);
  }
}
