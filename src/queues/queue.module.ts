import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email.queue';
import { FileProcessor } from './file.queue';
import { NotificationProcessor } from './notification.queue';
import { QueueService } from './queue.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'email',
      },
      {
        name: 'file',
      },
      {
        name: 'notification',
      },
    ),
    EmailModule,
  ],
  providers: [
    EmailProcessor,
    FileProcessor,
    NotificationProcessor,
    QueueService,
  ],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
