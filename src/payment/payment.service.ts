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

  async verifyStripePayment(paymentIntentId: string, expectedLkrAmount: number): Promise<boolean> {
    try {
      if (!paymentIntentId) return false;
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (intent.status !== 'succeeded') return false;

      // 1. Verify currency (must be USD as per our design)
      if (intent.currency !== 'usd') return false;

      // 2. Use the LKR amount stored in metadata during intent creation
      const metadataLkr = intent.metadata?.original_amount_lkr;
      if (metadataLkr) {
        if (parseFloat(metadataLkr) !== expectedLkrAmount) {
          console.error(`Stripe metadata amount mismatch: expected ${expectedLkrAmount}, got ${metadataLkr}`);
          return false;
        }
        // If metadata matches, we trust the intent was created for this amount
        return true;
      }

      // Fallback: Recalculate (less reliable due to rate fluctuations)
      const expectedUsd = await this.convertLKRtoUSD(expectedLkrAmount);
      const expectedCents = Math.max(Math.round(expectedUsd * 100), 50);

      const diff = Math.abs(intent.amount - expectedCents);
      if (diff > 1) {
        console.error(`Stripe fallback amount mismatch: expected ${expectedCents}, got ${intent.amount}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying Stripe payment:', error);
      return false;
    }
  }

  async verifyPayPalPayment(orderId: string, expectedLkrAmount: number): Promise<boolean> {
    try {
      const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error('PayPal credentials are missing. Cannot verify payment.');
        return false;
      }
      
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
      const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${auth}` },
      });
      
      if (!response.ok) return false;
      const data = await response.json();
      
      if (data.status !== 'COMPLETED') return false;

      // Verify amount
      const paidAmountUsd = parseFloat(data.purchase_units[0].amount.value);
      const expectedUsd = await this.convertLKRtoUSD(expectedLkrAmount);

      // Buffer of 0.05 USD for conversion differences
      if (Math.abs(paidAmountUsd - expectedUsd) > 0.05) {
        console.error(`PayPal amount mismatch: expected ${expectedUsd}, got ${paidAmountUsd}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying PayPal payment:', error);
      return false;
    }
  }

}