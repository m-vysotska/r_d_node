import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { Order } from './entities/order.entity';
import { ProcessedMessage } from './entities/processed-message.entity';
import { QueueModule } from './queue/queue.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const db = config.get('database');
        return {
          type: 'postgres',
          host: db?.host ?? 'localhost',
          port: db?.port ?? 5432,
          username: db?.username ?? 'postgres',
          password: db?.password ?? 'postgres',
          database: db?.name ?? 'orders',
          entities: [Order, ProcessedMessage],
          synchronize: process.env.NODE_ENV !== 'production',
        };
      },
      inject: [ConfigService],
    }),
    QueueModule,
    OrdersModule,
  ],
})
export class AppModule {}