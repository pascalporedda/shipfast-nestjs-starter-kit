import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { RequiresSubscription } from '../decorators/subscription.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { User as UserEntity } from '@prisma/client';

@ApiTags('premium-features')
@Controller('premium-features')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PremiumFeaturesController {
  @Get('basic')
  @ApiOperation({ summary: 'Get basic features (free users)' })
  @ApiResponse({
    status: 200,
    description: 'Basic features available to all users',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getBasicFeatures(@User() user: UserEntity) {
    return {
      features: ['Basic dashboard', 'Limited API calls', 'Standard support'],
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  @Get('premium')
  @UseGuards(SubscriptionGuard)
  @RequiresSubscription()
  @ApiOperation({ summary: 'Get premium features (subscription required)' })
  @ApiResponse({
    status: 200,
    description: 'Premium features for subscribed users',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  getPremiumFeatures(@User() user: UserEntity) {
    return {
      features: [
        'Advanced analytics',
        'Unlimited API calls',
        'Priority support',
        'Custom integrations',
        'Advanced reporting',
      ],
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  @Get('enterprise')
  @UseGuards(SubscriptionGuard)
  @RequiresSubscription()
  @ApiOperation({ summary: 'Get enterprise features (subscription required)' })
  @ApiResponse({
    status: 200,
    description: 'Enterprise features for subscribed users',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  getEnterpriseFeatures(@User() user: UserEntity) {
    return {
      features: [
        'White-label solution',
        'Custom branding',
        'Dedicated support manager',
        'SLA guarantees',
        'Advanced security features',
        'Custom development',
      ],
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
