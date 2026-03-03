import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderProducerService } from '../queue/order-producer.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly producer: OrderProducerService,
  ) {}

  async create(userId?: string): Promise<{ orderId: string; messageId: string }> {
    const order = this.orderRepo.create({
      status: OrderStatus.PENDING,
      total: '0',
      userId: userId ?? null,
    });
    const saved = await this.orderRepo.save(order);
    const messageId = this.producer.publish(saved.id);
    return { orderId: saved.id, messageId };
  }
}
