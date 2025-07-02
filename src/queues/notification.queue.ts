import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

export interface NotificationJob {
  userId: string;
  type: 'push' | 'sms' | 'webhook' | 'in-app';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface PushNotificationData {
  deviceTokens: string[];
  badge?: number;
  sound?: string;
  category?: string;
}

export interface SmsNotificationData {
  phoneNumber: string;
  countryCode?: string;
}

export interface WebhookNotificationData {
  url: string;
  headers?: Record<string, string>;
  method?: 'POST' | 'PUT' | 'PATCH';
  retries?: number;
}

export interface InAppNotificationData {
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionUrl?: string;
  expiresAt?: Date;
}

@Processor('notification')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  @Process('push')
  async handlePushNotification(job: Job<NotificationJob>) {
    try {
      this.logger.log(
        `Processing push notification for user ${job.data.userId}`,
      );

      const data = job.data.data as PushNotificationData;

      // Simulate push notification sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.logger.log(`Push notification sent to user ${job.data.userId}`);
      return {
        success: true,
        deviceCount: data.deviceTokens.length,
        deliveredCount: data.deviceTokens.length - 1, // Simulate one failure
      };
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${job.data.userId}`,
        error,
      );
      throw error;
    }
  }

  @Process('sms')
  async handleSmsNotification(job: Job<NotificationJob>) {
    try {
      this.logger.log(
        `Processing SMS notification for user ${job.data.userId}`,
      );

      const data = job.data.data as SmsNotificationData;

      // Simulate SMS sending
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.logger.log(`SMS notification sent to user ${job.data.userId}`);
      return {
        success: true,
        phoneNumber: data.phoneNumber,
        messageId: `sms_${Date.now()}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS notification to user ${job.data.userId}`,
        error,
      );
      throw error;
    }
  }

  @Process('webhook')
  async handleWebhookNotification(job: Job<NotificationJob>) {
    try {
      this.logger.log(
        `Processing webhook notification for user ${job.data.userId}`,
      );

      const data = job.data.data as WebhookNotificationData;

      // Simulate webhook call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.logger.log(`Webhook notification sent for user ${job.data.userId}`);
      return {
        success: true,
        url: data.url,
        statusCode: 200,
        responseTime: 1500,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send webhook notification for user ${job.data.userId}`,
        error,
      );
      throw error;
    }
  }

  @Process('in-app')
  async handleInAppNotification(job: Job<NotificationJob>) {
    try {
      this.logger.log(
        `Processing in-app notification for user ${job.data.userId}`,
      );

      const data = job.data.data as InAppNotificationData;

      // Simulate storing in-app notification
      await new Promise((resolve) => setTimeout(resolve, 300));

      this.logger.log(
        `In-app notification created for user ${job.data.userId}`,
      );
      return {
        success: true,
        notificationId: `notif_${Date.now()}`,
        priority: data.priority,
        category: data.category,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create in-app notification for user ${job.data.userId}`,
        error,
      );
      throw error;
    }
  }

  @Process('batch-notifications')
  async handleBatchNotifications(
    job: Job<{ notifications: NotificationJob[] }>,
  ) {
    try {
      this.logger.log(
        `Processing batch notifications (${job.data.notifications.length} notifications)`,
      );

      // Process notifications in parallel with a concurrency limit
      const concurrency = 5;
      const results: { userId: string; success: boolean }[] = [];

      for (let i = 0; i < job.data.notifications.length; i += concurrency) {
        const batch = job.data.notifications.slice(i, i + concurrency);
        const batchPromises = batch.map(async (notification) => {
          // Simulate individual notification processing
          await new Promise((resolve) => setTimeout(resolve, 500));
          return { userId: notification.userId, success: true };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      this.logger.log(
        `Batch notifications completed (${results.length} processed)`,
      );
      return {
        success: true,
        totalProcessed: results.length,
        successCount: results.filter((r) => r.success).length,
      };
    } catch (error) {
      this.logger.error(`Failed to process batch notifications`, error);
      throw error;
    }
  }
}
