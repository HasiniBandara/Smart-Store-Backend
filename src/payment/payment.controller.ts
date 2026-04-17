import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // Stripe
  @Post()
  createPayment(@Body() body: { amount: number }) {
    return this.paymentService.createPaymentIntent(body.amount);
  }


}