import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Whether to cancel the subscription immediately or at the end of the current period',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean = false;
}