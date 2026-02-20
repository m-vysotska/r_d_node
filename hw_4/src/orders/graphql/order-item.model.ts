import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { ProductModel } from './product.model';

@ObjectType()
export class OrderItemModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  orderId: string;

  @Field(() => ID)
  productId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  price: number;

  @Field()
  createdAt: Date;

  @Field(() => ProductModel)
  product: ProductModel;
}
