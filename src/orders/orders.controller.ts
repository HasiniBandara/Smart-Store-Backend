import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Body()
    body: {
      userId: number;
      totalPrice: number;
      status: string;
      cartItems: { productId: number; quantity: number; price: number }[];
      transactionId?: string;
      paymentGateway?: 'stripe' | 'paypal';
    },
  ) {
    // If no userId is provided (since we have no full auth context in frontend easily available), default it to 1
    const userId = body.userId || 1;
    
    return this.ordersService.createOrder(
      userId,
      body.totalPrice,
      body.status,
      body.cartItems,
      body.transactionId,
      body.paymentGateway,
    );
  }
}
