import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersResolver, OrderItemResolver } from './orders.resolver';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { ProductsModule } from '../products/products.module';
import { ProductLoader } from '../loaders/product.loader';
import './graphql/order-status.enum';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ProductsModule,
  ],
  providers: [OrdersService, OrdersResolver, OrderItemResolver, ProductLoader],
  exports: [OrdersService],
})
export class OrdersModule {}
