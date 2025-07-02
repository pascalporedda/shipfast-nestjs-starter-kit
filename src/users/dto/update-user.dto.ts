import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, MinLength, MaxLength, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ 
    example: 'John',
    description: 'First name (1-50 characters)',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ 
    example: 'Doe',
    description: 'Last name (1-50 characters)',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
  })
  @ValidateIf((o) => o.avatar !== null)
  @IsUrl()
  @IsOptional()
  avatar?: string | null;
}
