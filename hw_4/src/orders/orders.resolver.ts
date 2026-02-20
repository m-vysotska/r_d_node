import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { OrdersFilterInput } from './dto/orders-filter.input';
import { OrdersPaginationInput } from './dto/orders-pagination.input';
import { OrderModel } from './graphql/order.model';
import { OrderItemModel } from './graphql/order-item.model';
import { ProductModel } from './graphql/product.model';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { ProductLoader } from '../loaders/product.loader';

@Resolver(() => OrderModel)
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Query(() => [OrderModel], { name: 'orders' })
  async getOrders(
    @Args('filter', { nullable: true }) filter?: OrdersFilterInput,
    @Args('pagination', { nullable: true }) pagination?: OrdersPaginationInput,
  ): Promise<Order[]> {
    const filters = filter
      ? {
          status: filter.status,
          userId: filter.userId,
          startDate: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
          endDate: filter.dateTo ? new Date(filter.dateTo) : undefined,
        }
      : undefined;

    const orders = await this.ordersService.findAll(filters);

    if (pagination) {
      const { limit = 10, offset = 0 } = pagination;
      return orders.slice(offset, offset + limit);
    }

    return orders;
  }

  @ResolveField(() => [OrderItemModel], { name: 'items' })
  async getItems(@Parent() order: Order): Promise<OrderItem[]> {
    return order.items || [];
  }
}

@Resolver(() => OrderItemModel)
export class OrderItemResolver {
  constructor(private readonly productLoader: ProductLoader) {}

  @ResolveField(() => ProductModel, { name: 'product' })
  async getProduct(@Parent() item: OrderItem): Promise<Product> {
    return this.productLoader.load(item.productId);
  }
}
