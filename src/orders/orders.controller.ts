import { Controller, Post, Get, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(
    @Req() req: any,
    @Body()
    body: {
      totalPrice: number;
      status: string;
      cartItems: { productId: number; quantity: number; price: number }[];
      transactionId?: string;
      paymentGateway?: 'stripe' | 'paypal';
    },
  ) {
    const userId = req.user.id;
    
    return this.ordersService.createOrder(
      userId,
      body.totalPrice,
      body.status,
      body.cartItems,
      body.transactionId,
      body.paymentGateway,
    );
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  async findByUser(@Req() req: any, @Param('userId') userId: string) {
    const authenticatedUserId = req.user.id;
    
    // Security check: only allow users to see their own orders
    if (String(authenticatedUserId) !== String(userId)) {
      throw new ForbiddenException('You can only view your own order history');
    }

    return this.ordersService.findByUser(authenticatedUserId);
  }

  @Get()
@UseGuards(AuthGuard)
async findAll() {
  return this.ordersService.findAll();
}
}
