import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { IsStripeId } from '../../common/decorators/validation.decorators';

export class ChangeSubscriptionDto {
  @ApiProperty({
    description: 'The new price ID to change the subscription to',
    example: 'price_1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @IsStripeId('price')
  priceId: string;
}