import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutSessionResponseDto {
  @ApiProperty({
    description: 'The Stripe checkout session ID',
    example: 'cs_test_1234567890abcdef',
  })
  sessionId: string;

  @ApiProperty({
    description: 'The checkout session URL',
    example: 'https://checkout.stripe.com/c/pay/cs_test_1234567890abcdef',
  })
  url: string;
}

export class PortalSessionResponseDto {
  @ApiProperty({
    description: 'The customer portal URL',
    example: 'https://billing.stripe.com/p/session/1234567890abcdef',
  })
  url: string;
}

export class PriceResponseDto {
  @ApiProperty({
    description: 'Price ID',
    example: 'c1234567890123456789012345',
  })
  id: string;

  @ApiProperty({
    description: 'Stripe price ID',
    example: 'price_1234567890abcdef',
  })
  stripePriceId: string;

  @ApiPropertyOptional({
    description: 'Price nickname',
    example: 'Monthly Premium',
  })
  nickname?: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
  })
  currency: string;

  @ApiProperty({
    description: 'Price type',
    enum: ['ONE_TIME', 'RECURRING'],
    example: 'RECURRING',
  })
  type: 'ONE_TIME' | 'RECURRING';

  @ApiPropertyOptional({
    description: 'Unit amount in cents',
    example: 999,
  })
  unitAmount?: number;

  @ApiPropertyOptional({
    description: 'Billing interval',
    enum: ['DAY', 'WEEK', 'MONTH', 'YEAR'],
    example: 'MONTH',
  })
  interval?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

  @ApiPropertyOptional({
    description: 'Interval count',
    example: 1,
  })
  intervalCount?: number;

  @ApiPropertyOptional({
    description: 'Trial period in days',
    example: 7,
  })
  trialPeriodDays?: number;

  @ApiProperty({
    description: 'Whether the price is active',
    example: true,
  })
  active: boolean;
}

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'c1234567890123456789012345',
  })
  id: string;

  @ApiProperty({
    description: 'Stripe product ID',
    example: 'prod_1234567890abcdef',
  })
  stripeProductId: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Premium Plan',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Access to premium features',
  })
  description?: string;

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Product creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Available prices for this product',
    type: [PriceResponseDto],
  })
  prices: PriceResponseDto[];
}

export class SubscriptionResponseDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: 'c1234567890123456789012345',
  })
  id: string;

  @ApiProperty({
    description: 'Stripe subscription ID',
    example: 'sub_1234567890abcdef',
  })
  stripeSubscriptionId: string;

  @ApiProperty({
    description: 'Subscription status',
    enum: [
      'INCOMPLETE',
      'INCOMPLETE_EXPIRED',
      'TRIALING',
      'ACTIVE',
      'PAST_DUE',
      'CANCELED',
      'UNPAID',
      'PAUSED',
    ],
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Whether subscription will cancel at period end',
    example: false,
  })
  cancelAtPeriodEnd: boolean;

  @ApiPropertyOptional({
    description: 'When the subscription will be canceled',
    example: '2024-02-01T00:00:00.000Z',
  })
  cancelAt?: Date;

  @ApiPropertyOptional({
    description: 'When the subscription was canceled',
    example: '2024-01-15T00:00:00.000Z',
  })
  canceledAt?: Date;

  @ApiProperty({
    description: 'Current period start',
    example: '2024-01-01T00:00:00.000Z',
  })
  currentPeriodStart: Date;

  @ApiProperty({
    description: 'Current period end',
    example: '2024-02-01T00:00:00.000Z',
  })
  currentPeriodEnd: Date;

  @ApiPropertyOptional({
    description: 'Trial start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  trialStart?: Date;

  @ApiPropertyOptional({
    description: 'Trial end date',
    example: '2024-01-08T00:00:00.000Z',
  })
  trialEnd?: Date;

  @ApiProperty({
    description: 'Associated price information',
    type: PriceResponseDto,
  })
  price: PriceResponseDto;
}

export class PaymentMethodResponseDto {
  @ApiProperty({
    description: 'Payment method ID',
    example: 'c1234567890123456789012345',
  })
  id: string;

  @ApiProperty({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890abcdef',
  })
  stripePaymentMethodId: string;

  @ApiProperty({
    description: 'Payment method type',
    example: 'card',
  })
  type: string;

  @ApiPropertyOptional({
    description: 'Last 4 digits of the card',
    example: '4242',
  })
  last4?: string;

  @ApiPropertyOptional({
    description: 'Card brand',
    example: 'visa',
  })
  brand?: string;

  @ApiPropertyOptional({
    description: 'Card expiry month',
    example: 12,
  })
  expiryMonth?: number;

  @ApiPropertyOptional({
    description: 'Card expiry year',
    example: 2025,
  })
  expiryYear?: number;

  @ApiProperty({
    description: 'Whether this is the default payment method',
    example: true,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Payment method creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}