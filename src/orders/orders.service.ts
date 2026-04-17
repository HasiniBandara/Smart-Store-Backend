import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentService: PaymentService
  ) {}

  async createOrder(
    userId: number,
    totalPrice: number,
    status: string,
    cartItems: { productId: number; quantity: number; price: number }[],
    transactionId?: string,
    paymentGateway?: 'stripe' | 'paypal',
  ) {
    if (transactionId) {
      if (paymentGateway === 'stripe') {
        const isValid = await this.paymentService.verifyStripePayment(transactionId);
        if (!isValid) {
          throw new BadRequestException('Stripe verification failed. Cannot create order.');
        }
      } else if (paymentGateway === 'paypal') {
        const isValid = await this.paymentService.verifyPayPalPayment(transactionId);
        if (!isValid) {
          throw new BadRequestException('PayPal verification failed. Cannot create order.');
        }
      }
    }

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Insert into orders
      const orderInsertResult = await client.query(
        'INSERT INTO orders (user_id, total_price, status, transaction_id, payment_gateway) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, totalPrice, status, transactionId || null, paymentGateway || null],
      );

      const orderId = orderInsertResult.rows[0].id;

      // Insert into order_items
      for (const item of cartItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.productId, item.quantity, item.price],
        );
      }

      await client.query('COMMIT');
      return { success: true, orderId };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving order details:', error);
      throw new InternalServerErrorException('Failed to process order persistence');
    } finally {
      client.release();
    }
  }
}
