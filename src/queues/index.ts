export { QueueModule } from './queue.module';
export { QueueService } from './queue.service';

// Email queue exports
export type {
  EmailJob,
  WelcomeEmailData,
  ResetPasswordEmailData,
  NotificationEmailData,
} from './email.queue';

// File queue exports
export type {
  FileProcessingJob,
  ImageResizeOptions,
  PdfGenerateOptions,
  CsvExportOptions,
} from './file.queue';

// Notification queue exports
export type {
  NotificationJob,
  PushNotificationData,
  SmsNotificationData,
  WebhookNotificationData,
  InAppNotificationData,
} from './notification.queue';
