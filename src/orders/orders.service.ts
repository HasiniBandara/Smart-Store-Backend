import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentService } from '../payment/payment.service';

import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentService: PaymentService,
    private readonly productsService: ProductsService
  ) {}

  async createOrder(
    userId: number,
    totalPrice: number, // Still accepted but will be validated
    status: string,
    cartItems: { productId: number; quantity: number; price: number }[],
    transactionId?: string,
    paymentGateway?: 'stripe' | 'paypal',
  ) {
    // 1. Recalculate total price from database (Source of Truth)
    const productIds = cartItems.map(i => i.productId);
    const dbProducts = await this.productsService.findByIds(productIds);
    
    let actualTotalPrice = 0;
    for (const item of cartItems) {
      const dbProduct = dbProducts.find(p => p.id === item.productId);
      if (!dbProduct) {
        throw new BadRequestException(`Product with ID ${item.productId} not found`);
      }
      actualTotalPrice += Number(dbProduct.price) * item.quantity;
      // Also update the item price in our list to the correct DB price
      item.price = Number(dbProduct.price);
    }

    // 2. Verify Payment Amount if transactionId exists
    if (transactionId) {
      if (paymentGateway === 'stripe') {
        const isValid = await this.paymentService.verifyStripePayment(transactionId, actualTotalPrice);
        if (!isValid) {
          console.error(`Stripe verification failed for Transaction: ${transactionId}, Expected LKR: ${actualTotalPrice}`);
          throw new BadRequestException('Stripe verification failed or amount mismatch.');
        }
      } else if (paymentGateway === 'paypal') {
        const isValid = await this.paymentService.verifyPayPalPayment(transactionId, actualTotalPrice);
        if (!isValid) {
          console.error(`PayPal verification failed for Order: ${transactionId}, Expected LKR: ${actualTotalPrice}`);
          throw new BadRequestException('PayPal verification failed or amount mismatch.');
        }
      }
    }

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // 3. Reduce Stock (Transaction-safe)
      await this.productsService.reduceStock(
        { items: cartItems.map(i => ({ id: i.productId, quantity: i.quantity })) },
        client
      );

      // 4. Insert into orders using actual price
      const orderInsertResult = await client.query(
        'INSERT INTO orders (user_id, total_price, status, transaction_id, payment_gateway) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, actualTotalPrice, status, transactionId || null, paymentGateway || null],
      );

      const orderId = orderInsertResult.rows[0].id;

      // 5. Insert into order_items
      for (const item of cartItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.productId, item.quantity, item.price],
        );
      }

      await client.query('COMMIT');
      return { success: true, orderId, verifiedTotalPrice: actualTotalPrice };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving order details:', error);
      throw new InternalServerErrorException(error.message || 'Failed to process order persistence');
    } finally {
      client.release();
    }
  }

  async findByUser(userId: number) {
    const result = await this.db.query(
      `SELECT o.*, 
              json_agg(json_build_object(
                  'productId', oi.product_id,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'name', p.name,
                  'image', p.image
              )) as "cartItems"
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.id DESC`,
      [userId],
    );
    return result.rows;
  }
}
