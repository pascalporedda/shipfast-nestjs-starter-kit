import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue.service';

@Injectable()
export class QueueExamples {
  constructor(private queueService: QueueService) {}

  // Email queue examples
  async sendWelcomeEmailExample(userEmail: string, userName: string) {
    // Send welcome email immediately
    const immediateJob = await this.queueService.addWelcomeEmail(userEmail, {
      name: userName,
      loginUrl: 'https://yourdomain.com/login',
    });

    // Send welcome email with 5 minute delay
    const delayedJob = await this.queueService.addWelcomeEmail(
      userEmail,
      {
        name: userName,
        loginUrl: 'https://yourdomain.com/login',
      },
      {
        delay: 5 * 60 * 1000, // 5 minutes
        priority: 5,
      },
    );

    return { immediateJob: immediateJob.id, delayedJob: delayedJob.id };
  }

  async sendPasswordResetExample(
    userEmail: string,
    userName: string,
    resetToken: string,
  ) {
    return this.queueService.addResetPasswordEmail(
      userEmail,
      {
        name: userName,
        resetLink: `https://yourdomain.com/reset-password?token=${resetToken}`,
        expiresIn: '1 hour',
      },
      {
        priority: 10, // High priority for password resets
        attempts: 5,
      },
    );
  }

  async sendBulkNotificationExample() {
    const users = [
      { email: 'user1@example.com', name: 'John Doe' },
      { email: 'user2@example.com', name: 'Jane Smith' },
      { email: 'user3@example.com', name: 'Bob Johnson' },
    ];

    return this.queueService.addBulkWelcomeEmails(
      users.map((user) => ({
        to: user.email,
        data: {
          name: user.name,
          loginUrl: 'https://yourdomain.com/login',
        },
      })),
      {
        batchSize: 10,
        priority: 0,
      },
    );
  }

  // File processing queue examples
  async processImageExample(
    userId: string,
    imageId: string,
    imagePath: string,
  ) {
    // Resize image to thumbnail
    const thumbnailJob = await this.queueService.addImageResize(
      `${imageId}_thumb`,
      imagePath,
      userId,
      {
        width: 200,
        height: 200,
        quality: 80,
        format: 'jpeg',
      },
    );

    // Resize image to medium size with delay
    const mediumJob = await this.queueService.addImageResize(
      `${imageId}_medium`,
      imagePath,
      userId,
      {
        width: 800,
        height: 600,
        quality: 90,
        format: 'jpeg',
      },
      {
        delay: 2000, // 2 second delay
        priority: -1, // Lower priority
      },
    );

    return { thumbnailJob: thumbnailJob.id, mediumJob: mediumJob.id };
  }

  async generateReportPdfExample(userId: string, reportData: Record<string, any>) {
    return this.queueService.addPdfGeneration(
      `report_${Date.now()}`,
      userId,
      {
        template: 'monthly-report',
        data: reportData,
        margins: {
          top: 20,
          bottom: 20,
          left: 15,
          right: 15,
        },
      },
      {
        priority: 1,
        attempts: 2,
      },
    );
  }

  async exportUserDataExample(userId: string) {
    return this.queueService.addCsvExport(
      `users_export_${Date.now()}`,
      userId,
      {
        query: 'SELECT * FROM users WHERE active = true',
        headers: ['id', 'email', 'name', 'created_at'],
        filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`,
      },
    );
  }

  // Notification queue examples
  async sendPushNotificationExample(userId: string) {
    return this.queueService.addPushNotification(
      userId,
      'New Message',
      'You have received a new message from John Doe',
      {
        deviceTokens: ['device_token_1', 'device_token_2'],
        badge: 1,
        sound: 'notification.wav',
        category: 'message',
      },
      {
        priority: 8,
        attempts: 3,
      },
    );
  }

  async sendSmsExample(userId: string) {
    return this.queueService.addSmsNotification(
      userId,
      'Verification Code',
      'Your verification code is: 123456',
      {
        phoneNumber: '+1234567890',
        countryCode: 'US',
      },
      {
        priority: 10, // High priority for SMS
        attempts: 3,
      },
    );
  }

  async sendWebhookExample(userId: string) {
    return this.queueService.addWebhookNotification(
      userId,
      'User Action',
      'User completed signup process',
      {
        url: 'https://api.external-service.com/webhooks/user-signup',
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        retries: 3,
      },
      {
        priority: 0,
        attempts: 5, // More retries for webhooks
      },
    );
  }

  async createInAppNotificationExample(userId: string) {
    return this.queueService.addInAppNotification(
      userId,
      'Welcome!',
      'Welcome to our platform. Start by completing your profile.',
      {
        priority: 'high',
        category: 'onboarding',
        actionUrl: '/profile/setup',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    );
  }

  // Queue management examples
  async getQueueStatsExample() {
    // Get stats for all queues
    const allStats = await this.queueService.getAllQueueStats();

    // Get stats for specific queue
    const emailStats = await this.queueService.getEmailQueueStats();

    return { allStats, emailStats };
  }

  async managementExample() {
    // Pause all queues (useful for maintenance)
    await this.queueService.pauseAllQueues();

    // Get failed jobs for investigation
    const failedJobs = await this.queueService.getFailedJobs(5);

    // Resume all queues
    await this.queueService.resumeAllQueues();

    return { failedJobsCount: failedJobs.length };
  }

  // Scheduled jobs examples
  async scheduleDelayedEmailExample(userEmail: string, userName: string) {
    // Schedule welcome email for tomorrow at 9 AM
    const tomorrow9AM = new Date();
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);

    return this.queueService.scheduleWelcomeEmail(
      userEmail,
      {
        name: userName,
        loginUrl: 'https://yourdomain.com/login',
      },
      tomorrow9AM,
    );
  }

  // Cleanup example - schedule file cleanup after 24 hours
  async scheduleFileCleanupExample(
    fileId: string,
    filePath: string,
    userId: string,
  ) {
    return this.queueService.addFileCleanup(fileId, filePath, userId, {
      delay: 24 * 60 * 60 * 1000, // 24 hours
      priority: -10, // Very low priority
    });
  }
}
