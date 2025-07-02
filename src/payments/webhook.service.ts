import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    // Check if we've already processed this event
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent?.processed) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    // Store the webhook event
    await this.prisma.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      update: {
        type: event.type,
        data: event.data as any,
      },
      create: {
        stripeEventId: event.id,
        type: event.type,
        data: event.data as any,
      },
    });

    try {
      await this.processEvent(event);

      // Mark as processed
      await this.prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      this.logger.log(`Successfully processed webhook event: ${event.type}`);
    } catch (error) {
      this.logger.error(`Failed to process webhook event ${event.id}:`, error);
      throw error;
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.created':
        await this.handleCustomerCreated(event.data.object);
        break;

      case 'customer.updated':
        await this.handleCustomerUpdated(event.data.object);
        break;

      case 'product.created':
      case 'product.updated':
        await this.handleProductUpdated(event.data.object);
        break;

      case 'product.deleted':
        await this.handleProductDeleted(event.data.object);
        break;

      case 'price.created':
      case 'price.updated':
        await this.handlePriceUpdated(event.data.object);
        break;

      case 'price.deleted':
        await this.handlePriceDeleted(event.data.object);
        break;

      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(event.data.object);
        break;

      case 'payment_method.detached':
        await this.handlePaymentMethodDetached(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    // Find the customer
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
    });

    if (!user) {
      this.logger.error(
        `User not found for customer: ${subscription.customer}`,
      );
      return;
    }

    // Get the price
    const stripePriceId = subscription.items.data[0]?.price.id;
    if (!stripePriceId) {
      this.logger.error(`No price found for subscription: ${subscription.id}`);
      return;
    }

    const price = await this.prisma.price.findUnique({
      where: { stripePriceId },
    });

    if (!price) {
      this.logger.error(`Price not found for Stripe price: ${stripePriceId}`);
      return;
    }

    const status = this.mapSubscriptionStatus(subscription.status);

    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : null,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000,
        ),
        endedAt: subscription.ended_at
          ? new Date(subscription.ended_at * 1000)
          : null,
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        metadata: subscription.metadata as any,
        updatedAt: new Date(),
      },
      create: {
        stripeSubscriptionId: subscription.id,
        userId: user.id,
        priceId: price.id,
        status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : null,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000,
        ),
        endedAt: subscription.ended_at
          ? new Date(subscription.ended_at * 1000)
          : null,
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        metadata: subscription.metadata as any,
      },
    });
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    if ((invoice as any).subscription) {
      // Update subscription status if needed
      const subscription = await this.prisma.subscription.findUnique({
        where: {
          stripeSubscriptionId: (invoice as any).subscription as string,
        },
      });

      if (subscription && subscription.status !== 'ACTIVE') {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' },
        });
      }
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    if ((invoice as any).subscription) {
      await this.prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: (invoice as any).subscription as string,
        },
        data: { status: 'PAST_DUE' },
      });
    }
  }

  private async handleCustomerCreated(
    customer: Stripe.Customer,
  ): Promise<void> {
    // Update user with Stripe customer ID if we can find them by email
    if (customer.email) {
      await this.prisma.user.updateMany({
        where: {
          email: customer.email,
          stripeCustomerId: null,
        },
        data: { stripeCustomerId: customer.id },
      });
    }
  }

  private async handleCustomerUpdated(
    customer: Stripe.Customer,
  ): Promise<void> {
    // Update user information if needed
    if (customer.email) {
      await this.prisma.user.updateMany({
        where: { stripeCustomerId: customer.id },
        data: {
          // Update any relevant fields from customer data
          updatedAt: new Date(),
        },
      });
    }
  }

  private async handleProductUpdated(product: Stripe.Product): Promise<void> {
    await this.prisma.product.upsert({
      where: { stripeProductId: product.id },
      update: {
        name: product.name,
        description: product.description,
        metadata: product.metadata as any,
        active: product.active,
        updatedAt: new Date(),
      },
      create: {
        stripeProductId: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata as any,
        active: product.active,
      },
    });
  }

  private async handleProductDeleted(product: Stripe.Product): Promise<void> {
    await this.prisma.product.updateMany({
      where: { stripeProductId: product.id },
      data: { active: false },
    });
  }

  private async handlePriceUpdated(price: Stripe.Price): Promise<void> {
    // Find the product
    const product = await this.prisma.product.findUnique({
      where: { stripeProductId: price.product as string },
    });

    if (!product) {
      this.logger.error(`Product not found for price: ${price.id}`);
      return;
    }

    const priceType = price.type === 'recurring' ? 'RECURRING' : 'ONE_TIME';
    let interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | null = null;
    let intervalCount: number | null = null;

    if (price.recurring) {
      switch (price.recurring.interval) {
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
      intervalCount = price.recurring.interval_count;
    }

    await this.prisma.price.upsert({
      where: { stripePriceId: price.id },
      update: {
        nickname: price.nickname,
        currency: price.currency,
        type: priceType as any,
        unitAmount: price.unit_amount,
        interval: interval as any,
        intervalCount,
        metadata: price.metadata as any,
        active: price.active,
        updatedAt: new Date(),
      },
      create: {
        stripePriceId: price.id,
        productId: product.id,
        nickname: price.nickname,
        currency: price.currency,
        type: priceType as any,
        unitAmount: price.unit_amount,
        interval: interval as any,
        intervalCount,
        metadata: price.metadata as any,
        active: price.active,
      },
    });
  }

  private async handlePriceDeleted(price: Stripe.Price): Promise<void> {
    await this.prisma.price.updateMany({
      where: { stripePriceId: price.id },
      data: { active: false },
    });
  }

  private async handlePaymentMethodAttached(
    paymentMethod: Stripe.PaymentMethod,
  ): Promise<void> {
    if (!paymentMethod.customer) return;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: paymentMethod.customer as string },
    });

    if (!user) return;

    let brand: string | null = null;
    let last4: string | null = null;
    let expiryMonth: number | null = null;
    let expiryYear: number | null = null;

    if (paymentMethod.card) {
      brand = paymentMethod.card.brand;
      last4 = paymentMethod.card.last4;
      expiryMonth = paymentMethod.card.exp_month;
      expiryYear = paymentMethod.card.exp_year;
    }

    await this.prisma.paymentMethod.upsert({
      where: { stripePaymentMethodId: paymentMethod.id },
      update: {
        type: paymentMethod.type,
        brand,
        last4,
        expiryMonth,
        expiryYear,
        updatedAt: new Date(),
      },
      create: {
        stripePaymentMethodId: paymentMethod.id,
        userId: user.id,
        type: paymentMethod.type,
        brand,
        last4,
        expiryMonth,
        expiryYear,
      },
    });
  }

  private async handlePaymentMethodDetached(
    paymentMethod: Stripe.PaymentMethod,
  ): Promise<void> {
    await this.prisma.paymentMethod
      .delete({
        where: { stripePaymentMethodId: paymentMethod.id },
      })
      .catch(() => {
        // Payment method might not exist in our database
      });
  }

  private mapSubscriptionStatus(
    stripeStatus: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    switch (stripeStatus) {
      case 'incomplete':
        return 'INCOMPLETE';
      case 'incomplete_expired':
        return 'INCOMPLETE_EXPIRED';
      case 'trialing':
        return 'TRIALING';
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
        return 'CANCELED';
      case 'unpaid':
        return 'UNPAID';
      case 'paused':
        return 'PAUSED';
      default:
        return 'INCOMPLETE';
    }
  }
}
