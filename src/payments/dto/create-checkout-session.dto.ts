import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  Min,
  Max,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { IsStripeId, IsMetadata } from '../../common/decorators/validation.decorators';

export class CreateCheckoutSessionDto {
  @ApiProperty({ example: 'price_1234567890abcdef' })
  @IsString()
  @IsNotEmpty()
  @IsStripeId('price')
  priceId: string;

  @ApiProperty({ example: 'https://yourapp.com/success' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  successUrl: string;

  @ApiProperty({ example: 'https://yourapp.com/cancel' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  cancelUrl: string;

  @ApiPropertyOptional({
    example: 7,
    description: 'Trial period in days',
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  trialPeriodDays?: number;

  @ApiPropertyOptional({
    example: { userId: '123', planType: 'premium' },
    description: 'Additional metadata for the checkout session',
  })
  @IsOptional()
  @IsMetadata()
  metadata?: Record<string, string>;
}
