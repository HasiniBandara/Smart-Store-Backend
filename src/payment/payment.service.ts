import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';


@Injectable()
export class PaymentService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });

  // Shared: LKR → USD conversion
  private async convertLKRtoUSD(lkrAmount: number): Promise<number> {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/LKR');
      const data = await res.json();
      if (data?.rates?.USD) return lkrAmount * data.rates.USD;
    } catch {
      console.warn('Exchange rate API unavailable. Using fallback rate.');
    }
    return lkrAmount * 0.0031;
  }

// Stripe
  async createPaymentIntent(amountLKR: number) {
    if (amountLKR <= 0) throw new Error('Amount must be greater than zero');

    const amountUSD = await this.convertLKRtoUSD(amountLKR);
    const amountInCents = Math.max(Math.round(amountUSD * 100), 50);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { original_amount_lkr: amountLKR.toString() },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amountUSD: amountUSD.toFixed(2),
      amountLKR,
    };
  }

  async verifyStripePayment(paymentIntentId: string): Promise<boolean> {
    try {
      if (!paymentIntentId) return false;
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return intent.status === 'succeeded';
    } catch (error) {
      console.error('Error verifying Stripe payment:', error);
      return false;
    }
  }

  async verifyPayPalPayment(orderId: string): Promise<boolean> {
    try {
      const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.warn('PayPal credentials are missing. Assuming success (please configure ENV variables!).');
        return true;
      }
      
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
      const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${auth}` },
      });
      
      if (!response.ok) return false;
      const data = await response.json();
      return data.status === 'COMPLETED';
    } catch (error) {
      console.error('Error verifying PayPal payment:', error);
      return false;
    }
  }

}