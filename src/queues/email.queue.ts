import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import {
  WelcomeEmail,
  ResetPasswordEmail,
  NotificationEmail,
} from '../email/templates';

export interface EmailJob {
  to: string;
  subject: string;
  template: 'welcome' | 'reset-password' | 'notification';
  data: Record<string, any>;
}

export interface WelcomeEmailData {
  name: string;
  loginUrl?: string;
}

export interface ResetPasswordEmailData {
  name: string;
  resetLink: string;
  expiresIn?: string;
}

export interface NotificationEmailData {
  name: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-welcome')
  async handleWelcomeEmail(job: Job<EmailJob>) {
    try {
      this.logger.log(`Processing welcome email for ${job.data.to}`);

      const data = job.data.data as WelcomeEmailData;

      await this.emailService.sendEmail({
        to: job.data.to,
        subject: job.data.subject,
        react: WelcomeEmail({
          name: data.name,
          loginUrl: data.loginUrl,
        }),
      });

      this.logger.log(`Welcome email sent successfully to ${job.data.to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${job.data.to}`,
        error,
      );
      throw error;
    }
  }

  @Process('send-reset-password')
  async handleResetPasswordEmail(job: Job<EmailJob>) {
    try {
      this.logger.log(`Processing reset password email for ${job.data.to}`);

      const data = job.data.data as ResetPasswordEmailData;

      await this.emailService.sendEmail({
        to: job.data.to,
        subject: job.data.subject,
        react: ResetPasswordEmail({
          name: data.name,
          resetLink: data.resetLink,
          expiresIn: data.expiresIn,
        }),
      });

      this.logger.log(
        `Reset password email sent successfully to ${job.data.to}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${job.data.to}`,
        error,
      );
      throw error;
    }
  }

  @Process('send-notification')
  async handleNotificationEmail(job: Job<EmailJob>) {
    try {
      this.logger.log(`Processing notification email for ${job.data.to}`);

      const data = job.data.data as NotificationEmailData;

      await this.emailService.sendEmail({
        to: job.data.to,
        subject: job.data.subject,
        react: NotificationEmail({
          name: data.name,
          title: data.title,
          message: data.message,
          type: data.type,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
        }),
      });

      this.logger.log(`Notification email sent successfully to ${job.data.to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send notification email to ${job.data.to}`,
        error,
      );
      throw error;
    }
  }

  @Process('send-batch')
  async handleBatchEmail(job: Job<{ emails: EmailJob[] }>) {
    try {
      this.logger.log(
        `Processing batch email job with ${job.data.emails.length} emails`,
      );

      const emailPromises = job.data.emails.map((emailJob) => {
        switch (emailJob.template) {
          case 'welcome': {
            const welcomeData = emailJob.data as WelcomeEmailData;
            return {
              to: emailJob.to,
              subject: emailJob.subject,
              react: WelcomeEmail({
                name: welcomeData.name,
                loginUrl: welcomeData.loginUrl,
              }),
            };
          }
          case 'notification': {
            const notificationData = emailJob.data as NotificationEmailData;
            return {
              to: emailJob.to,
              subject: emailJob.subject,
              react: NotificationEmail({
                name: notificationData.name,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type,
                actionUrl: notificationData.actionUrl,
                actionText: notificationData.actionText,
              }),
            };
          }
          default:
            throw new Error(`Unknown email template: ${emailJob.template}`);
        }
      });

      const emails = await Promise.all(emailPromises);
      await this.emailService.sendBatch(emails);

      this.logger.log(
        `Batch email sent successfully (${emails.length} emails)`,
      );
      return { success: true, count: emails.length };
    } catch (error) {
      this.logger.error(`Failed to send batch emails`, error);
      throw error;
    }
  }
}
