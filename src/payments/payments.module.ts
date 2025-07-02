import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsController } from './payments.controller';
import { PremiumFeaturesController } from './examples/premium-features.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { WebhookService } from './webhook.service';
import { ProductSyncTask } from './tasks/product-sync.task';
import { SubscriptionGuard } from './guards/subscription.guard';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [PaymentsController, PremiumFeaturesController],
  providers: [
    PaymentsService,
    StripeService,
    WebhookService,
    ProductSyncTask,
    SubscriptionGuard,
    PrismaService,
  ],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}
