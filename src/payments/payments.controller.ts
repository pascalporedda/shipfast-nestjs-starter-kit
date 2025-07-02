import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentThrottle, CustomThrottle } from '../common/decorators/throttler.decorators';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { User as UserEntity } from '@prisma/client';
import { StripeService } from './stripe.service';
import { WebhookService } from './webhook.service';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ChangeSubscriptionDto } from './dto/change-subscription.dto';
import { SubscriptionIdParamDto } from '../common/dto/params.dto';
import {
  CheckoutSessionResponseDto,
  PortalSessionResponseDto,
  ProductResponseDto,
  SubscriptionResponseDto,
  PaymentMethodResponseDto,
} from './dto/payment-response.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly webhookService: WebhookService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      const payload = req.rawBody;
      if (!payload) {
        throw new BadRequestException('Missing request body');
      }

      const event = await this.stripeService.constructWebhookEvent(
        payload.toString(),
        signature,
      );

      await this.webhookService.handleWebhookEvent(event);

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook error:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Post('checkout')
  @PaymentThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create checkout session' })
  @ApiResponse({
    status: 200,
    description: 'Checkout session created',
    type: CheckoutSessionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createCheckoutSession(
    @User() user: UserEntity,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
  ) {
    const session = await this.paymentsService.createCheckoutSession(
      user.id,
      createCheckoutSessionDto,
    );

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  @Post('portal')
  @PaymentThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create customer portal session' })
  @ApiResponse({
    status: 200,
    description: 'Portal session created',
    type: PortalSessionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPortalSession(@User() user: UserEntity) {
    const session = await this.paymentsService.createPortalSession(user.id);

    return {
      url: session.url,
    };
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all active products' })
  @ApiResponse({
    status: 200,
    description: 'List of active products',
    type: [ProductResponseDto],
  })
  async getProducts() {
    return this.paymentsService.getProducts();
  }

  @Get('subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'User subscriptions',
    type: [SubscriptionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserSubscriptions(@User() user: UserEntity) {
    return this.paymentsService.getUserSubscriptions(user.id);
  }

  @Post('subscriptions/:id/cancel')
  @PaymentThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription cancelled',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid subscription ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(
    @User() user: UserEntity,
    @Param() params: SubscriptionIdParamDto,
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    return this.paymentsService.cancelSubscription(
      user.id,
      params.id,
      cancelSubscriptionDto.immediate,
    );
  }

  @Post('subscriptions/:id/reactivate')
  @PaymentThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reactivate subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription reactivated',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid subscription ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async reactivateSubscription(
    @User() user: UserEntity,
    @Param() params: SubscriptionIdParamDto,
  ) {
    return this.paymentsService.reactivateSubscription(user.id, params.id);
  }

  @Post('subscriptions/:id/change')
  @PaymentThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiParam({ name: 'id', description: 'Subscription ID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription updated',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async changeSubscription(
    @User() user: UserEntity,
    @Param() params: SubscriptionIdParamDto,
    @Body() changeSubscriptionDto: ChangeSubscriptionDto,
  ) {
    return this.paymentsService.changeSubscription(
      user.id,
      params.id,
      changeSubscriptionDto.priceId,
    );
  }

  @Get('payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user payment methods' })
  @ApiResponse({
    status: 200,
    description: 'User payment methods',
    type: [PaymentMethodResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentMethods(@User() user: UserEntity) {
    return this.paymentsService.getPaymentMethods(user.id);
  }

  @Post('sync-products')
  @CustomThrottle(5, 300)
  @ApiOperation({ summary: 'Sync products from Stripe' })
  @ApiResponse({ status: 200, description: 'Products synced successfully' })
  async syncProducts() {
    await this.stripeService.syncProducts();
    return { message: 'Products synced successfully' };
  }
}
