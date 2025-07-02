import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { IsCuid } from '../decorators/validation.decorators';

/**
 * DTO for validating ID parameters in routes
 */
export class IdParamDto {
  @ApiProperty({
    description: 'The ID of the resource',
    example: 'c1234567890123456789012345',
  })
  @IsString()
  @IsNotEmpty()
  @IsCuid()
  id: string;
}

/**
 * DTO for validating user ID parameters
 */
export class UserIdParamDto {
  @ApiProperty({
    description: 'The user ID',
    example: 'c1234567890123456789012345',
  })
  @IsString()
  @IsNotEmpty()
  @IsCuid()
  id: string;
}

/**
 * DTO for validating subscription ID parameters
 */
export class SubscriptionIdParamDto {
  @ApiProperty({
    description: 'The subscription ID',
    example: 'c1234567890123456789012345',
  })
  @IsString()
  @IsNotEmpty()
  @IsCuid()
  id: string;
}