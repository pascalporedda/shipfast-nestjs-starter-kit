import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as React from 'react';

export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
  headers?: Record<string, string>;
  scheduledAt?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    this.resend = new Resend(apiKey);
    this.defaultFrom = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'noreply@yourdomain.com',
    );
  }

  async sendEmail(options: SendEmailOptions) {
    try {
      const {
        react,
        html,
        text,
        from = this.defaultFrom,
        ...restOptions
      } = options;

      let emailHtml = html;
      let emailText = text;

      if (react && !html) {
        emailHtml = await render(react);
      }

      // Ensure either html, react, or text is provided
      if (!emailHtml && !react && !emailText) {
        emailText = 'This email was sent without content.';
      }

      // Build the email payload with proper typing
      const emailPayload = {
        from,
        ...restOptions,
        ...(react && { react }),
        ...(emailHtml && { html: emailHtml }),
        ...(emailText && { text: emailText }),
      };

      const result = await this.resend.emails.send(emailPayload as any);

      this.logger.log(`Email sent successfully: ${result.data?.id}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }

  async sendBatch(emails: SendEmailOptions[]) {
    try {
      const batchEmails = await Promise.all(
        emails.map(async (email) => {
          const {
            react,
            html,
            text,
            from = this.defaultFrom,
            ...restOptions
          } = email;

          let emailHtml = html;
          let emailText = text;

          if (react && !html) {
            emailHtml = await render(react);
          }

          // Ensure either html, react, or text is provided
          if (!emailHtml && !react && !emailText) {
            emailText = 'This email was sent without content.';
          }

          // Build the email payload with proper typing
          return {
            from,
            ...restOptions,
            ...(react && { react }),
            ...(emailHtml && { html: emailHtml }),
            ...(emailText && { text: emailText }),
          };
        }),
      );

      const result = await this.resend.batch.send(batchEmails as any);
      this.logger.log(`Batch emails sent successfully`);
      return result;
    } catch (error) {
      this.logger.error('Failed to send batch emails', error);
      throw error;
    }
  }

  async getEmail(emailId: string) {
    try {
      const result = await this.resend.emails.get(emailId);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get email ${emailId}`, error);
      throw error;
    }
  }

  async cancelEmail(emailId: string): Promise<any> {
    try {
      const result = await this.resend.emails.cancel(emailId);
      this.logger.log(`Email ${emailId} cancelled successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to cancel email ${emailId}`, error);
      throw error;
    }
  }
}
