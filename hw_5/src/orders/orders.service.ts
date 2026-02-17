import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { userId, items, idempotencyKey } = createOrderDto;

    if (!idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required');
    }

    const existingOrder = await this.ordersRepository.findOne({
      where: { idempotencyKey },
      relations: ['items', 'items.product'],
    });

    if (existingOrder) {
      return existingOrder;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productIds = items.map(item => item.productId);
      
      const products = await queryRunner.manager
        .createQueryBuilder(Product, 'product')
        .where('product.id IN (:...ids)', { ids: productIds })
        .setLock('pessimistic_write')
        .getMany();

      if (products.length !== productIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      const productMap = new Map(products.map(p => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }
      }

      let total = 0;

      for (const item of items) {
        const product = productMap.get(item.productId);
        const itemTotal = Number(product.price) * item.quantity;
        total += itemTotal;

        await queryRunner.manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `stock - ${item.quantity}` })
          .where('id = :id', { id: product.id })
          .execute();
      }

      const order = queryRunner.manager.create(Order, {
        userId,
        status: OrderStatus.CONFIRMED,
        total,
        idempotencyKey,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      for (const item of items) {
        const product = productMap.get(item.productId);
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
        await queryRunner.manager.save(OrderItem, orderItem);
      }

      await queryRunner.commitTransaction();

      return this.ordersRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to create order');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters?: { status?: OrderStatus; userId?: string; startDate?: Date; endDate?: Date }): Promise<Order[]> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (filters?.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId: filters.userId });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate });
    }

    queryBuilder.orderBy('order.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Order> {
    return this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });
  }
}
