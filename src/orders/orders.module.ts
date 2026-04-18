import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentModule } from '../payment/payment.module';

import { ProductsModule } from '../products/products.module';

@Module({
  imports: [DatabaseModule, PaymentModule, ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
