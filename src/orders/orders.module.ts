import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [DatabaseModule, PaymentModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
