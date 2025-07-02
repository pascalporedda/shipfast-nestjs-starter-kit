import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`.trim() || undefined,
      );

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Verify the price exists in our database
    const price = await this.prisma.price.findUnique({
      where: { stripePriceId: dto.priceId },
      include: { product: true },
    });

    if (!price || !price.active) {
      throw new BadRequestException('Invalid or inactive price');
    }

    return this.stripeService.createCheckoutSession({
      priceId: dto.priceId,
      customerId: stripeCustomerId,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
      trialPeriodDays: dto.trialPeriodDays,
      metadata: {
        ...dto.metadata,
        userId,
        priceId: price.id,
      },
    });
  }

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw new NotFoundException('User or Stripe customer not found');
    }

    const returnUrl = this.configService.get<string>('appUrl') + '/dashboard';

    return this.stripeService.createPortalSession(
      user.stripeCustomerId,
      returnUrl,
    );
  }

  async getProducts() {
    return this.prisma.product.findMany({
      where: { active: true },
      include: {
        prices: {
          where: { active: true },
          orderBy: { unitAmount: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: {
        price: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelSubscription(
    userId: string,
    subscriptionId: string,
    immediate = false,
  ) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updatedSubscription = await this.stripeService.cancelSubscription(
      subscription.stripeSubscriptionId,
      immediate,
    );

    // Update local subscription
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        cancelAt: updatedSubscription.cancel_at
          ? new Date(updatedSubscription.cancel_at * 1000)
          : null,
        status: immediate ? 'CANCELED' : subscription.status,
        updatedAt: new Date(),
      },
    });

    return { success: true, immediate };
  }

  async reactivateSubscription(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
        cancelAtPeriodEnd: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(
        'Subscription not found or not eligible for reactivation',
      );
    }

    const updatedSubscription = await this.stripeService.reactivateSubscription(
      subscription.stripeSubscriptionId,
    );

    // Update local subscription
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: false,
        cancelAt: null,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  }

  async changeSubscription(
    userId: string,
    subscriptionId: string,
    newPriceId: string,
  ) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify the new price exists
    const newPrice = await this.prisma.price.findUnique({
      where: { stripePriceId: newPriceId },
    });

    if (!newPrice || !newPrice.active) {
      throw new BadRequestException('Invalid or inactive price');
    }

    const updatedSubscription = await this.stripeService.updateSubscription(
      subscription.stripeSubscriptionId,
      newPriceId,
    );

    // Update local subscription
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        priceId: newPrice.id,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  }

  async getPaymentMethods(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string) {
    return this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: {
        user: true,
        price: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
        currentPeriodEnd: {
          gt: new Date(),
        },
      },
    });

    return !!activeSubscription;
  }

  async getUserPlan(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
        currentPeriodEnd: {
          gt: new Date(),
        },
      },
      include: {
        price: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    return {
      subscription,
      product: subscription.price.product,
      price: subscription.price,
      isActive: subscription.status === 'ACTIVE',
      isTrial: subscription.status === 'TRIALING',
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }
}
