import { Injectable } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OrderMessage } from './order-message.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderProducerService {
  constructor(private readonly rabbit: RabbitMQService) {}

  publish(orderId: string): string {
    const messageId = uuidv4();
    const payload: OrderMessage = {
      messageId,
      orderId,
      createdAt: new Date().toISOString(),
      attempt: 0,
      correlationId: uuidv4(),
      producer: 'orders-api',
      eventName: 'order.created',
    };
    const channel = this.rabbit.getChannel();
    const queue = this.rabbit.getProcessQueue();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
    });
    return messageId;
  }
}
