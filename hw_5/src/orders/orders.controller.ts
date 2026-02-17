import { Controller, Get, Post, Body, Param, Query, Headers, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from '../entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
  ): Promise<Order> {
    const idempotencyKey = createOrderDto.idempotencyKey || idempotencyKeyHeader;
    
    if (!idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required either in body or as Idempotency-Key header');
    }

    return this.ordersService.createOrder({
      ...createOrderDto,
      idempotencyKey: idempotencyKey,
    });
  }

  @Get()
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Order[]> {
    return this.ordersService.findAll({
      status,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }
}
