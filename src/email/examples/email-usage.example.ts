import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';
import {
  WelcomeEmail,
  ResetPasswordEmail,
  NotificationEmail,
} from '../templates';

@Injectable()
export class EmailExamples {
  constructor(private emailService: EmailService) {}

  // Example: Send welcome email
  async sendWelcomeEmail(userEmail: string, userName: string) {
    return this.emailService.sendEmail({
      to: userEmail,
      subject: 'Welcome to Our Platform!',
      react: WelcomeEmail({
        name: userName,
        loginUrl: 'https://yourdomain.com/login',
      }),
    });
  }

  // Example: Send password reset email
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string,
  ) {
    const resetLink = `https://yourdomain.com/reset-password?token=${resetToken}`;

    return this.emailService.sendEmail({
      to: userEmail,
      subject: 'Reset Your Password',
      react: ResetPasswordEmail({
        name: userName,
        resetLink,
        expiresIn: '1 hour',
      }),
    });
  }

  // Example: Send notification email
  async sendNotificationEmail(
    userEmail: string,
    userName: string,
    title: string,
    message: string,
  ) {
    return this.emailService.sendEmail({
      to: userEmail,
      subject: title,
      react: NotificationEmail({
        name: userName,
        title,
        message,
        type: 'info',
        actionUrl: 'https://yourdomain.com/dashboard',
        actionText: 'View Dashboard',
      }),
    });
  }

  // Example: Send batch emails
  async sendBatchNotifications(
    users: Array<{ email: string; name: string }>,
    title: string,
    message: string,
  ) {
    const emails = users.map((user) => ({
      to: user.email,
      subject: title,
      react: NotificationEmail({
        name: user.name,
        title,
        message,
        type: 'info' as const,
      }),
    }));

    return this.emailService.sendBatch(emails);
  }

  // Example: Send plain HTML email
  async sendPlainHtmlEmail(userEmail: string) {
    return this.emailService.sendEmail({
      to: userEmail,
      subject: 'Plain HTML Email',
      html: `
        <h1>Hello!</h1>
        <p>This is a plain HTML email.</p>
        <a href="https://yourdomain.com">Visit our website</a>
      `,
    });
  }

  // Example: Send email with attachments
  async sendEmailWithAttachment(userEmail: string, attachmentData: Buffer) {
    return this.emailService.sendEmail({
      to: userEmail,
      subject: 'Email with Attachment',
      html: '<p>Please find the attachment below.</p>',
      attachments: [
        {
          filename: 'document.pdf',
          content: attachmentData,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  // Example: Schedule email for later
  async scheduleEmail(userEmail: string, userName: string, scheduledAt: Date) {
    return this.emailService.sendEmail({
      to: userEmail,
      subject: 'Scheduled Email',
      react: NotificationEmail({
        name: userName,
        title: 'This is a scheduled email',
        message: 'This email was scheduled to be sent at a specific time.',
        type: 'info',
      }),
      scheduledAt: scheduledAt.toISOString(),
    });
  }
}
