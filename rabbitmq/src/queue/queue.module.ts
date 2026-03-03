import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OrderProducerService } from './order-producer.service';
import { OrderConsumerService } from './order-consumer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { ProcessedMessage } from '../entities/processed-message.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, ProcessedMessage]),
  ],
  providers: [RabbitMQService, OrderProducerService, OrderConsumerService],
  exports: [RabbitMQService, OrderProducerService],
})
export class QueueModule {}