import { InputType, Field } from '@nestjs/graphql';
import { OrderStatus } from '../../entities/order.entity';

@InputType()
export class OrdersFilterInput {
  @Field(() => OrderStatus, { nullable: true })
  status?: OrderStatus;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  dateFrom?: string;

  @Field({ nullable: true })
  dateTo?: string;
}
