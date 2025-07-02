import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  EmailJob,
  WelcomeEmailData,
  ResetPasswordEmailData,
  NotificationEmailData,
} from './email.queue';
import {
  FileProcessingJob,
  ImageResizeOptions,
  PdfGenerateOptions,
  CsvExportOptions,
} from './file.queue';
import {
  NotificationJob,
  PushNotificationData,
  SmsNotificationData,
  WebhookNotificationData,
  InAppNotificationData,
} from './notification.queue';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('file') private fileQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
  ) {}

  // Email queue methods
  async addWelcomeEmail(
    to: string,
    data: WelcomeEmailData,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: EmailJob = {
      to,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      data,
    };

    return this.emailQueue.add('send-welcome', job, {
      delay: options?.delay,
      priority: options?.priority || 0,
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10, // Keep last 10 completed jobs
      removeOnFail: 5, // Keep last 5 failed jobs
    });
  }

  async addResetPasswordEmail(
    to: string,
    data: ResetPasswordEmailData,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: EmailJob = {
      to,
      subject: 'Reset Your Password',
      template: 'reset-password',
      data,
    };

    return this.emailQueue.add('send-reset-password', job, {
      delay: options?.delay,
      priority: options?.priority || 10, // Higher priority for password resets
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  async addNotificationEmail(
    to: string,
    data: NotificationEmailData,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
      subject?: string;
    },
  ) {
    const job: EmailJob = {
      to,
      subject: options?.subject || data.title,
      template: 'notification',
      data,
    };

    return this.emailQueue.add('send-notification', job, {
      delay: options?.delay,
      priority: options?.priority || 0,
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  async addBatchEmails(
    emails: EmailJob[],
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    return this.emailQueue.add(
      'send-batch',
      { emails },
      {
        delay: options?.delay,
        priority: options?.priority || -5, // Lower priority for batch jobs
        attempts: options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 5,
        removeOnFail: 3,
      },
    );
  }

  // Queue management methods
  async getEmailQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaiting(),
      this.emailQueue.getActive(),
      this.emailQueue.getCompleted(),
      this.emailQueue.getFailed(),
      this.emailQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async pauseEmailQueue() {
    return this.emailQueue.pause();
  }

  async resumeEmailQueue() {
    return this.emailQueue.resume();
  }

  async clearEmailQueue() {
    await this.emailQueue.empty();
    return { message: 'Email queue cleared' };
  }

  async getFailedJobs(limit = 10) {
    return this.emailQueue.getFailed(0, limit - 1);
  }

  async retryFailedJob(jobId: string) {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      return job.retry();
    }
    throw new Error(`Job ${jobId} not found`);
  }

  async removeJob(jobId: string) {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      return job.remove();
    }
    throw new Error(`Job ${jobId} not found`);
  }

  // Scheduled email methods
  async scheduleWelcomeEmail(
    to: string,
    data: WelcomeEmailData,
    scheduleDate: Date,
  ) {
    const delay = scheduleDate.getTime() - Date.now();
    if (delay < 0) {
      throw new Error('Cannot schedule email in the past');
    }

    return this.addWelcomeEmail(to, data, { delay });
  }

  async scheduleNotificationEmail(
    to: string,
    data: NotificationEmailData,
    scheduleDate: Date,
    subject?: string,
  ) {
    const delay = scheduleDate.getTime() - Date.now();
    if (delay < 0) {
      throw new Error('Cannot schedule email in the past');
    }

    return this.addNotificationEmail(to, data, { delay, subject });
  }

  // Bulk operations
  async addBulkWelcomeEmails(
    recipients: Array<{ to: string; data: WelcomeEmailData }>,
    options?: {
      delay?: number;
      priority?: number;
      batchSize?: number;
    },
  ) {
    const batchSize = options?.batchSize || 50;
    const jobs: EmailJob[] = recipients.map(({ to, data }) => ({
      to,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      data,
    }));

    // Process in batches to avoid overwhelming the queue
    const batches: EmailJob[][] = [];
    for (let i = 0; i < jobs.length; i += batchSize) {
      batches.push(jobs.slice(i, i + batchSize));
    }

    const results: any[] = [];
    for (const batch of batches) {
      const result = await this.addBatchEmails(batch, options);
      results.push(result);

      // Small delay between batches to prevent overwhelming
      if (batches.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // File processing queue methods
  async addImageResize(
    fileId: string,
    filePath: string,
    userId: string,
    options: ImageResizeOptions,
    jobOptions?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: FileProcessingJob = {
      fileId,
      filePath,
      userId,
      type: 'image-resize',
      options,
    };

    return this.fileQueue.add('image-resize', job, {
      delay: jobOptions?.delay,
      priority: jobOptions?.priority || 0,
      attempts: jobOptions?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  async addPdfGeneration(
    fileId: string,
    userId: string,
    options: PdfGenerateOptions,
    jobOptions?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: FileProcessingJob = {
      fileId,
      filePath: `temp/${fileId}`,
      userId,
      type: 'pdf-generate',
      options,
    };

    return this.fileQueue.add('pdf-generate', job, {
      delay: jobOptions?.delay,
      priority: jobOptions?.priority || 0,
      attempts: jobOptions?.attempts || 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  async addCsvExport(
    fileId: string,
    userId: string,
    options: CsvExportOptions,
    jobOptions?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: FileProcessingJob = {
      fileId,
      filePath: `exports/${fileId}`,
      userId,
      type: 'csv-export',
      options,
    };

    return this.fileQueue.add('csv-export', job, {
      delay: jobOptions?.delay,
      priority: jobOptions?.priority || 0,
      attempts: jobOptions?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  async addFileCleanup(
    fileId: string,
    filePath: string,
    userId: string,
    jobOptions?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: FileProcessingJob = {
      fileId,
      filePath,
      userId,
      type: 'file-cleanup',
    };

    return this.fileQueue.add('file-cleanup', job, {
      delay: jobOptions?.delay || 0,
      priority: jobOptions?.priority || -10, // Low priority for cleanup
      attempts: jobOptions?.attempts || 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 5,
      removeOnFail: 3,
    });
  }

  // Notification queue methods
  async addPushNotification(
    userId: string,
    title: string,
    message: string,
    data: PushNotificationData,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: NotificationJob = {
      userId,
      type: 'push',
      title,
      message,
      data,
    };

    return this.notificationQueue.add('push', job, {
      delay: options?.delay,
      priority: options?.priority || 5,
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 20,
      removeOnFail: 10,
    });
  }

  async addSmsNotification(
    userId: string,
    title: string,
    message: string,
    data: SmsNotificationData,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: NotificationJob = {
      userId,
      type: 'sms',
      title,
      message,
      data,
    };

    return this.notificationQueue.add('sms', job, {
      delay: options?.delay,
      priority: options?.priority || 8, // Higher priority for SMS
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: 20,
      removeOnFail: 10,
    });
  }

  async addWebhookNotification(
    userId: string,
    title: string,
    message: string,
    data: WebhookNotificationData,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: NotificationJob = {
      userId,
      type: 'webhook',
      title,
      message,
      data,
    };

    return this.notificationQueue.add('webhook', job, {
      delay: options?.delay,
      priority: options?.priority || 0,
      attempts: options?.attempts || 5, // More retries for webhooks
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 15,
      removeOnFail: 10,
    });
  }

  async addInAppNotification(
    userId: string,
    title: string,
    message: string,
    data: InAppNotificationData,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ) {
    const job: NotificationJob = {
      userId,
      type: 'in-app',
      title,
      message,
      data,
    };

    return this.notificationQueue.add('in-app', job, {
      delay: options?.delay,
      priority: options?.priority || 0,
      attempts: options?.attempts || 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 50,
      removeOnFail: 10,
    });
  }

  // Queue management methods for all queues
  async getAllQueueStats() {
    const [emailStats, fileStats, notificationStats] = await Promise.all([
      this.getEmailQueueStats(),
      this.getFileQueueStats(),
      this.getNotificationQueueStats(),
    ]);

    return {
      email: emailStats,
      file: fileStats,
      notification: notificationStats,
    };
  }

  async getFileQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.fileQueue.getWaiting(),
      this.fileQueue.getActive(),
      this.fileQueue.getCompleted(),
      this.fileQueue.getFailed(),
      this.fileQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async getNotificationQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.notificationQueue.getWaiting(),
      this.notificationQueue.getActive(),
      this.notificationQueue.getCompleted(),
      this.notificationQueue.getFailed(),
      this.notificationQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async pauseAllQueues() {
    await Promise.all([
      this.emailQueue.pause(),
      this.fileQueue.pause(),
      this.notificationQueue.pause(),
    ]);
    return { message: 'All queues paused' };
  }

  async resumeAllQueues() {
    await Promise.all([
      this.emailQueue.resume(),
      this.fileQueue.resume(),
      this.notificationQueue.resume(),
    ]);
    return { message: 'All queues resumed' };
  }

  async clearAllQueues() {
    await Promise.all([
      this.emailQueue.empty(),
      this.fileQueue.empty(),
      this.notificationQueue.empty(),
    ]);
    return { message: 'All queues cleared' };
  }
}
