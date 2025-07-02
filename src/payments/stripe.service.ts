import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('stripe.secretKey')!,
      {
        apiVersion: '2025-06-30.basil',
        typescript: true,
      },
    );
  }

  getStripeInstance(): Stripe {
    return this.stripe;
  }

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email,
      name,
    });
  }

  async createCheckoutSession(params: {
    priceId: string;
    customerId: string;
    successUrl: string;
    cancelUrl: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    const {
      priceId,
      customerId,
      successUrl,
      cancelUrl,
      trialPeriodDays,
      metadata,
    } = params;

    return this.stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: trialPeriodDays
        ? {
            trial_period_days: trialPeriodDays,
          }
        : undefined,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true,
      },
    });
  }

  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async cancelSubscription(
    subscriptionId: string,
    immediate = false,
  ): Promise<Stripe.Subscription> {
    if (immediate) {
      return this.stripe.subscriptions.cancel(subscriptionId);
    } else {
      return this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  async reactivateSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    return this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
  }

  async syncProducts(): Promise<void> {
    this.logger.log('Starting product sync from Stripe...');

    const products = await this.stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    for (const stripeProduct of products.data) {
      await this.upsertProduct(stripeProduct);

      // Sync all prices for this product
      const prices = await this.stripe.prices.list({
        product: stripeProduct.id,
        active: true,
      });

      for (const stripePrice of prices.data) {
        await this.upsertPrice(stripePrice, stripeProduct.id);
      }
    }

    this.logger.log(`Synced ${products.data.length} products from Stripe`);
  }

  private async upsertProduct(stripeProduct: Stripe.Product): Promise<void> {
    await this.prisma.product.upsert({
      where: { stripeProductId: stripeProduct.id },
      update: {
        name: stripeProduct.name,
        description: stripeProduct.description,
        metadata: stripeProduct.metadata as any,
        active: stripeProduct.active,
        updatedAt: new Date(),
      },
      create: {
        stripeProductId: stripeProduct.id,
        name: stripeProduct.name,
        description: stripeProduct.description,
        metadata: stripeProduct.metadata as any,
        active: stripeProduct.active,
      },
    });
  }

  private async upsertPrice(
    stripePrice: Stripe.Price,
    productStripeId: string,
  ): Promise<void> {
    // Find the product by Stripe ID
    const product = await this.prisma.product.findUnique({
      where: { stripeProductId: productStripeId },
    });

    if (!product) {
      this.logger.error(
        `Product not found for Stripe product ID: ${productStripeId}`,
      );
      return;
    }

    const priceType =
      stripePrice.type === 'recurring' ? 'RECURRING' : 'ONE_TIME';
    let interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | null = null;
    let intervalCount: number | null = null;

    if (stripePrice.recurring) {
      switch (stripePrice.recurring.interval) {
        case 'day':
          interval = 'DAY';
          break;
        case 'week':
          interval = 'WEEK';
          break;
        case 'month':
          interval = 'MONTH';
          break;
        case 'year':
          interval = 'YEAR';
          break;
      }
      intervalCount = stripePrice.recurring.interval_count;
    }

    await this.prisma.price.upsert({
      where: { stripePriceId: stripePrice.id },
      update: {
        nickname: stripePrice.nickname,
        currency: stripePrice.currency,
        type: priceType as any,
        unitAmount: stripePrice.unit_amount,
        interval: interval as any,
        intervalCount,
        metadata: stripePrice.metadata as any,
        active: stripePrice.active,
        updatedAt: new Date(),
      },
      create: {
        stripePriceId: stripePrice.id,
        productId: product.id,
        nickname: stripePrice.nickname,
        currency: stripePrice.currency,
        type: priceType as any,
        unitAmount: stripePrice.unit_amount,
        interval: interval as any,
        intervalCount,
        metadata: stripePrice.metadata as any,
        active: stripePrice.active,
      },
    });
  }

  async constructWebhookEvent(
    payload: string,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    )!;
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
