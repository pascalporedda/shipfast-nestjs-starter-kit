import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StripeService } from '../stripe.service';

@Injectable()
export class ProductSyncTask {
  private readonly logger = new Logger(ProductSyncTask.name);

  constructor(private readonly stripeService: StripeService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncProducts() {
    try {
      this.logger.log('Starting scheduled product sync...');
      await this.stripeService.syncProducts();
      this.logger.log('Scheduled product sync completed successfully');
    } catch (error) {
      this.logger.error('Failed to sync products:', error);
    }
  }

  // Manual trigger for immediate sync
  async triggerSync() {
    await this.syncProducts();
  }
}
