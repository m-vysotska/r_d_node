import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { OrderStatus } from '../../entities/order.entity';
import { OrderItemModel } from './order-item.model';

@ObjectType()
export class OrderModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float)
  total: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [OrderItemModel])
  items: OrderItemModel[];
}
