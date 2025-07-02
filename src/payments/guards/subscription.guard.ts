import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PaymentsService } from '../payments.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly paymentsService: PaymentsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasActiveSubscription =
      await this.paymentsService.hasActiveSubscription(user.id);

    if (!hasActiveSubscription) {
      throw new ForbiddenException(
        'Active subscription required to access this feature',
      );
    }

    return true;
  }
}
